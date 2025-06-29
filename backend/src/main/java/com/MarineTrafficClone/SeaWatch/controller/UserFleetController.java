package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.User; // Or your UserDetails implementation
import com.MarineTrafficClone.SeaWatch.service.UserFleetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Set;

@RestController
@RequestMapping("/api/fleet")
public class UserFleetController {

    private final UserFleetService userFleetService;

    @Autowired
    public UserFleetController(UserFleetService userFleetService) {
        this.userFleetService = userFleetService;
    }

    @GetMapping("/mine")
    public ResponseEntity<Set<Ship>> getMyWatchedShipsDetails(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        Set<Ship> watchedShips = userFleetService.getWatchedShipsDetails(currentUser.getId());
        return ResponseEntity.ok(watchedShips);
    }

    @PostMapping("/mine/ships/{mmsi}")
    public ResponseEntity<String> addShipToMyFleet(@PathVariable Long mmsi,
                                                   @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            userFleetService.addShipToUserFleet(currentUser.getId(), mmsi);
            return ResponseEntity.ok("Ship with MMSI " + mmsi + " added to your watched fleet.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/mine/ships/{mmsi}")
    public ResponseEntity<String> removeShipFromMyFleet(@PathVariable Long mmsi,
                                                        @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            userFleetService.removeShipFromUserFleet(currentUser.getId(), mmsi);
            return ResponseEntity.ok("Ship with MMSI " + mmsi + " removed from your watched fleet.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}