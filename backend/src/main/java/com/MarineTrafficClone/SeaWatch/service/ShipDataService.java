package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.TrackPointDTO;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service που περιέχει την επιχειρησιακή λογική για την ανάκτηση και επεξεργασία
 * δεδομένων πλοίων (τόσο δυναμικών AIS όσο και στατικών).
 */
@Service
public class ShipDataService {
    private final AisDataRepository aisDataRepository;
    private final ShipRepository shipRepository;

    @Autowired
    public ShipDataService(AisDataRepository aisDataRepository, ShipRepository shipRepository) {
        this.aisDataRepository = aisDataRepository;
        this.shipRepository = shipRepository;
    }

    // Οι παρακάτω μέθοδοι getAisData, getAisDataById, addAisData είναι για debugging και testing
    public List<AisData> getAisData() {
        return aisDataRepository.findAll();
    }

    public AisData insertAisData(AisData aisData) {
        aisDataRepository.save(aisData);
        return aisData;
    }

    public AisData getAisDataById(Long id) {
        return aisDataRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AisData not found with id: " + id));
    }

    /**
     * Ανακτά την πορεία (track) ενός πλοίου για τις τελευταίες 12 ώρες.
     * Ο υπολογισμός των 12 ωρών γίνεται προς τα πίσω από την "ώρα προσομοίωσης",
     * η οποία ορίζεται ως η χρονοσφραγίδα του πιο πρόσφατου στίγματος του πλοίου.
     *
     * @param mmsi Το MMSI του πλοίου.
     * @return Μια λίστα από TrackPointDTO που αναπαριστούν την πορεία, ή κενή λίστα αν δεν υπάρχουν δεδομένα.
     */
    public List<TrackPointDTO> getShipTrack(String mmsi) {
        // 1. Βρες την πιο πρόσφατη εγγραφή AIS για το συγκεκριμένο πλοίο για να ορίσεις την "τώρα" ώρα.
        Optional<AisData> latestAisDataOptional = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(mmsi);

        if (latestAisDataOptional.isEmpty()) {
            // Αν δεν υπάρχει κανένα δεδομένο για αυτό το πλοίο, επίστρεψε μια κενή λίστα.
            return Collections.emptyList();
        }

        // 2. Πάρε τη χρονοσφραγίδα του πιο πρόσφατου στίγματος. Αυτή είναι η "τώρα" της προσομοίωσης.
        long latestTimestamp = latestAisDataOptional.get().getTimestampEpoch();

        // 3. Υπολόγισε το όριο των 12 ωρών προς τα πίσω από αυτή τη χρονοσφραγίδα.
        long twelveHoursAgoSimulationTime = latestTimestamp - Duration.ofHours(12).toSeconds();

        // 4. Κάνε το query στη βάση για να πάρεις όλα τα δεδομένα μέσα σε αυτό το χρονικό παράθυρο.
        List<AisData> aisDataList = aisDataRepository.findByMmsiAndTimestampEpochAfterOrderByTimestampEpochAsc(mmsi, twelveHoursAgoSimulationTime);

        // 5. Μετατροπή της λίστας από AisData σε μια πιο "ελαφριά" λίστα από TrackPointDTO για να επιστραφεί στο frontend.
        return aisDataList.stream()
                .map(ais -> new TrackPointDTO(ais.getLatitude(), ais.getLongitude(), ais.getTimestampEpoch()))
                .collect(Collectors.toList());
    }

