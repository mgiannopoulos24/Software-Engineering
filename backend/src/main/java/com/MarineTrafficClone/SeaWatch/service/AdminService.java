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
        // 1. Βρες το πλοίο στη βάση. Αν δεν υπάρχει, προκάλεσε εξαίρεση.
        Ship shipToUpdate = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with MMSI: " + mmsi));

        // 2. Ενημέρωσε τον τύπο του πλοίου και αποθήκευσέ το.
        shipToUpdate.setShiptype(newShipType);
        Ship updatedShip = shipRepository.save(shipToUpdate);

        // 3. Αφού ενημερώθηκε το πλοίο, συνθέτουμε το DTO για να το επιστρέψουμε στον controller.
        // Αυτό εξασφαλίζει ότι το frontend λαμβάνει την πιο πρόσφατη κατάσταση.
        ShipDetailsDTO dto = new ShipDetailsDTO();
        dto.setMmsi(updatedShip.getMmsi());
        dto.setShiptype(updatedShip.getShiptype());

        // 4. Βρες τα τελευταία δυναμικά δεδομένα (AIS) για αυτό το πλοίο.
        Optional<AisData> latestAisData = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(mmsi.toString());

        // 5. Αν υπάρχουν, πρόσθεσέ τα στο DTO.
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

        // 6. Επίστρεψε το πλήρες DTO.
        return dto;
    }
}