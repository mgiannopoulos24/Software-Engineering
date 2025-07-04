package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) που αναπαριστά ένα και μόνο σημείο στην ιστορική πορεία (track) ενός πλοίου.
 * Περιέχει μόνο τις απολύτως απαραίτητες πληροφορίες (γεωγραφικές συντεταγμένες και χρονοσφραγίδα)
 * για να κρατήσει το μέγεθος της απάντησης στο frontend όσο το δυνατόν μικρότερο.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackPointDTO {
    /** Το γεωγραφικό πλάτος (latitude) του σημείου. */
    private double latitude;

    /** Το γεωγραφικό μήκος (longitude) του σημείου. */
    private double longitude;

    /** Η χρονοσφραγίδα (Unix epoch σε δευτερόλεπτα) του σημείου. */
    private long timestampEpoch;
}