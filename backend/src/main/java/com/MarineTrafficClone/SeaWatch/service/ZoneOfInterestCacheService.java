package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.repository.ZoneOfInterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service που λειτουργεί ως in-memory cache για τις ενεργές ζώνες ενδιαφέροντος.
 * Ο σκοπός της cache είναι να αποφεύγονται οι συνεχείς κλήσεις στη βάση δεδομένων
 * κατά τον έλεγχο των παραβιάσεων για κάθε νέο μήνυμα AIS, βελτιώνοντας την απόδοση.
 */
@Service
@DependsOn("entityManagerFactory")
public class ZoneOfInterestCacheService {

    private final ZoneOfInterestRepository zoneRepository;
    /**
     * Χρησιμοποιούμε μια {@link CopyOnWriteArrayList}, που είναι thread-safe και
     * βελτιστοποιημένη για σενάρια όπου οι αναγνώσεις είναι πολύ πιο συχνές από τις εγγραφές.
     */
    private List<ZoneOfInterest> activeZonesCache = new CopyOnWriteArrayList<>();

    @Autowired
    public ZoneOfInterestCacheService(ZoneOfInterestRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    /**
     * Η μέθοδος αυτή, χάρη στο {@link PostConstruct}, εκτελείται αυτόματα κατά την εκκίνηση
     * της εφαρμογής, φορτώνοντας όλες τις ζώνες από τη βάση στην cache.
     */
    @PostConstruct
    public void loadInitialZones() {
        System.out.println("INTEREST CACHE: Loading all Zones of Interest into memory...");
        activeZonesCache = new CopyOnWriteArrayList<>(zoneRepository.findAll());
        System.out.println("INTEREST CACHE: Loaded " + activeZonesCache.size() + " zones.");
    }

    /**
     * Προσθέτει μια νέα ζώνη στην cache ή ενημερώνει μια υπάρχουσα.
     * @param zone Η ζώνη προς προσθήκη/ενημέρωση.
     */
    public void addOrUpdateZone(ZoneOfInterest zone) {
        // Αφαίρεση της παλιάς έκδοσης, αν υπάρχει (για την περίπτωση της ενημέρωσης).
        activeZonesCache.removeIf(z -> z.getId().equals(zone.getId()));
        activeZonesCache.add(zone);
        System.out.println("INTEREST CACHE: Added/Updated zone " + zone.getName() + ". Total zones in cache: " + activeZonesCache.size());
    }

    /**
     * Αφαιρεί μια ζώνη από την cache.
     * @param zoneId Το ID της ζώνης προς αφαίρεση.
     */
    public void removeZone(Long zoneId) {
        activeZonesCache.removeIf(z -> z.getId().equals(zoneId));
        System.out.println("INTEREST CACHE: Removed zone with ID " + zoneId + ". Total zones in cache: " + activeZonesCache.size());
    }

    /**
     * Επιστρέφει μια λίστα με όλες τις ενεργές ζώνες που βρίσκονται στην cache.
     * @return Μια thread-safe λίστα με τις ζώνες.
     */
    public List<ZoneOfInterest> getAllActiveZones() {
        return activeZonesCache;
    }
}
