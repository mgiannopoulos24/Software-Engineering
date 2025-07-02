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

@Repository
public interface AisDataRepository extends JpaRepository<AisData, Long> {

    /**
     * Βρίσκει όλα τα δεδομένα AIS για ένα συγκεκριμένο MMSI που έχουν καταγραφεί
     * μετά από μια δεδομένη χρονική στιγμή (epoch seconds).
     * Τα αποτελέσματα επιστρέφονται ταξινομημένα κατά αύξουσα χρονική σειρά.
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

    /**
     * Βρίσκει την πιο πρόσφατη εγγραφή AisData για κάθε MMSI σε μια δεδομένη λίστα.
     * Χρησιμοποιεί ένα πιο σύνθετο JPQL query για βέλτιστη απόδοση, αποφεύγοντας το πρόβλημα N+1.
     */
    @Query("SELECT a FROM AisData a WHERE a.mmsi IN :mmsis AND a.timestampEpoch = (SELECT MAX(a2.timestampEpoch) FROM AisData a2 WHERE a2.mmsi = a.mmsi)")
    List<AisData> findLatestAisDataForMmsiList(@Param("mmsis") List<String> mmsis);

    /**
     * Επιστρέφει τη μέγιστη (πιο πρόσφατη) χρονοσφραγίδα που υπάρχει στον πίνακα ais_data.
     * @return Ένα Optional<Long> που περιέχει τη χρονοσφραγίδα, ή κενό αν ο πίνακας είναι άδειος.
     */
    @Query("SELECT MAX(a.timestampEpoch) FROM AisData a")
    Optional<Long> findLatestTimestampEpoch();

    /**
     * Διαγράφει όλες τις εγγραφές AisData που έχουν χρονοσφραγίδα παλαιότερη
     * από τη δεδομένη τιμή (cutoff).
     * Modifying: Ενημερώνει το Spring ότι αυτό το query δεν είναι ένα απλό SELECT, αλλά ένα query που τροποποιεί δεδομένα (DELETE ή UPDATE).
     * Transactional: Εξασφαλίζει ότι η διαγραφή θα γίνει μέσα σε μια συναλλαγή.
     *
     * @param cutoffTimestampEpoch Το όριο χρονοσφραγίδας. Ό,τι είναι παλαιότερο θα διαγραφεί.
     */
    @Modifying
    @Transactional
    void deleteByTimestampEpochBefore(Long cutoffTimestampEpoch);
}