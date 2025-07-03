package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.CollisionZoneDTO;
import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.service.CollisionZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/collision-zone")
public class CollisionZoneController {

    private final CollisionZoneService collisionZoneService;

    @Autowired
    public CollisionZoneController(CollisionZoneService collisionZoneService) {
        this.collisionZoneService = collisionZoneService;
    }

    // Get the current user's single collision zone
    @GetMapping("/mine")
    public ResponseEntity<CollisionZoneDTO> getMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        return collisionZoneService.getZoneForUser(currentUser.getId())
                .map(this::convertToDto) // Μετατροπή της οντότητας σε DTO
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Create or Update the user's single collision zone.
    // PUT is used because this operation is idempotent (setting the same zone data multiple times has the same outcome).
    @PutMapping("/mine")
    public ResponseEntity<CollisionZoneDTO> createOrUpdateMyZone(@RequestBody CollisionZoneDTO zoneDetailsDTO, @AuthenticationPrincipal UserEntity currentUser) {
        CollisionZone updatedZone = collisionZoneService.createOrUpdateZone(zoneDetailsDTO, currentUser);
        return ResponseEntity.ok(convertToDto(updatedZone));
    }

    // Delete the current user's single collision zone
    @DeleteMapping("/mine")
    public ResponseEntity<Void> deleteMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        collisionZoneService.deleteZoneForUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    // Helper method για τη μετατροπή Entity -> DTO
    private CollisionZoneDTO convertToDto(CollisionZone zone) {
        CollisionZoneDTO dto = new CollisionZoneDTO();
        dto.setId(zone.getId());
        dto.setName(zone.getName());
        dto.setCenterLatitude(zone.getCenterLatitude());
        dto.setCenterLongitude(zone.getCenterLongitude());
        dto.setRadiusInMeters(zone.getRadiusInMeters());
        return dto;
    }
}