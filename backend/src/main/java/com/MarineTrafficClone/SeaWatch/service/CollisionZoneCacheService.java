package com.MarineTrafficClone.SeaWatch.service;


import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.repository.CollisionZoneRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service που λειτουργεί ως in-memory cache για τις ενεργές ζώνες παρακολούθησης συγκρούσεων.
 * Ο σκοπός της cache είναι να αποφεύγονται οι συνεχείς κλήσεις στη βάση δεδομένων
 * κατά τον έλεγχο των παραβιάσεων για κάθε νέο μήνυμα AIS, βελτιώνοντας δραματικά την απόδοση.
 */
@Service
@DependsOn("entityManagerFactory")
public class CollisionZoneCacheService {

    private final CollisionZoneRepository collisionZoneRepository;

    /**
     * Χρησιμοποιούμε μια {@link CopyOnWriteArrayList}, η οποία είναι μια thread-safe λίστα.
     * Είναι βελτιστοποιημένη για σενάρια όπου οι αναγνώσεις (reads) είναι πολύ πιο συχνές
     * από τις εγγραφές (writes), όπως ακριβώς συμβαίνει εδώ: οι ζώνες αλλάζουν σπάνια,
     * αλλά διαβάζονται συνεχώς από τον Kafka consumer.
     */
    private List<CollisionZone> activeZonesCache = new CopyOnWriteArrayList<>();

    @Autowired
    public CollisionZoneCacheService(CollisionZoneRepository collisionZoneRepository) {
        this.collisionZoneRepository = collisionZoneRepository;
    }

    /**
     * Η μέθοδος αυτή, χάρη στο annotation {@link PostConstruct}, εκτελείται αυτόματα
     * μία φορά, αμέσως μετά την εκκίνηση της εφαρμογής και τη δημιουργία του service.
     * Φορτώνει όλες τις υπάρχουσες ζώνες από τη βάση δεδομένων στη μνήμη (cache).
     */
    @PostConstruct
    public void loadInitialZones() {
        System.out.println("COLLISION CACHE: Loading all Collision Zones into memory...");
        activeZonesCache = new CopyOnWriteArrayList<>(collisionZoneRepository.findAll());
        System.out.println("COLLISION CACHE: Loaded " + activeZonesCache.size() + " zones.");
    }

    /**
     * Προσθέτει μια νέα ζώνη στην cache ή ενημερώνει μια υπάρχουσα.
     * @param zone Η ζώνη προς προσθήκη/ενημέρωση.
     */
    public void addOrUpdateZone(CollisionZone zone) {
        // Αφαιρούμε την παλιά έκδοση της ζώνης, αν υπάρχει (για την περίπτωση της ενημέρωσης).
        activeZonesCache.removeIf(z -> z.getId().equals(zone.getId()));
        activeZonesCache.add(zone);
        System.out.println("COLLISION CACHE: Added/Updated zone " + zone.getName() + ". Total zones in cache: " + activeZonesCache.size());
    }

    /**
     * Αφαιρεί μια ζώνη από την cache, συνήθως μετά τη διαγραφή της από τη βάση.
     * @param zoneId Το ID της ζώνης προς αφαίρεση.
     */
    public void removeZone(Long zoneId) {
        activeZonesCache.removeIf(z -> z.getId().equals(zoneId));
        System.out.println("COLLISION CACHE: Removed zone with ID " + zoneId + ". Total zones in cache: " + activeZonesCache.size());
    }

    /**
     * Επιστρέφει μια λίστα με όλες τις ενεργές ζώνες που βρίσκονται στην cache.
     * @return Μια thread-safe λίστα με τις ζώνες.
     */
    public List<CollisionZone> getAllActiveZones() {
        return activeZonesCache;
    }
}