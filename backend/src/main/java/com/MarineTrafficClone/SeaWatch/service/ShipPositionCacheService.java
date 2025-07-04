package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service που λειτουργεί ως in-memory cache για την αποθήκευση της πιο πρόσφατης
 * γνωστής θέσης και κατάστασης (ως αντικείμενο AisData) για κάθε πλοίο.
 * Αυτό είναι εξαιρετικά σημαντικό για την απόδοση του συστήματος, ειδικά για τον έλεγχο
 * των συγκρούσεων, καθώς μας επιτρέπει να έχουμε άμεση πρόσβαση στην τελευταία θέση
 * όλων των πλοίων χωρίς να χρειάζεται να κάνουμε query στη βάση δεδομένων.
 */
@Service
public class ShipPositionCacheService {

    /**
     * Χρησιμοποιούμε ένα {@link ConcurrentHashMap} για την αποθήκευση της cache.
     * Είναι ένα thread-safe Map, κατάλληλο για χρήση σε περιβάλλον με πολλά threads,
     * όπως ο Kafka consumer.
     * Το κλειδί (key) είναι το MMSI του πλοίου (String) και η τιμή (value) είναι
     * το πιο πρόσφατο αντικείμενο AisData που έχουμε λάβει γι' αυτό.
     */
    private final Map<String, AisData> positionCache = new ConcurrentHashMap<>();

    /**
     * Ενημερώνει τη θέση ενός πλοίου στην cache.
     * Αν το πλοίο δεν υπάρχει στην cache, προστίθεται.
     * Αν υπάρχει ήδη, η παλιά εγγραφή αντικαθίσταται από τη νέα.
     *
     * @param aisData Το νέο αντικείμενο AisData του πλοίου.
     */
    public void updatePosition(AisData aisData) {
        if (aisData != null && aisData.getMmsi() != null) {
            positionCache.put(aisData.getMmsi(), aisData);
        }
    }


    /**
     * Επιστρέφει μια συλλογή (Collection) με τις τελευταίες γνωστές θέσεις
     * όλων των πλοίων που βρίσκονται στην cache.
     *
     * @return Μια Collection από αντικείμενα AisData.
     */
    public Collection<AisData> getAllLatestPositions() {
        return positionCache.values();
    }
}