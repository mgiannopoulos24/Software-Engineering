package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.Ship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface για την πρόσβαση στα στατικά δεδομένα της οντότητας {@link Ship}.
 */
@Repository
public interface ShipRepository extends JpaRepository<Ship, Long> {

    /**
     * Βρίσκει ένα πλοίο βάσει του μοναδικού του MMSI.
     *
     * @param mmsi Το MMSI του πλοίου προς αναζήτηση.
     * @return Ένα Optional που περιέχει την οντότητα Ship αν βρεθεί, αλλιώς είναι κενό.
     */
    Optional<Ship> findByMmsi(Long mmsi);
}