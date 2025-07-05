package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.TrackPointDTO;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.service.ShipDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller για την παροχή δεδομένων που σχετίζονται με τα πλοία.
 * Παρέχει endpoints για την ανάκτηση της πορείας, των λεπτομερειών
 * και της γενικής κατάστασης των πλοίων.
 */
@RestController
@RequestMapping("/api/ship-data")
public class ShipDataController {

    private final ShipDataService shipDataService;

    @Autowired
    public ShipDataController(ShipDataService shipDataService) {
        this.shipDataService = shipDataService;
    }

    // Οι παρακάτω μέθοδοι getAisData, getAisDataById, addAisData είναι για debugging και testing

    @GetMapping
    public List<AisData> getAisData() {
        return shipDataService.getAisData();
    }

    @GetMapping("{id}")
    public AisData getAisDataById(@PathVariable Long id) {
        return shipDataService.getAisDataById(id);
    }

    @PostMapping
    public ResponseEntity<AisData> addAisData(@RequestBody AisData aisData) {
        AisData saved = shipDataService.insertAisData(aisData);
        return ResponseEntity.ok(saved);
    }

    /**
     * Endpoint για την ανάκτηση της ιστορικής πορείας (track) ενός πλοίου.
     * Επιστρέφει τα σημεία της πορείας για τις τελευταίες 12 ώρες προσομοίωσης.
     *
     * @param mmsi Το MMSI του πλοίου, λαμβάνεται από το URL path.
     * @return Μια λίστα από TrackPointDTO, όπου κάθε αντικείμενο αναπαριστά ένα σημείο (lon, lat, timestamp).
     */
    @GetMapping("/track/{mmsi}")
    public List<TrackPointDTO> getShipTrack(@PathVariable String mmsi) {
        return shipDataService.getShipTrack(mmsi);
    }

    /**
     * Endpoint για την ανάκτηση των πλήρων, τελευταίων γνωστών πληροφοριών για ένα συγκεκριμένο πλοίο.
     * Συνδυάζει στατικά δεδομένα (όπως τύπος) και δυναμικά δεδομένα (όπως θέση, ταχύτητα).
     *
     * @param mmsi Το MMSI του πλοίου.
     * @return Ένα ResponseEntity που περιέχει ένα ShipDetailsDTO με όλες τις λεπτομέρειες του πλοίου και status 200 OK.
     */
    @GetMapping("/ships/{mmsi}/details")
    public ResponseEntity<ShipDetailsDTO> getShipDetails(@PathVariable Long mmsi) {
        ShipDetailsDTO details = shipDataService.getShipDetails(mmsi);
        return ResponseEntity.ok(details);
    }

    /**
     * Endpoint για την ανάκτηση μιας πλήρους "φωτογραφίας" (snapshot) της τελευταίας γνωστής κατάστασης
     * όλων των ενεργών πλοίων στο σύστημα. Ιδανικό για την αρχική φόρτωση του χάρτη στο frontend.
     *
     * @return Ένα ResponseEntity που περιέχει μια λίστα από ShipDetailsDTO, ένα για κάθε πλοίο, και status 200 OK.
     */
    @GetMapping("/active-ships")
    public ResponseEntity<List<ShipDetailsDTO>> getAllActiveShips() {
        List<ShipDetailsDTO> allShipsDetails = shipDataService.getAllActiveShipsDetails();
        return ResponseEntity.ok(allShipsDetails);
    }
}