package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Data Transfer Object (DTO) για την αποστολή ειδοποίησης επικείμενης σύγκρουσης μέσω WebSocket.
 * Περιέχει πληροφορίες για τη ζώνη στην οποία εντοπίστηκε ο κίνδυνος,
 * καθώς και βασικές πληροφορίες για τα δύο εμπλεκόμενα πλοία.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollisionNotificationDTO {

    /** Η χρονική στιγμή που δημιουργήθηκε η ειδοποίηση. */
    private Instant timestamp;

    /** Το μήνυμα της ειδοποίησης (π.χ., "Collision Alert!"). */
    private String message;

    // Πληροφορίες για τη Ζώνη
    /** Το ID της ζώνης σύγκρουσης. */
    private Long zoneId;
    /** Το όνομα της ζώνης σύγκρουσης. */
    private String zoneName;

    // Πληροφορίες για τα εμπλεκόμενα πλοία
    /** Πληροφορίες για το πρώτο πλοίο. */
    private ShipInfo shipA;
    /** Πληροφορίες για το δεύτερο πλοίο. */
    private ShipInfo shipB;

    /**
     * Εσωτερική στατική κλάση (nested static class) που λειτουργεί ως DTO
     * για την αναπαράσταση των βασικών πληροφοριών ενός πλοίου που εμπλέκεται σε πιθανή σύγκρουση.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipInfo {
        /** Το MMSI του πλοίου. */
        private String mmsi;
        /** Το γεωγραφικό πλάτος (latitude) του πλοίου. */
        private Double latitude;
        /** Το γεωγραφικό μήκος (longitude) του πλοίου. */
        private Double longitude;
    }
}