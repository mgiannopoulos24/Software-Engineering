package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface για την πρόσβαση στα δεδομένα της οντότητας {@link UserEntity}.
 */
@Repository
public interface UserEntityRepository extends JpaRepository<UserEntity, Long> {

    /**
     * Βρίσκει έναν χρήστη βάσει του email του, το οποίο είναι μοναδικό.
     * Χρησιμοποιείται κυρίως κατά τη διαδικασία σύνδεσης (login).
     *
     * @param email Το email του χρήστη.
     * @return Ένα Optional που περιέχει τον χρήστη αν βρεθεί.
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * Βρίσκει όλους τους χρήστες που έχουν έναν συγκεκριμένο ρόλο.
     * Χρήσιμο κατά την δημιουργία του hard-coded admin.
     *
     * @param type Ο ρόλος προς αναζήτηση.
     * @return Μια λίστα με τους χρήστες που έχουν τον συγκεκριμένο ρόλο.
     */
    @Query("SELECT u FROM UserEntity u WHERE u.role = :type")
    List<UserEntity> findByRole(@PathVariable RoleType type);

    /**
     * Βρίσκει όλους τους χρήστες που παρακολουθούν (έχουν στον στόλο τους)
     * ένα συγκεκριμένο πλοίο βάσει του MMSI του.
     * Αυτό είναι κρίσιμο για την αποστολή ιδιωτικών ενημερώσεων WebSocket (fleet updates).
     *
     * @param mmsi Το MMSI του πλοίου.
     * @return Μια λίστα με τους χρήστες που παρακολουθούν το πλοίο.
     */
    @Query("SELECT u FROM UserEntity u JOIN u.fleet s WHERE s.mmsi = :mmsi")
    List<UserEntity> findUsersWatchingMmsi(Long mmsi);
}