package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType; // Εισαγωγή του enum
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Data Transfer Object (DTO) για την αποστολή ειδοποιήσεων παραβίασης
 * μιας ζώνης ενδιαφέροντος (Zone of Interest) στον χρήστη μέσω WebSocket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    /** Η χρονική στιγμή που δημιουργήθηκε η ειδοποίηση. */
    private Instant timestamp;

    /** Το μήνυμα της ειδοποίησης που περιγράφει την παραβίαση. */
    private String message;

    // Πληροφορίες για τη Ζώνη
    /** Το ID της ζώνης που παραβιάστηκε. */
    private Long zoneId;
    /** Το όνομα της ζώνης που παραβιάστηκε. */
    private String zoneName;
    /** Ο τύπος του περιορισμού που παραβιάστηκε (π.χ., SPEED_LIMIT_ABOVE). */
    private ZoneConstraintType violationType;

    // Πληροφορίες για το Πλοίο
    /** Το MMSI του πλοίου που έκανε την παραβίαση. */
    private String mmsi;
    /** Το γεωγραφικό πλάτος (latitude) του πλοίου τη στιγμή της παραβίασης. */
    private Double latitude;
    /** Το γεωγραφικό μήκος (longitude) του πλοίου τη στιγμή της παραβίασης. */
    private Double longitude;
}