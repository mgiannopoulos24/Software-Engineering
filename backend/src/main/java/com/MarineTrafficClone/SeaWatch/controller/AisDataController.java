package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.TrackPointDTO;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.service.AisDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ship-data")
public class AisDataController {

    private final AisDataService aisDataService;

    @Autowired
    public AisDataController(AisDataService aisDataService) {
        this.aisDataService = aisDataService;
    }

    @GetMapping
    public List<AisData> getAisData() {
        return aisDataService.getAisData();
    }

    @GetMapping("{id}")
    public AisData getAisDataById(@PathVariable Long id) {
        return aisDataService.getAisDataById(id);
    }

    @PostMapping
    public ResponseEntity<AisData> addAisData(@RequestBody AisData aisData) {
        AisData saved = aisDataService.insertAisData(aisData);
        return ResponseEntity.ok(saved);
    }

    /**
     * GET /api/ship-data/track/{mmsi}
     * Επιστρέφει την πορεία ενός πλοίου για τις τελευταίες 12 ώρες.
     * @param mmsi Το MMSI του πλοίου που λαμβάνεται από το path.
     * @return Μια λίστα από σημεία της πορείας (TrackPointDTO).
     */
    @GetMapping("/track/{mmsi}")
    public List<TrackPointDTO> getShipTrack(@PathVariable String mmsi) {
        return aisDataService.getShipTrack(mmsi);
    }

    /**
     * GET /api/data/ships/{mmsi}/details
     * Επιστρέφει τις πλήρεις, τελευταίες πληροφορίες για ένα συγκεκριμένο πλοίο.
     * @param mmsi Το MMSI του πλοίου.
     * @return Ένα DTO με όλες τις λεπτομέρειες του πλοίου.
     */
    @GetMapping("/ships/{mmsi}/details")
    public ResponseEntity<ShipDetailsDTO> getShipDetails(@PathVariable Long mmsi) {
        ShipDetailsDTO details = aisDataService.getShipDetails(mmsi);
        return ResponseEntity.ok(details);
    }

    /**
     * GET /api/ship-data/active-ships
     * Επιστρέφει μια πλήρη "φωτογραφία" της τελευταίας γνωστής κατάστασης
     * όλων των πλοίων στο σύστημα.
     * @return Μια λίστα με DTOs που περιέχουν τις λεπτομέρειες κάθε πλοίου.
     */
    @GetMapping("/active-ships")
    public ResponseEntity<List<ShipDetailsDTO>> getAllActiveShips() {
        List<ShipDetailsDTO> allShipsDetails = aisDataService.getAllActiveShipsDetails();
        return ResponseEntity.ok(allShipsDetails);
    }
}
