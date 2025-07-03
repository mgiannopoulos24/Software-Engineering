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

import java.util.Optional;

@Service
public class AdminService {

    private final ShipRepository shipRepository;
    private final AisDataRepository aisDataRepository;

    @Autowired
    public AdminService(ShipRepository shipRepository, AisDataRepository aisDataRepository) {
        this.shipRepository = shipRepository;
        this.aisDataRepository = aisDataRepository; // <-- ΠΡΟΣΘΗΚΗ
    }

    /**
     * Ενημερώνει τον τύπο ενός πλοίου και επιστρέφει τις πλήρεις λεπτομέρειές του.
     *
     * @param mmsi Το MMSI του πλοίου προς τροποποίηση.
     * @param newShipType Ο νέος τύπος του πλοίου.
     * @return Το ενημερωμένο ShipDetailsDTO.
     */
    @Transactional
    public ShipDetailsDTO updateShipType(Long mmsi, ShipType newShipType) { // <-- ΑΛΛΑΓΗ ΤΥΠΟΥ ΕΠΙΣΤΡΟΦΗΣ
        Ship shipToUpdate = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        shipToUpdate.setShiptype(newShipType);
        Ship updatedShip = shipRepository.save(shipToUpdate);

        // Αφού ενημερώσαμε το πλοίο, τώρα θα συνθέσουμε το DTO για να το επιστρέψουμε.
        ShipDetailsDTO dto = new ShipDetailsDTO();
        dto.setMmsi(updatedShip.getMmsi());
        dto.setShiptype(updatedShip.getShiptype());

        Optional<AisData> latestAisData = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(mmsi.toString());
        latestAisData.ifPresent(ais -> {
            dto.setNavigationalStatus(ais.getNavigationalStatus());
            dto.setRateOfTurn(ais.getRateOfTurn());
            dto.setSpeedOverGround(ais.getSpeedOverGround());
            dto.setCourseOverGround(ais.getCourseOverGround());
            dto.setTrueHeading(ais.getTrueHeading());
            dto.setLongitude(ais.getLongitude());
            dto.setLatitude(ais.getLatitude());
            dto.setLastUpdateTimestampEpoch(ais.getTimestampEpoch());
        });

        return dto;
    }
}
