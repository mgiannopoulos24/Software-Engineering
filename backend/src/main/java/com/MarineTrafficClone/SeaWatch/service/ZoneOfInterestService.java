package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.model.User;
import com.MarineTrafficClone.SeaWatch.repository.ZoneOfInterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ZoneOfInterestService {

    @Autowired
    private ZoneOfInterestRepository zoneRepository;
    @Autowired
    private ZoneOfInterestCacheService zoneCacheService; // To keep the cache in sync

    @Transactional(readOnly = true)
    public Optional<ZoneOfInterest> getZoneForUser(Long userId) {
        return zoneRepository.findByUserId(userId);
    }

    @Transactional
    public ZoneOfInterest createOrUpdateZone(ZoneOfInterest newZoneData, User currentUser) {
        // Find the user's existing zone, if there is one
        ZoneOfInterest zone = zoneRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    // If no zone exists, create a new one and link it to the user
                    System.out.println("Creating new zone for user: " + currentUser.getEmail());
                    ZoneOfInterest newZone = new ZoneOfInterest();
                    newZone.setUser(currentUser);
                    return newZone;
                });

        // Update the zone's properties with the new data from the request
        zone.setName(newZoneData.getName());
        zone.setCenterLatitude(newZoneData.getCenterLatitude());
        zone.setCenterLongitude(newZoneData.getCenterLongitude());
        zone.setRadiusInMeters(newZoneData.getRadiusInMeters());
        zone.setConstraintType(newZoneData.getConstraintType());
        zone.setConstraintValue(newZoneData.getConstraintValue());

        ZoneOfInterest savedZone = zoneRepository.save(zone);
        zoneCacheService.addOrUpdateZone(savedZone); // Update the cache
        return savedZone;
    }

    @Transactional
    public void deleteZoneForUser(Long userId) {
        // Find the user's zone before deleting
        Optional<ZoneOfInterest> zoneOpt = zoneRepository.findByUserId(userId);
        if (zoneOpt.isPresent()) {
            ZoneOfInterest zoneToDelete = zoneOpt.get();
            zoneRepository.delete(zoneToDelete); // Delete from DB
            zoneCacheService.removeZone(zoneToDelete.getId()); // Remove from cache
            System.out.println("Deleted zone for user ID: " + userId);
        } else {
            System.out.println("User " + userId + " had no zone to delete.");
        }
    }
}