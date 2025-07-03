package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType; // Import
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Instant timestamp;
    private String message;

    // Πληροφορίες για τη Ζώνη
    private Long zoneId;
    private String zoneName;
    private ZoneConstraintType violationType; // Τι είδους παραβίαση έγινε

    // Πληροφορίες για το Πλοίο
    private String mmsi;
    private Double latitude;   // Η θέση του πλοίου τη στιγμή της παραβίασης
    private Double longitude;  // Η θέση του πλοίου τη στιγμή της παραβίασης
}