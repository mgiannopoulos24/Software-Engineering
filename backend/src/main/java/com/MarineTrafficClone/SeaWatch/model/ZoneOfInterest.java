package com.MarineTrafficClone.SeaWatch.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "zones_of_interest") // There will only be one actual zone of interest
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @ToString.Exclude // Αποφυγή άπειρης αναδρομής στο toString()
    @EqualsAndHashCode.Exclude // Αποφυγή άπειρης αναδρομής στο equals/hashCode
    private UserEntity user;

    @OneToMany(
            mappedBy = "zoneOfInterest",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER // Θέλουμε να φορτώνουν πάντα μαζί με τη ζώνη
    )
    private List<ZoneConstraint> constraints = new ArrayList<>();

    // Helper method για συγχρονισμό
    public void setConstraints(List<ZoneConstraint> constraints) {
        this.constraints.clear();
        if (constraints != null) {
            this.constraints.addAll(constraints);
            this.constraints.forEach(c -> c.setZoneOfInterest(this));
        }
    }
}