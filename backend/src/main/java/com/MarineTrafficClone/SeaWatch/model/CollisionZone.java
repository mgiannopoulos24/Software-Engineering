package com.MarineTrafficClone.SeaWatch.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Οντότητα (Entity) που αναπαριστά μια ζώνη παρακολούθησης συγκρούσεων (Collision Zone).
 * Κάθε χρήστης μπορεί να έχει το πολύ μία τέτοια ζώνη.
 * Η σχέση με τον χρήστη είναι One-to-One.
 */
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "collision_zones")
public class CollisionZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double centerLatitude;

    @Column(nullable = false)
    private Double centerLongitude;

    @Column(nullable = false)
    private Double radiusInMeters;

    /**
     * Ορίζει μια σχέση Ένα-προς-Ένα (One-to-One) με την οντότητα UserEntity.
     * `fetch = FetchType.LAZY`: Ο συνδεδεμένος χρήστης δεν θα φορτώνεται αυτόματα από τη βάση
     *                           μαζί με τη ζώνη, παρά μόνο όταν ζητηθεί ρητά. Αυτό βελτιώνει την απόδοση.
     * `JoinColumn`: Ορίζει τη στήλη `user_id` σε αυτόν τον πίνακα ως το ξένο κλειδί (foreign key)
     *               που συνδέεται με το πρωτεύον κλειδί του πίνακα των χρηστών.
     * `unique = true`: Εξασφαλίζει ότι κάθε χρήστης μπορεί να έχει μόνο μία ζώνη σύγκρουσης.
     */
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private UserEntity user;
}