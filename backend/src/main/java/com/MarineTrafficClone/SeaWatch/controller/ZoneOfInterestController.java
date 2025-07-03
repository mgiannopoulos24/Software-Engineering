package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.service.ZoneOfInterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zone")
public class ZoneOfInterestController {

    @Autowired
    private ZoneOfInterestService zoneService;

    // Get the current user's single zone of interest
    @GetMapping("/mine")
    public ResponseEntity<ZoneOfInterest> getMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        return zoneService.getZoneForUser(currentUser.getId())
                .map(ResponseEntity::ok) // If present, return 200 OK with the zone object
                .orElseGet(() -> ResponseEntity.notFound().build()); // If not present, return 404 Not Found
    }

    // Create or Update the user's single zone of interest.
    // PUT is used because this operation is idempotent (setting the same zone data multiple times has the same outcome).
    @PutMapping("/mine")
    public ResponseEntity<ZoneOfInterest> createOrUpdateMyZone(@RequestBody ZoneOfInterest zoneDetails,
                                                               @AuthenticationPrincipal UserEntity currentUser) {
        ZoneOfInterest updatedZone = zoneService.createOrUpdateZone(zoneDetails, currentUser);
        return ResponseEntity.ok(updatedZone);
    }

    // Delete the current user's single zone of interest
    @DeleteMapping("/mine")
    public ResponseEntity<Void> deleteMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        zoneService.deleteZoneForUser(currentUser.getId());
        return ResponseEntity.noContent().build(); // 204 No Content is standard for a successful deletion
    }
}