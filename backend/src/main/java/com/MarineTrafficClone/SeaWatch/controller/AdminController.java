package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.ShipTypeUpdateRequest;
import com.MarineTrafficClone.SeaWatch.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller για λειτουργίες που αφορούν αποκλειστικά τους διαχειριστές (Admins).
 * Η πρόσβαση σε αυτόν τον controller προστατεύεται από το Spring Security
 * ώστε να επιτρέπεται μόνο σε χρήστες με ρόλο 'ADMIN'.
 */
@RestController
@RequestMapping("/api/admin") // Βασικό URL path για όλες τις λειτουργίες του admin.
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Endpoint για την ανάκτηση όλων των πλοίων που υπάρχουν στο σύστημα.
     *
     * @return Ένα ResponseEntity που περιέχει μια λίστα με ShipDetailsDTO και status 200 OK.
     */
    @GetMapping("/ships")
    public ResponseEntity<List<ShipDetailsDTO>> getAllShips() {
        List<ShipDetailsDTO> allShips = adminService.getAllShipsForAdmin();
        return ResponseEntity.ok(allShips);
    }

    /**
     * Endpoint για την ενημέρωση του τύπου ενός συγκεκριμένου πλοίου.
     * Δέχεται ένα αίτημα PUT στο /api/admin/ships/{mmsi}/type.
     * Η πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο ADMIN, όπως ορίζεται στο SecurityConfiguration.
     *
     * @param mmsi Το MMSI του πλοίου που θα ενημερωθεί, λαμβάνεται από το URL path.
     * @param request Το σώμα του αιτήματος που περιέχει τον νέο τύπο πλοίου.
     * @return Ένα ResponseEntity που περιέχει τις πλήρεις, ενημερωμένες λεπτομέρειες του πλοίου (ShipDetailsDTO) και status 200 OK.
     */
    @PutMapping("/ships/{mmsi}/type")
    public ResponseEntity<ShipDetailsDTO> updateShipType(@PathVariable Long mmsi, @RequestBody ShipTypeUpdateRequest request) {
        ShipDetailsDTO updatedShipDetails = adminService.updateShipType(mmsi, request.getShiptype());
        return ResponseEntity.ok(updatedShipDetails);
    }
}