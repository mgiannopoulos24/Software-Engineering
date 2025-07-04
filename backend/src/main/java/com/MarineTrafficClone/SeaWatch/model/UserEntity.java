package com.MarineTrafficClone.SeaWatch.model;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Οντότητα (Entity) που αναπαριστά έναν χρήστη του συστήματος.
 * Υλοποιεί το interface {@link UserDetails} του Spring Security,
 * ώστε να μπορεί να χρησιμοποιηθεί απευθείας για την αυθεντικοποίηση και την εξουσιοδότηση.
 */
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class UserEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, unique = true) // Το email πρέπει να είναι μοναδικό.
    @NotNull
    @Email // Επικύρωση ότι η τιμή είναι έγκυρη διεύθυνση email.
    private String email;

    @Column(name = "password")
    @NotBlank // Ο κωδικός δεν μπορεί να είναι κενός.
    private String password;

    @Enumerated(EnumType.STRING) // Αποθηκεύει το enum ως String στη βάση (π.χ., "ADMIN") αντί για αριθμό.
    @Column(name = "role_type")
    private RoleType role;

    /**
     * Ορίζει τη σχέση Πολλά-προς-Πολλά (Many-to-Many) μεταξύ Χρηστών και Πλοίων.
     * Αυτή η σχέση αναπαριστά τον προσωπικό "στόλο" (fleet) κάθε χρήστη.
     * `fetch = FetchType.LAZY`: Τα πλοία του στόλου δεν φορτώνονται αυτόματα μαζί με τον χρήστη.
     * `JoinTable`: Ορίζει τον ενδιάμεσο πίνακα `fleet` που θα υλοποιήσει τη σχέση,
     * με τις στήλες `user_id` και `ship_id` ως ξένα κλειδιά.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "fleet",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "ship_id")
    )
    @Builder.Default
    private Set<Ship> fleet = new HashSet<>();

    /**
     * Ορίζει τη σχέση Ένα-προς-Ένα (One-to-One) για τη μοναδική ζώνη ενδιαφέροντος του χρήστη.
     * `mappedBy = "user"`: Δηλώνει ότι η "ιδιοκτησία" της σχέσης βρίσκεται στην οντότητα ZoneOfInterest,
     *                      στο πεδίο `user`. Αυτό σημαίνει ότι ο πίνακας `zones_of_interest` θα έχει το ξένο κλειδί.
     * `cascade = CascadeType.ALL`: Αν διαγραφεί ένας χρήστης, θα διαγραφεί αυτόματα και η ζώνη του.
     * `orphanRemoval = true`: Αν αφαιρέσουμε τη ζώνη από τον χρήστη (π.χ. user.setZoneOfInterest(null)), η ζώνη θα διαγραφεί από τη βάση.
     */
    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private ZoneOfInterest zoneOfInterest;

    /**
     * Ορίζει τη σχέση Ένα-προς-Ένα για τη μοναδική ζώνη σύγκρουσης του χρήστη.
     * `mappedBy = "user"`: Δηλώνει ότι η "ιδιοκτησία" της σχέσης βρίσκεται στην οντότητα CollisionZone,
     *                      στο πεδίο `user`. Αυτό σημαίνει ότι ο πίνακας `collision_zones` θα έχει το ξένο κλειδί.
     * `cascade = CascadeType.ALL`: Αν διαγραφεί ένας χρήστης, θα διαγραφεί αυτόματα και η ζώνη του.
     * `orphanRemoval = true`: Αν αφαιρέσουμε τη ζώνη από τον χρήστη (π.χ. user.setCollisionZone(null)), η ζώνη θα διαγραφεί από τη βάση.
     */
    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private CollisionZone collisionZone;

    /* ------------------------- ΜΕΘΟΔΟΙ ΤΟΥ INTERFACE UserDetails ------------------------- */

    /**
     * Επιστρέφει τα δικαιώματα (authorities) του χρήστη.
     * Το Spring Security τα χρησιμοποιεί για τον έλεγχο πρόσβασης.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    /**
     * Επιστρέφει το username του χρήστη. Στην περίπτωσή μας, είναι το email.
     */
    @Override
    public String getUsername() {
        return email;
    }

    /**
     * Επιστρέφει τον κωδικό πρόσβασης του χρήστη.
     */
    @Override
    public String getPassword() {
        return password;
    }

    /* ------------------------- ΒΟΗΘΗΤΙΚΕΣ ΜΕΘΟΔΟΙ ------------------------- */

    /**
     * Βοηθητική μέθοδος για την προσθήκη ενός πλοίου στον στόλο του χρήστη.
     */
    public void addShipToFleet(Ship ship) {
        if (this.fleet == null) {
            this.fleet = new HashSet<>();
        }
        this.fleet.add(ship);
    }

    /**
     * Βοηθητική μέθοδος για την αφαίρεση ενός πλοίου από τον στόλο του χρήστη.
     */
    public void removeShipFromFleet(Ship ship) {
        if (this.fleet != null) {
            this.fleet.remove(ship);
        }
    }

    /* ------------------------- CONSTRUCTORS ------------------------- */

    public UserEntity(@NonNull String email, @NotBlank String password) {
        this.email = email;
        this.password = password;
    }
}