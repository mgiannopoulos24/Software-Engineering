package com.MarineTrafficClone.SeaWatch.service;


import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.repository.CollisionZoneRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class CollisionZoneCacheService {

    private final CollisionZoneRepository collisionZoneRepository;
    // A thread-safe list, good for scenarios where reads are much more frequent than writes.
    private List<CollisionZone> activeZonesCache = new CopyOnWriteArrayList<>();

    @Autowired
    public CollisionZoneCacheService(CollisionZoneRepository collisionZoneRepository) {
        this.collisionZoneRepository = collisionZoneRepository;
    }

    @PostConstruct
    public void loadInitialZones() {
        System.out.println("COLLISION CACHE: Loading all Collision Zone into memory...");
        activeZonesCache = new CopyOnWriteArrayList<>(collisionZoneRepository.findAll());
        System.out.println("COLLISION CACHE: Loaded " + activeZonesCache.size() + " zones.");
    }

    // Methods to keep the cache in sync with the database
    public void addOrUpdateZone(CollisionZone zone) {
        activeZonesCache.removeIf(z -> z.getId().equals(zone.getId())); // Remove old version if it's an update
        activeZonesCache.add(zone);
        System.out.println("COLLISION CACHE: Added/Updated zone " + zone.getName() + ". Total zones in cache: " + activeZonesCache.size());
    }

    public void removeZone(Long zoneId) {
        activeZonesCache.removeIf(z -> z.getId().equals(zoneId));
        System.out.println("COLLISION CACHE: Removed zone with ID " + zoneId + ". Total zones in cache: " + activeZonesCache.size());
    }

    public List<CollisionZone> getAllActiveZones() {
        return activeZonesCache;
    }
}