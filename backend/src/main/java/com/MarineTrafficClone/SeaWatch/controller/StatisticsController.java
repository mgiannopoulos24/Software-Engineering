package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller για την παροχή στατιστικών στοιχείων σχετικά με την κατάσταση του συστήματος.
 * Τα στατιστικά υπολογίζονται γρήγορα, καθώς βασίζονται σε δεδομένα από τις caches.
 */
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Autowired
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    /**
     * Επιστρέφει τον συνολικό αριθμό των πλοίων που είναι "ενεργά" στο σύστημα,
     * δηλαδή τα πλοία για τα οποία έχουμε λάβει τουλάχιστον ένα στίγμα AIS.
     *
     * @return Ένα ResponseEntity με ένα JSON αντικείμενο της μορφής {"count": X} και status 200 OK.
     */
    @GetMapping("/active-ships")
    public ResponseEntity<Map<String, Long>> getActiveShipCount() {
        long count = statisticsService.getActiveShipCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Επιστρέφει τον αριθμό των πλοίων που θεωρούνται σταματημένα.
     * Ένα πλοίο θεωρείται σταματημένο αν η ταχύτητά του είναι μικρότερη ή ίση από 1 κόμβο.
     *
     * @return Ένα ResponseEntity με ένα JSON αντικείμενο της μορφής {"count": X} και status 200 OK.
     */
    @GetMapping("/stopped-ships")
    public ResponseEntity<Map<String, Long>> getStoppedShipCount() {
        long count = statisticsService.getStoppedShipCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Επιστρέφει τον αριθμό των ενεργών ζωνών ενδιαφέροντος (zones of interest)
     * που έχουν οριστεί από τους χρήστες.
     *
     * @return Ένα ResponseEntity με ένα JSON αντικείμενο της μορφής {"count": X} και status 200 OK.
     */
    @GetMapping("/interest-zones")
    public ResponseEntity<Map<String, Integer>> getInterestZoneCount() {
        int count = statisticsService.getInterestZoneCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Επιστρέφει τον αριθμό των ενεργών ζωνών παρακολούθησης σύγκρουσης (collision zones)
     * που έχουν οριστεί από τους χρήστες.
     *
     * @return Ένα ResponseEntity με ένα JSON αντικείμενο της μορφής {"count": X} και status 200 OK.
     */
    @GetMapping("/collision-zones")
    public ResponseEntity<Map<String, Integer>> getCollisionZoneCount() {
        int count = statisticsService.getCollisionZoneCount();
        return ResponseEntity.ok(Map.of("count", count));
    }
}