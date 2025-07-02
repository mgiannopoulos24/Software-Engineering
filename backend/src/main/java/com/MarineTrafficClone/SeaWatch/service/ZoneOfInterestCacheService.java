package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.repository.ZoneOfInterestRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@AllArgsConstructor
public class ZoneOfInterestCacheService {

    private final ZoneOfInterestRepository zoneRepository;
    // A thread-safe list, good for scenarios where reads are much more frequent than writes.
    private List<ZoneOfInterest> activeZonesCache = new CopyOnWriteArrayList<>();

    @Autowired
    public ZoneOfInterestCacheService(ZoneOfInterestRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @PostConstruct
    public void loadInitialZones() {
        System.out.println("CACHE: Loading all Zones of Interest into memory...");
        activeZonesCache = new CopyOnWriteArrayList<>(zoneRepository.findAll());
        System.out.println("CACHE: Loaded " + activeZonesCache.size() + " zones.");
    }

    // Methods to keep the cache in sync with the database
    public void addOrUpdateZone(ZoneOfInterest zone) {
        activeZonesCache.removeIf(z -> z.getId().equals(zone.getId())); // Remove old version if it's an update
        activeZonesCache.add(zone);
        System.out.println("CACHE: Added/Updated zone " + zone.getName() + ". Total zones in cache: " + activeZonesCache.size());
    }

    public void removeZone(Long zoneId) {
        activeZonesCache.removeIf(z -> z.getId().equals(zoneId));
        System.out.println("CACHE: Removed zone with ID " + zoneId + ". Total zones in cache: " + activeZonesCache.size());
    }

    public List<ZoneOfInterest> getAllActiveZones() {
        return activeZonesCache;
    }
}
