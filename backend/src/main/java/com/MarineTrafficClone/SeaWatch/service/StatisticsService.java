package com.MarineTrafficClone.SeaWatch.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
     * Υπολογίζει τα πλοία που είναι "ενεργά" (έχουν στείλει έστω ένα στίγμα).
     */
    public long getActiveShipCount() {
        return positionCache.getAllLatestPositions().size();
    }

    /**
     * Υπολογίζει τα πλοία που είναι σχεδόν σταματημένα.
     */
    public long getStoppedShipCount() {
        return positionCache.getAllLatestPositions().stream()
                .filter(aisData -> aisData.getSpeedOverGround() != null && aisData.getSpeedOverGround() <= 1.0)
                .count();
    }

    /**
     * Παίρνει τον αριθμό των ενεργών ζωνών ενδιαφέροντος από την cache.
     */
    public int getInterestZoneCount() {
        return interestZoneCache.getAllActiveZones().size();
    }

    /**
     * Παίρνει τον αριθμό των ενεργών ζωνών σύγκρουσης από την cache.
     */
    public int getCollisionZoneCount() {
        return collisionZoneCache.getAllActiveZones().size();
    }
}