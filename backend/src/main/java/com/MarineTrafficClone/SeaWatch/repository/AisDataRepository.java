package com.MarineTrafficClone.SeaWatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface για την πρόσβαση στα δεδομένα της οντότητας {@link AisData}.
 * Το Spring Data JPA θα υλοποιήσει αυτόματα αυτό το interface, παρέχοντας
 * τις βασικές CRUD λειτουργίες και τις προσαρμοσμένες μεθόδους που ορίζουμε εδώ.
 */
@Repository
public interface AisDataRepository extends JpaRepository<AisData, Long> {

    /**
     * Βρίσκει όλα τα δεδομένα AIS για ένα συγκεκριμένο MMSI που έχουν καταγραφεί
     * μετά από μια δεδομένη χρονική στιγμή (epoch seconds).
     * Τα αποτελέσματα επιστρέφονται ταξινομημένα κατά αύξουσα χρονική σειρά,
     * το οποίο είναι ιδανικό για την αναπαράσταση μιας πορείας (track).
     *
     * @param mmsi Το MMSI του πλοίου.
     * @param timestampEpoch Ο χρόνος (σε epoch seconds) μετά τον οποίο θα αναζητηθούν δεδομένα.
     * @return Μια λίστα με τα αντικείμενα AisData που ταιριάζουν.
     */
    List<AisData> findByMmsiAndTimestampEpochAfterOrderByTimestampEpochAsc(String mmsi, Long timestampEpoch);

    /**
     * Βρίσκει την πιο πρόσφατη (Top 1) εγγραφή AisData για ένα δεδομένο MMSI,
     * ταξινομώντας με βάση τη χρονοσφραγίδα σε φθίνουσα σειρά.
     *
     * @param mmsi Το MMSI του πλοίου.
     * @return Ένα Optional που περιέχει την πιο πρόσφατη AisData, ή κενό αν δεν βρεθεί καμία.
     */
    Optional<AisData> findTopByMmsiOrderByTimestampEpochDesc(String mmsi);

    /*
    /**
     * Βρίσκει την πιο πρόσφατη εγγραφή AisData για κάθε MMSI σε μια δεδομένη λίστα.
     * Χρησιμοποιεί ένα πιο σύνθετο JPQL query για βέλτιστη απόδοση, αποφεύγοντας το πρόβλημα N+1
     * που θα προέκυπτε αν καλούσαμε την findTopByMmsiOrderByTimestampEpochDesc σε ένα loop.
     * Το subquery `(SELECT MAX(a2.timestampEpoch) ...)` βρίσκει τη μέγιστη χρονοσφραγίδα για κάθε πλοίο,
     * και το εξωτερικό query επιστρέφει την πλήρη εγγραφή που αντιστοιχεί σε αυτή τη χρονοσφραγίδα.
     * Δεν τα πάει καλά με μεγάλους πίνακες όμως.
     *
     * @param mmsis Μια λίστα από MMSI (ως String).
     * @return Μια λίστα που περιέχει την τελευταία εγγραφή για κάθε πλοίο της λίστας εισόδου.
     */
    /*
    @Query("SELECT a FROM AisData a WHERE a.mmsi IN :mmsis AND a.timestampEpoch = (SELECT MAX(a2.timestampEpoch) FROM AisData a2 WHERE a2.mmsi = a.mmsi)")
    List<AisData> findLatestAisDataForMmsiList(@Param("mmsis") List<String> mmsis);
    */

    /**
     * Βρίσκει την πιο πρόσφατη εγγραφή AisData για κάθε MMSI σε μια δεδομένη λίστα.
     * Χρησιμοποιεί ένα αποδοτικό native SQL query με window functions (ROW_NUMBER)
     * αντί για ένα αργό correlated subquery, το οποίο είναι κρίσιμο για την απόδοση
     * σε μεγάλους πίνακες δεδομένων.
     *
     * @param mmsis Μια λίστα από MMSI (ως String).
     * @return Μια λίστα που περιέχει την τελευταία εγγραφή για κάθε πλοίο της λίστας εισόδου.
     */
    @Query(value = """
            WITH RankedAisData AS (
                SELECT *,
                       ROW_NUMBER() OVER(PARTITION BY mmsi ORDER BY timestamp_epoch DESC) as rn
                FROM ais_data
                WHERE mmsi IN (:mmsis)
            )
            SELECT id, mmsi, navigational_status, rate_of_turn, speed_over_ground, course_over_ground, true_heading, longitude, latitude, timestamp_epoch
            FROM RankedAisData
            WHERE rn = 1
            """, nativeQuery = true)
    List<AisData> findLatestAisDataForMmsiList(@Param("mmsis") List<String> mmsis);

    /**
     * Επιστρέφει τη μέγιστη (πιο πρόσφατη) χρονοσφραγίδα που υπάρχει στον πίνακα ais_data.
     * Χρήσιμο για να γνωρίζουμε την "τρέχουσα ώρα" της προσομοίωσης.
     *
     * @return Ένα Optional<Long> που περιέχει τη χρονοσφραγίδα, ή κενό αν ο πίνακας είναι άδειος.
     */
    @Query("SELECT MAX(a.timestampEpoch) FROM AisData a")
    Optional<Long> findLatestTimestampEpoch();

    /**
     * Διαγράφει όλες τις εγγραφές AisData που έχουν χρονοσφραγίδα παλαιότερη
     * από τη δεδομένη τιμή (cutoff). Χρησιμοποιείται για τον περιοδικό καθαρισμό της βάσης.
     * `@Modifying`: Ενημερώνει το Spring ότι αυτό το query δεν είναι ένα απλό SELECT, αλλά ένα query που τροποποιεί δεδομένα (DELETE ή UPDATE).
     * `@Transactional`: Εξασφαλίζει ότι η διαγραφή θα γίνει μέσα σε μια συναλλαγή (transaction).
     *
     * @param cutoffTimestampEpoch Το όριο χρονοσφραγίδας. Ό,τι είναι παλαιότερο θα διαγραφεί.
     */
    @Modifying
    @Transactional
    void deleteByTimestampEpochBefore(Long cutoffTimestampEpoch);
}