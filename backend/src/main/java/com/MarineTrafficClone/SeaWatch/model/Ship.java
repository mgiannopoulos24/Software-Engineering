package com.MarineTrafficClone.SeaWatch.model;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Οντότητα (Entity) που αναπαριστά τα στατικά στοιχεία ενός πλοίου.
 * Αυτά τα στοιχεία, όπως το MMSI και ο τύπος του πλοίου, αλλάζουν σπάνια.
 * Κάθε αντικείμενο αυτής της κλάσης αντιστοιχεί σε μια γραμμή στον πίνακα `ships`.
 */
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ships", uniqueConstraints = {@UniqueConstraint(columnNames = {"mmsi"})}) // Εξασφαλίζει ότι κάθε mmsi είναι μοναδικό στον πίνακα.
public class Ship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Το Maritime Mobile Service Identity (MMSI) του πλοίου.
     * Είναι ένας μοναδικός 9-ψήφιος αριθμός που χρησιμοποιείται ως αναγνωριστικό.
     */
    @Column(name = "mmsi", nullable = false)
    @NotNull
    private Long mmsi;

    /**
     * Ο τύπος του πλοίου.
     * Το πεδίο αυτό είναι τύπου {@link ShipType} (enum).
     * Η μετατροπή του σε String για αποθήκευση στη βάση γίνεται αυτόματα
     * από τον {@link com.MarineTrafficClone.SeaWatch.converter.ShipTypeConverter}.
     */
    @Column(name = "ship_type")
    @Enumerated(EnumType.STRING)
    private ShipType shiptype;
}