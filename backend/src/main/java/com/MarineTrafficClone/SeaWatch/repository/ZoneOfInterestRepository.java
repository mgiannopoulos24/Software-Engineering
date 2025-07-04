package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface για την πρόσβαση στα δεδομένα της οντότητας {@link ZoneOfInterest}.
 */
@Repository
public interface ZoneOfInterestRepository extends JpaRepository<ZoneOfInterest, Long> {

    /**
     * Βρίσκει τη μοναδική ζώνη ενδιαφέροντος που ανήκει σε έναν συγκεκριμένο χρήστη,
     * βάσει του ID του χρήστη.
     *
     * @param userId Το ID του χρήστη.
     * @return Ένα Optional που περιέχει την ZoneOfInterest αν βρεθεί.
     */
    Optional<ZoneOfInterest> findByUserId(Long userId);
}