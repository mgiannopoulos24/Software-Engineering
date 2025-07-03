package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ZoneConstraintDTO;
import com.MarineTrafficClone.SeaWatch.dto.ZoneOfInterestDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.service.ZoneOfInterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/zone")
public class ZoneOfInterestController {

    private final ZoneOfInterestService zoneService;

    @Autowired
    public ZoneOfInterestController(ZoneOfInterestService zoneService) {
        this.zoneService = zoneService;
    }

    // Get the current user's single zone of interest
    @GetMapping("/mine")
    public ResponseEntity<ZoneOfInterestDTO> getMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        return zoneService.getZoneForUser(currentUser.getId())
                .map(this::convertToDto) // Μετατροπή της οντότητας σε DTO
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Create or Update the user's single zone of interest.
    // PUT is used because this operation is idempotent (setting the same zone data multiple times has the same outcome).
    @PutMapping("/mine")
    public ResponseEntity<ZoneOfInterestDTO> createOrUpdateMyZone(@RequestBody ZoneOfInterestDTO zoneDetailsDTO, @AuthenticationPrincipal UserEntity currentUser) {
        ZoneOfInterest updatedZone = zoneService.createOrUpdateZone(zoneDetailsDTO, currentUser);
        return ResponseEntity.ok(convertToDto(updatedZone));
    }

    // Delete the current user's single zone of interest
    @DeleteMapping("/mine")
    public ResponseEntity<Void> deleteMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        zoneService.deleteZoneForUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    // Helper method για τη μετατροπή Entity -> DTO
    private ZoneOfInterestDTO convertToDto(ZoneOfInterest zone) {
        ZoneOfInterestDTO dto = new ZoneOfInterestDTO();
        dto.setId(zone.getId());
        dto.setName(zone.getName());
        dto.setCenterLatitude(zone.getCenterLatitude());
        dto.setCenterLongitude(zone.getCenterLongitude());
        dto.setRadiusInMeters(zone.getRadiusInMeters());
        dto.setConstraints(zone.getConstraints().stream().map(c -> {
            ZoneConstraintDTO cDto = new ZoneConstraintDTO();
            cDto.setId(c.getId());
            cDto.setType(c.getType());
            cDto.setValue(c.getValue());
            return cDto;
        }).collect(Collectors.toList()));
        return dto;
    }
}