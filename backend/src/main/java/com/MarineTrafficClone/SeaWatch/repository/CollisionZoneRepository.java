package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository interface για την πρόσβαση στα δεδομένα της οντότητας {@link CollisionZone}.
 * Παρέχει τις βασικές CRUD λειτουργίες μέσω της κληρονόμησης από το JpaRepository.
 */
@Repository
public interface CollisionZoneRepository extends JpaRepository<CollisionZone, Long> {

    /**
     * Βρίσκει τη μοναδική ζώνη σύγκρουσης που ανήκει σε έναν συγκεκριμένο χρήστη,
     * βάσει του ID του χρήστη.
     *
     * @param userId Το ID του χρήστη.
     * @return Ένα Optional που περιέχει την CollisionZone αν βρεθεί, αλλιώς είναι κενό.
     */
    Optional<CollisionZone> findByUserId(Long userId);
}