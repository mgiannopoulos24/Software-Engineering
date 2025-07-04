package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) που αναπαριστά έναν και μόνο περιορισμό (constraint)
 * μέσα σε μια ζώνη ενδιαφέροντος (Zone of Interest).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneConstraintDTO {
    /**
     * Το μοναδικό αναγνωριστικό (ID) του περιορισμού.
     * Είναι χρήσιμο για το frontend σε περιπτώσεις ενημέρωσης ή διαγραφής συγκεκριμένων περιορισμών.
     */
    private Long id;

    /** Ο τύπος του περιορισμού (π.χ., SPEED_LIMIT_ABOVE, ZONE_ENTRY). */
    private ZoneConstraintType type;

    /**
     * Η τιμή του περιορισμού, αποθηκευμένη ως String για ευελιξία.
     * Για παράδειγμα, μπορεί να είναι "10.5" για όριο ταχύτητας,
     * ή "cargo" για απαγορευμένο τύπο πλοίου.
     */
    private String value;
}