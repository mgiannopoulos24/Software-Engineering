package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.service.UserFleetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Set;

/**
 * REST Controller για τη διαχείριση του προσωπικού στόλου (fleet) ενός εγγεγραμμένου χρήστη.
 * Επιτρέπει στους χρήστες να προσθέτουν, να αφαιρούν και να βλέπουν τα πλοία που παρακολουθούν.
 */
@RestController
@RequestMapping("/api/fleet")
public class UserFleetController {

    private final UserFleetService userFleetService;

    @Autowired
    public UserFleetController(UserFleetService userFleetService) {
        this.userFleetService = userFleetService;
    }

    /**
     * Endpoint για την ανάκτηση των λεπτομερειών όλων των πλοίων που παρακολουθεί ο τρέχων χρήστης.
     *
     * @param currentUserEntity Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity που περιέχει ένα Set από ShipDetailsDTO με τις λεπτομέρειες των πλοίων και status 200 OK.
     */
    @GetMapping("/mine")
    public ResponseEntity<Set<ShipDetailsDTO>> getMyWatchedShipsDetails(@AuthenticationPrincipal UserEntity currentUserEntity) {
        Set<ShipDetailsDTO> watchedShips = userFleetService.getWatchedShipsDetails(currentUserEntity.getId());
        return ResponseEntity.ok(watchedShips);
    }

    /**
     * Endpoint για την προσθήκη ενός πλοίου στον στόλο του τρέχοντος χρήστη.
     *
     * @param mmsi Το MMSI του πλοίου που θα προστεθεί.
     * @param currentUserEntity Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity με ένα μήνυμα επιβεβαίωσης και status 200 OK.
     */
    @PostMapping("/mine/ships/{mmsi}")
    public ResponseEntity<String> addShipToMyFleet(@PathVariable Long mmsi, @AuthenticationPrincipal UserEntity currentUserEntity) {
        userFleetService.addShipToUserFleet(currentUserEntity.getId(), mmsi);
        return ResponseEntity.ok("Ship with MMSI " + mmsi + " added to your watched fleet.");
    }

    /**
     * Endpoint για την αφαίρεση ενός πλοίου από τον στόλο του τρέχοντος χρήστη.
     *
     * @param mmsi Το MMSI του πλοίου που θα αφαιρεθεί.
     * @param currentUserEntity Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity με ένα μήνυμα επιβεβαίωσης και status 200 OK.
     */
    @DeleteMapping("/mine/ships/{mmsi}")
    public ResponseEntity<String> removeShipFromMyFleet(@PathVariable Long mmsi, @AuthenticationPrincipal UserEntity currentUserEntity) {
        userFleetService.removeShipFromUserFleet(currentUserEntity.getId(), mmsi);
        return ResponseEntity.ok("Ship with MMSI " + mmsi + " removed from your watched fleet.");
    }
}