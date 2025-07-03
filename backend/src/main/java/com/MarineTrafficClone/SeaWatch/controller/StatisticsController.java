package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Autowired
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    /**
     * GET /api/statistics/active-ships
     * Επιστρέφει τον αριθμό των πλοίων που είναι "ενεργά" στον χάρτη.
     */
    @GetMapping("/active-ships")
    public ResponseEntity<Map<String, Long>> getActiveShipCount() {
        long count = statisticsService.getActiveShipCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * GET /api/statistics/stopped-ships
     * Επιστρέφει τον αριθμό των πλοίων που θεωρούνται σταματημένα (ταχύτητα <= 1 κόμβος).
     */
    @GetMapping("/stopped-ships")
    public ResponseEntity<Map<String, Long>> getStoppedShipCount() {
        long count = statisticsService.getStoppedShipCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * GET /api/statistics/interest-zones
     * Επιστρέφει τον αριθμό των ενεργών ζωνών ενδιαφέροντος.
     */
    @GetMapping("/interest-zones")
    public ResponseEntity<Map<String, Integer>> getInterestZoneCount() {
        int count = statisticsService.getInterestZoneCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * GET /api/statistics/collision-zones
     * Επιστρέφει τον αριθμό των ενεργών ζωνών σύγκρουσης.
     */
    @GetMapping("/collision-zones")
    public ResponseEntity<Map<String, Integer>> getCollisionZoneCount() {
        int count = statisticsService.getCollisionZoneCount();
        return ResponseEntity.ok(Map.of("count", count));
    }
}