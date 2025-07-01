package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
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
    public ResponseEntity<Set<ShipDetailsDTO>> getMyWatchedShipsDetails(@AuthenticationPrincipal UserEntity currentUserEntity) {
        Set<ShipDetailsDTO> watchedShips = userFleetService.getWatchedShipsDetails(currentUserEntity.getId());
        return ResponseEntity.ok(watchedShips);
    }

    @PostMapping("/mine/ships/{mmsi}")
    public ResponseEntity<String> addShipToMyFleet(@PathVariable Long mmsi, @AuthenticationPrincipal UserEntity currentUserEntity) {
        userFleetService.addShipToUserFleet(currentUserEntity.getId(), mmsi);
        return ResponseEntity.ok("Ship with MMSI " + mmsi + " added to your watched fleet.");
    }

    @DeleteMapping("/mine/ships/{mmsi}")
    public ResponseEntity<String> removeShipFromMyFleet(@PathVariable Long mmsi, @AuthenticationPrincipal UserEntity currentUserEntity) {
        userFleetService.removeShipFromUserFleet(currentUserEntity.getId(), mmsi);
        return ResponseEntity.ok("Ship with MMSI " + mmsi + " removed from your watched fleet.");
    }
}