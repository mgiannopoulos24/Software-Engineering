package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipTypeUpdateRequest;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController extends BaseApiController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * PUT /api/admin/ships/{mmsi}/type
     * Ενημερώνει τον τύπο ενός συγκεκριμένου πλοίου.
     * Πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο ADMIN.
     */
    @PutMapping("/ships/{mmsi}/type")
    public ResponseEntity<Ship> updateShipType(@PathVariable Long mmsi, @RequestBody ShipTypeUpdateRequest request) {
        Ship updatedShip = adminService.updateShipType(mmsi, request.getShiptype());
        return ResponseEntity.ok(updatedShip);
    }
}
