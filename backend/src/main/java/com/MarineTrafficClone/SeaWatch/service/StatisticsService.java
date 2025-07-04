package com.MarineTrafficClone.SeaWatch.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service υπεύθυνο για τον υπολογισμό και την παροχή διαφόρων στατιστικών
 * στοιχείων σχετικά με την τρέχουσα κατάσταση του συστήματος.
 * Για λόγους απόδοσης, αντλεί τα δεδομένα του αποκλειστικά από τις
 * in-memory caches (ShipPositionCache, ZoneOfInterestCache, etc.),
 * αποφεύγοντας έτσι τις δαπανηρές κλήσεις στη βάση δεδομένων.
 */
@Service
public class StatisticsService {

    private final ShipPositionCacheService positionCache;
    private final ZoneOfInterestCacheService interestZoneCache;
    private final CollisionZoneCacheService collisionZoneCache;

    @Autowired
    public StatisticsService(ShipPositionCacheService positionCache,
                             ZoneOfInterestCacheService interestZoneCache,
                             CollisionZoneCacheService collisionZoneCache) {
        this.positionCache = positionCache;
        this.interestZoneCache = interestZoneCache;
        this.collisionZoneCache = collisionZoneCache;
    }

    /**
     * Υπολογίζει τον αριθμό των "ενεργών" πλοίων.
     * Ένα πλοίο θεωρείται ενεργό αν έχει στείλει τουλάχιστον ένα στίγμα AIS
     * και επομένως υπάρχει στην cache θέσεων.
     * @return Ο συνολικός αριθμός των ενεργών πλοίων.
     */
    public long getActiveShipCount() {
        return positionCache.getAllLatestPositions().size();
    }

    /**
     * Υπολογίζει τον αριθμό των πλοίων που είναι σχεδόν σταματημένα.
     * Ένα πλοίο θεωρείται σταματημένο αν η ταχύτητά του (SOG) είναι
     * μικρότερη ή ίση από 1.0 κόμβο.
     * @return Ο αριθμός των σταματημένων πλοίων.
     */
    public long getStoppedShipCount() {
        return positionCache.getAllLatestPositions().stream()
                .filter(aisData -> aisData.getSpeedOverGround() != null && aisData.getSpeedOverGround() <= 1.0)
                .count();
    }

    /**
     * Παίρνει τον αριθμό των ενεργών ζωνών ενδιαφέροντος απευθείας από την cache.
     * @return Ο αριθμός των ζωνών ενδιαφέροντος.
     */
    public int getInterestZoneCount() {
        return interestZoneCache.getAllActiveZones().size();
    }

    /**
     * Παίρνει τον αριθμό των ενεργών ζωνών παρακολούθησης σύγκρουσης από την cache.
     * @return Ο αριθμός των ζωνών σύγκρουσης.
     */
    public int getCollisionZoneCount() {
        return collisionZoneCache.getAllActiveZones().size();
    }
}