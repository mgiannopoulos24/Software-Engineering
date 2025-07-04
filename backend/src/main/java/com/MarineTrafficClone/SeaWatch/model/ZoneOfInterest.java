package com.MarineTrafficClone.SeaWatch.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Οντότητα (Entity) που αναπαριστά μια ζώνη ενδιαφέροντος (Zone of Interest).
 * Κάθε χρήστης μπορεί να έχει το πολύ μία τέτοια ζώνη.
 * Η ζώνη περιέχει γεωμετρικά δεδομένα (κέντρο, ακτίνα) και μια λίστα από περιορισμούς.
 */
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "zones_of_interest")
public class ZoneOfInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "center_latitude", nullable = false)
    private Double centerLatitude;

    @Column(name = "center_longitude", nullable = false)
    private Double centerLongitude;

    @Column(name = "radius_in_meters", nullable = false)
    private Double radiusInMeters;

    /**
     * Ορίζει τη σχέση Ένα-προς-Ένα (One-to-One) με τον χρήστη.
     * Κάθε ζώνη ανήκει σε έναν και μόνο χρήστη.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false) // Η στήλη user_id είναι το ξένο κλειδί.
    @ToString.Exclude // Εξαίρεση από τη μέθοδο toString() για αποφυγή άπειρης αναδρομής.
    @EqualsAndHashCode.Exclude // Εξαίρεση από τις μεθόδους equals/hashCode για τον ίδιο λόγο.
    private UserEntity user;

    /**
     * Ορίζει τη σχέση Ένα-προς-Πολλά (One-to-Many) με τους περιορισμούς (ZoneConstraint).
     * Μία ζώνη μπορεί να έχει πολλούς περιορισμούς.
     * `mappedBy = "zoneOfInterest"`: Η "ιδιοκτησία" της σχέσης είναι στο πεδίο `zoneOfInterest` της κλάσης ZoneConstraint.
     * `cascade = CascadeType.ALL`: Αν αποθηκευτεί/διαγραφεί μια ζώνη, αποθηκεύονται/διαγράφονται και οι περιορισμοί της.
     * `orphanRemoval = true`: Αν ένας περιορισμός αφαιρεθεί από αυτή τη λίστα, διαγράφεται και από τη βάση.
     * `fetch = FetchType.EAGER`: Οι περιορισμοί φορτώνονται πάντα μαζί με τη ζώνη, γιατί τους χρειαζόμαστε πάντα.
     */
    @OneToMany(
            mappedBy = "zoneOfInterest",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    private List<ZoneConstraint> constraints = new ArrayList<>();

    /**
     * Βοηθητική μέθοδος για τον σωστό συγχρονισμό της σχέσης.
     * Όταν θέτουμε μια νέα λίστα περιορισμών, καθαρίζουμε την παλιά, προσθέτουμε τους νέους,
     * και για κάθε νέο περιορισμό, θέτουμε την αναφορά πίσω σε αυτή τη ζώνη (`this`).
     * Αυτό είναι κρίσιμο για τη σωστή λειτουργία του JPA.
     *
     * @param constraints Η νέα λίστα περιορισμών.
     */
    public void setConstraints(List<ZoneConstraint> constraints) {
        this.constraints.clear();
        if (constraints != null) {
            this.constraints.addAll(constraints);
            this.constraints.forEach(c -> c.setZoneOfInterest(this));
        }
    }
}