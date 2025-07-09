package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service που περιέχει την επιχειρησιακή λογική (business logic)
 * για τις λειτουργίες που εκτελούνται από διαχειριστές (Admins).
 */
@Service
public class AdminService {

    private final ShipRepository shipRepository;
    private final AisDataRepository aisDataRepository; // Απαιτείται για την ανάκτηση των τελευταίων δυναμικών δεδομένων.

    @Autowired
    public AdminService(ShipRepository shipRepository, AisDataRepository aisDataRepository) {
        this.shipRepository = shipRepository;
        this.aisDataRepository = aisDataRepository;
    }

    /**
     * Ενημερώνει τον τύπο ενός πλοίου και επιστρέφει τις πλήρεις, ενημερωμένες λεπτομέρειές του.
     * Η λειτουργία εκτελείται μέσα σε μια συναλλαγή (transaction) για να διασφαλιστεί η ακεραιότητα των δεδομένων.
     *
     * @param mmsi Το MMSI του πλοίου προς τροποποίηση.
     * @param newShipType Ο νέος τύπος του πλοίου.
     * @return Ένα DTO (ShipDetailsDTO) με τα πλήρη, ενημερωμένα στοιχεία του πλοίου.
     * @throws ResourceNotFoundException αν δεν βρεθεί πλοίο με το συγκεκριμένο MMSI.
     */
    @Transactional
    public ShipDetailsDTO updateShipType(Long mmsi, ShipType newShipType) {
        Ship shipToUpdate = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        shipToUpdate.setShiptype(newShipType);
        Ship updatedShip = shipRepository.save(shipToUpdate);

        return createShipDetailsDTO(updatedShip);
    }

    /**
     * Ανακτά όλα τα πλοία που είναι καταχωρημένα στο σύστημα, μαζί με τα τελευταία
     * δυναμικά τους δεδομένα, αν υπάρχουν. Δεν φιλτράρει πλοία χωρίς δεδομένα θέσης.
     *
     * @return Μια λίστα από ShipDetailsDTO, ένα για κάθε πλοίο στη βάση.
     */
    @Transactional(readOnly = true)
    public List<ShipDetailsDTO> getAllShipsForAdmin() {
        List<Ship> allShips = shipRepository.findAll();
        if (allShips.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> allMmsiList = allShips.stream()
                .map(ship -> ship.getMmsi().toString())
                .collect(Collectors.toList());

        List<AisData> latestAisDataList = aisDataRepository.findLatestAisDataForMmsiList(allMmsiList);
        Map<String, AisData> latestAisDataMap = latestAisDataList.stream()
                .collect(Collectors.toMap(AisData::getMmsi, data -> data));

        return allShips.stream()
                .map(ship -> {
                    ShipDetailsDTO dto = createShipDetailsDTO(ship);
                    AisData latestData = latestAisDataMap.get(ship.getMmsi().toString());
                    if (latestData != null) {
                        populateDynamicData(dto, latestData);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Βοηθητική μέθοδος για τη δημιουργία ενός DTO από μια οντότητα Ship.
     * @param ship Η οντότητα Ship.
     * @return Το αρχικό ShipDetailsDTO με τα στατικά δεδομένα.
     */
    private ShipDetailsDTO createShipDetailsDTO(Ship ship) {
        ShipDetailsDTO dto = new ShipDetailsDTO();
        dto.setMmsi(ship.getMmsi());
        dto.setShiptype(ship.getShiptype());
        return dto;
    }

    /**
     * Βοηθητική μέθοδος για την πλήρωση των δυναμικών δεδομένων σε ένα DTO.
     * @param dto Το DTO προς ενημέρωση.
     * @param ais Η οντότητα AisData με τα δυναμικά δεδομένα.
     */
    private void populateDynamicData(ShipDetailsDTO dto, AisData ais) {
        dto.setNavigationalStatus(ais.getNavigationalStatus());
        dto.setRateOfTurn(ais.getRateOfTurn());
        dto.setSpeedOverGround(ais.getSpeedOverGround());
        dto.setCourseOverGround(ais.getCourseOverGround());
        dto.setTrueHeading(ais.getTrueHeading());
        dto.setLongitude(ais.getLongitude());
        dto.setLatitude(ais.getLatitude());
        dto.setLastUpdateTimestampEpoch(ais.getTimestampEpoch());
    }
}