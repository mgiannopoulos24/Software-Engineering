package com.MarineTrafficClone.SeaWatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.MarineTrafficClone.SeaWatch.model.AisData;

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
}