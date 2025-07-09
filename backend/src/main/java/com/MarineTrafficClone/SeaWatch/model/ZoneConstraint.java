package com.MarineTrafficClone.SeaWatch.model;

import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Οντότητα (Entity) που αναπαριστά έναν μεμονωμένο περιορισμό (constraint)
 * ο οποίος εφαρμόζεται σε μια ζώνη ενδιαφέροντος.
 * Κάθε αντικείμενο αντιστοιχεί σε μια γραμμή στον πίνακα `zone_constraints`.
 */
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "zone_constraints")
public class ZoneConstraint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ο τύπος του περιορισμού (π.χ., SPEED_LIMIT_ABOVE). */
    @Enumerated(EnumType.STRING) // Αποθηκεύεται ως String στη βάση.
    @Column(name = "constraint_type", nullable = false)
    private ZoneConstraintType constraintType;

    /**
     * Η τιμή του περιορισμού. Αποθηκεύεται ως String για ευελιξία,
     * π.χ., "10.5" για όριο ταχύτητας, "cargo" για τύπο πλοίου.
     */
    @Column(name = "constraint_value", nullable = false)
    private String constraintValue;

    /**
     * Ορίζει τη σχέση Πολλά-προς-Ένα (Many-to-One) με την οντότητα ZoneOfInterest.
     * Πολλοί περιορισμοί μπορούν να ανήκουν σε μία ζώνη.
     * `fetch = FetchType.LAZY`: Η ζώνη δεν φορτώνεται αυτόματα μαζί με τον περιορισμό.
     * `JoinColumn`: Ορίζει τη στήλη `zone_of_interest_id` ως το ξένο κλειδί.
     * `@JsonIgnore`: Αποτρέπει το άπειρο loop (infinite loop) κατά τη μετατροπή σε JSON,
     *              καθώς η ZoneOfInterest έχει μια λίστα από ZoneConstraint, και κάθε ZoneConstraint
     *              θα είχε αναφορά πίσω στη ZoneOfInterest, δημιουργώντας κυκλική αναφορά.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_of_interest_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ZoneOfInterest zoneOfInterest;
}