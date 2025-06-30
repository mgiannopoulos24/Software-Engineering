package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final ShipRepository shipRepository;

    @Autowired
    public AdminService(ShipRepository shipRepository) {
        this.shipRepository = shipRepository;
    }

    /**
     * Ενημερώνει τον τύπο ενός πλοίου.
     *
     * @param mmsi Το MMSI του πλοίου προς τροποποίηση.
     * @param newShipType Ο νέος τύπος του πλοίου.
     * @return Το ενημερωμένο αντικείμενο Ship.
     * @throws ResourceNotFoundException αν δεν βρεθεί πλοίο με το δεδομένο MMSI.
     */
    @Transactional
    public Ship updateShipType(Long mmsi, ShipType newShipType) {
        // Βρίσκουμε το πλοίο με βάση το MMSI. Αν δεν υπάρχει, πετάμε τη custom exception.
        Ship shipToUpdate = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        // Ενημερώνουμε τον τύπο του πλοίου.
        shipToUpdate.setShiptype(newShipType);

        // Αποθηκεύουμε το ενημερωμένο πλοίο. Το JPA θα κάνει αυτόματα UPDATE.
        return shipRepository.save(shipToUpdate);
    }
}
