package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ZoneOfInterestDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.model.ZoneConstraint;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.repository.ZoneOfInterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ZoneOfInterestService {

    private final ZoneOfInterestRepository zoneRepository;
    private final ZoneOfInterestCacheService zoneCacheService;

    @Autowired
    public ZoneOfInterestService(ZoneOfInterestRepository zoneRepository,  ZoneOfInterestCacheService zoneCacheService) {
        this.zoneRepository = zoneRepository;
        this.zoneCacheService = zoneCacheService;
    }

    @Transactional(readOnly = true)
    public Optional<ZoneOfInterest> getZoneForUser(Long userId) {
        return zoneRepository.findByUserId(userId);
    }

    @Transactional
    public ZoneOfInterest createOrUpdateZone(ZoneOfInterestDTO zoneDTO, UserEntity currentUser) {
        ZoneOfInterest zone = zoneRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    ZoneOfInterest newZone = new ZoneOfInterest();
                    newZone.setUser(currentUser);
                    return newZone;
                });

        // Ενημέρωση των βασικών πεδίων της ζώνης
        zone.setName(zoneDTO.getName());
        zone.setCenterLatitude(zoneDTO.getCenterLatitude());
        zone.setCenterLongitude(zoneDTO.getCenterLongitude());
        zone.setRadiusInMeters(zoneDTO.getRadiusInMeters());

        // Ενημέρωση της λίστας των περιορισμών
        List<ZoneConstraint> newConstraints = zoneDTO.getConstraints().stream()
                .map(dto -> {
                    ZoneConstraint constraint = new ZoneConstraint();
                    constraint.setType(dto.getType());
                    constraint.setValue(dto.getValue());
                    return constraint;
                }).collect(Collectors.toList());

        zone.setConstraints(newConstraints);

        ZoneOfInterest savedZone = zoneRepository.save(zone);
        zoneCacheService.addOrUpdateZone(savedZone);
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