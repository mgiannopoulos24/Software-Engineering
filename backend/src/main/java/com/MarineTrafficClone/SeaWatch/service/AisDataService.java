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

@Service
public class AisDataService {
    private final AisDataRepository aisDataRepository;
    private final ShipRepository shipRepository;

    @Autowired
    public AisDataService(AisDataRepository aisDataRepository, ShipRepository shipRepository) {
        this.aisDataRepository = aisDataRepository;
        this.shipRepository = shipRepository;
    }

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
     * Ανακτά την πορεία (track) ενός πλοίου για τις τελευταίες 12 ώρες
     * με βάση την "ώρα προσομοίωσης" (δηλαδή, το πιο πρόσφατο στίγμα του πλοίου).
     *
     * @param mmsi Το MMSI του πλοίου.
     * @return Μια λίστα από TrackPointDTO που αναπαριστούν την πορεία.
     */
    public List<TrackPointDTO> getShipTrack(String mmsi) {
        // 1. Βρες την πιο πρόσφατη εγγραφή AIS για το συγκεκριμένο πλοίο.
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

        // 5. Μετατροπή της λίστας από AisData σε TrackPointDTO για να επιστραφεί στο frontend.
        return aisDataList.stream()
                .map(ais -> new TrackPointDTO(ais.getLatitude(), ais.getLongitude(), ais.getTimestampEpoch()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShipDetailsDTO getShipDetails(Long mmsi) {
        // 1. Βρες το πλοίο. Αν δεν υπάρχει, θα επιστρέψει 404.
        Ship ship = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        // 2. Δημιούργησε το DTO και γέμισε τα στατικά δεδομένα από το πλοίο.
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

        // 5. Επίστρεψε το DTO. Θα είναι πλήρες αν βρέθηκαν AIS data, ή μερικώς γεμάτο αν δεν βρέθηκαν.
        return detailsDTO;
    }

    /**
     * Ανακτά την τελευταία γνωστή, πλήρη κατάσταση για όλα τα πλοία στο σύστημα.
     * Ιδανικό για την αρχική φόρτωση του χάρτη.
     *
     * @return Μια λίστα από ShipDetailsDTO, ένα για κάθε πλοίο.
     */
    @Transactional(readOnly = true)
    public List<ShipDetailsDTO> getAllActiveShipsDetails() {
        // 1. Βρες όλα τα πλοία που είναι καταχωρημένα στο σύστημα.
        List<Ship> allShips = shipRepository.findAll();

        if (allShips.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Μάζεψε όλα τα MMSI από αυτά τα πλοία.
        List<String> allMmsiList = allShips.stream()
                .map(ship -> ship.getMmsi().toString())
                .collect(Collectors.toList());

        // 3. Κάνε ΕΝΑ αποδοτικό query για να πάρεις τα τελευταία AIS data για ΟΛΑ τα πλοία.
        List<AisData> latestAisDataList = aisDataRepository.findLatestAisDataForMmsiList(allMmsiList);

        // 4. Μετέτρεψε τη λίστα σε Map για γρήγορη πρόσβαση (MMSI -> AisData) για O(1) lookup.
        Map<String, AisData> latestAisDataMap = latestAisDataList.stream()
                .collect(Collectors.toMap(AisData::getMmsi, data -> data));

        // 5. Συνδύασε τα στατικά δεδομένα των πλοίων με τα τελευταία δυναμικά τους δεδομένα.
        return allShips.stream().map(ship -> {
            ShipDetailsDTO dto = new ShipDetailsDTO();
            // Γέμισε τα στατικά δεδομένα
            dto.setMmsi(ship.getMmsi());
            dto.setShiptype(ship.getShiptype());

            // Βρες τα τελευταία δυναμικά δεδομένα από το Map
            AisData latestData = latestAisDataMap.get(ship.getMmsi().toString());
            if (latestData != null) {
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
        }).filter(dto -> dto.getLongitude() != null && dto.getLatitude() != null)
        .collect(Collectors.toList());
    }
}
