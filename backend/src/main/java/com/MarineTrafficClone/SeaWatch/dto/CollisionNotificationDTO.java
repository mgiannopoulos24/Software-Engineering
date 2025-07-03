package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO για την αποστολή ειδοποίησης επικείμενης σύγκρουσης.
 * Περιέχει πληροφορίες για τη ζώνη και τα δύο εμπλεκόμενα πλοία.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollisionNotificationDTO {

    private Instant timestamp;
    private String message;

    // Πληροφορίες για τη Ζώνη
    private Long zoneId;
    private String zoneName;

    // Πληροφορίες για τα εμπλεκόμενα πλοία
    private ShipInfo shipA;
    private ShipInfo shipB;

    /**
     * Εσωτερική κλάση για την αναπαράσταση των βασικών πληροφοριών ενός πλοίου.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipInfo {
        private String mmsi;
        private Double latitude;
        private Double longitude;
    }
}