    /**
     * Ανακτά τις πλήρεις λεπτομέρειες ενός πλοίου, συνδυάζοντας τα στατικά του στοιχεία
     * με την τελευταία γνωστή δυναμική του κατάσταση από τα AIS δεδομένα.
     * @param mmsi Το MMSI του πλοίου.
     * @return Ένα ShipDetailsDTO με τα συνδυασμένα δεδομένα.
     */
    @Transactional(readOnly = true)
    public ShipDetailsDTO getShipDetails(Long mmsi) {
        // 1. Βρες το πλοίο (στατικά στοιχεία). Αν δεν υπάρχει, θα προκληθεί εξαίρεση ResourceNotFoundException.
        Ship ship = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        // 2. Δημιούργησε το DTO και γέμισε τα στατικά δεδομένα.
        ShipDetailsDTO detailsDTO = new ShipDetailsDTO();
        detailsDTO.setMmsi(ship.getMmsi());
        detailsDTO.setShiptype(ship.getShiptype());

        // 3. Βρες την πιο πρόσφατη εγγραφή AIS για αυτό το πλοίο.
        Optional<AisData> latestAisDataOptional = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(mmsi.toString());

        // 4. Αν υπάρχουν δυναμικά δεδομένα, γέμισε και τα υπόλοιπα πεδία του DTO.
        latestAisDataOptional.ifPresent(latestAis -> {
            detailsDTO.setNavigationalStatus(latestAis.getNavigationalStatus());
            detailsDTO.setRateOfTurn(latestAis.getRateOfTurn());
            detailsDTO.setSpeedOverGround(latestAis.getSpeedOverGround());
            detailsDTO.setCourseOverGround(latestAis.getCourseOverGround());
            detailsDTO.setTrueHeading(latestAis.getTrueHeading());
            detailsDTO.setLongitude(latestAis.getLongitude());
            detailsDTO.setLatitude(latestAis.getLatitude());
            detailsDTO.setLastUpdateTimestampEpoch(latestAis.getTimestampEpoch());
        });

        // 5. Επίστρεψε το DTO.
        return detailsDTO;
    }

    /**
     * Ανακτά την τελευταία γνωστή, πλήρη κατάσταση για όλα τα πλοία στο σύστημα.
     * Είναι μια βελτιστοποιημένη μέθοδος ιδανική για την αρχική φόρτωση του χάρτη στο frontend.
     *
     * @return Μια λίστα από ShipDetailsDTO, ένα για κάθε πλοίο.
     */
    @Transactional(readOnly = true)
    public List<ShipDetailsDTO> getAllActiveShipsDetails() {
        // 1. Βρες όλα τα πλοία που είναι καταχωρημένα στο σύστημα (στατικά δεδομένα).
        List<Ship> allShips = shipRepository.findAll();

        if (allShips.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Μάζεψε όλα τα MMSI από αυτά τα πλοία σε μια λίστα.
        List<String> allMmsiList = allShips.stream()
                .map(ship -> ship.getMmsi().toString())
                .collect(Collectors.toList());

        // 3. Κάνε ΕΝΑ αποδοτικό query για να πάρεις τα τελευταία AIS data για ΟΛΑ τα πλοία ταυτόχρονα.
        List<AisData> latestAisDataList = aisDataRepository.findLatestAisDataForMmsiList(allMmsiList);

        // 4. Μετέτρεψε τη λίστα των AIS data σε ένα Map για γρήγορη πρόσβαση (MMSI -> AisData) με O(1) πολυπλοκότητα.
        Map<String, AisData> latestAisDataMap = latestAisDataList.stream()
                .collect(Collectors.toMap(AisData::getMmsi, data -> data));

        // 5. Πέρνα πάνω από όλα τα πλοία και συνδύασε τα στατικά τους δεδομένα με τα τελευταία δυναμικά τους δεδομένα από το Map.
        return allShips.stream().map(ship -> {
                    ShipDetailsDTO dto = new ShipDetailsDTO();
                    // Γέμισε τα στατικά δεδομένα
                    dto.setMmsi(ship.getMmsi());
                    dto.setShiptype(ship.getShiptype());

                    // Βρες τα τελευταία δυναμικά δεδομένα από το Map
                    AisData latestData = latestAisDataMap.get(ship.getMmsi().toString());
                    if (latestData != null) {
                        // Αν βρέθηκαν, γέμισε τα υπόλοιπα πεδία του DTO.
                        dto.setNavigationalStatus(latestData.getNavigationalStatus());
                        dto.setRateOfTurn(latestData.getRateOfTurn());
                        dto.setSpeedOverGround(latestData.getSpeedOverGround());
                        dto.setCourseOverGround(latestData.getCourseOverGround());
                        dto.setTrueHeading(latestData.getTrueHeading());
                        dto.setLongitude(latestData.getLongitude());
                        dto.setLatitude(latestData.getLatitude());
                        dto.setLastUpdateTimestampEpoch(latestData.getTimestampEpoch());
                    }
                    return dto;
                }).filter(dto -> dto.getLongitude() != null && dto.getLatitude() != null) // Φιλτράρισμα για να μην στείλουμε πλοία χωρίς θέση
                .collect(Collectors.toList());
    }
}