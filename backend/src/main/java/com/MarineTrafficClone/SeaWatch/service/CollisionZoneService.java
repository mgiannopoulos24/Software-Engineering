package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.CollisionZoneDTO;
import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.CollisionZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CollisionZoneService {

    private final CollisionZoneRepository collisionZoneRepositoryRepository;
    private final CollisionZoneCacheService collisionZoneCacheService;

    @Autowired
    public CollisionZoneService(CollisionZoneRepository collisionZoneRepositoryRepository,  CollisionZoneCacheService collisionZoneCacheService) {
        this.collisionZoneRepositoryRepository = collisionZoneRepositoryRepository;
        this.collisionZoneCacheService = collisionZoneCacheService;
    }

    @Transactional(readOnly = true)
    public Optional<CollisionZone> getZoneForUser(Long userId) {
        return collisionZoneRepositoryRepository.findByUserId(userId);
    }

    @Transactional
    public CollisionZone createOrUpdateZone(CollisionZoneDTO zoneDTO, UserEntity currentUser) {
        CollisionZone zone = collisionZoneRepositoryRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    CollisionZone newZone = new CollisionZone();
                    newZone.setUser(currentUser);
                    return newZone;
                });

        // Ενημέρωση των βασικών πεδίων της ζώνης
        zone.setName(zoneDTO.getName());
        zone.setCenterLatitude(zoneDTO.getCenterLatitude());
        zone.setCenterLongitude(zoneDTO.getCenterLongitude());
        zone.setRadiusInMeters(zoneDTO.getRadiusInMeters());

        CollisionZone savedZone = collisionZoneRepositoryRepository.save(zone);
        collisionZoneCacheService.addOrUpdateZone(savedZone);
        return savedZone;
    }

    @Transactional
    public void deleteZoneForUser(Long userId) {
        // Find the user's zone before deleting
        Optional<CollisionZone> zoneOpt = collisionZoneRepositoryRepository.findByUserId(userId);
        if (zoneOpt.isPresent()) {
            CollisionZone zoneToDelete = zoneOpt.get();
            collisionZoneRepositoryRepository.delete(zoneToDelete); // Delete from DB
            collisionZoneCacheService.removeZone(zoneToDelete.getId()); // Remove from cache
            System.out.println("Deleted zone for user ID: " + userId);
        } else {
            System.out.println("User " + userId + " had no zone to delete.");
        }
    }
}