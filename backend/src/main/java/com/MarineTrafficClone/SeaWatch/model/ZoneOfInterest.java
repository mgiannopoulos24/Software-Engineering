package com.MarineTrafficClone.SeaWatch.model;


import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "zones_of_interest")  // There will only be one actual zone of interest
public class ZoneOfInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "center_latitude",nullable = false)
    private Double centerLatitude;

    @Column(name = "center_longitude",nullable = false)
    private Double centerLongitude;

    @Column(name = "radius_in_meters", nullable = false)
    private Double radiusInMeters;

    @Enumerated(EnumType.STRING) // Store the constraint type as a string
    @Column(name = "constraint_type", nullable = false)
    private ZoneConstraintType constraintType;

    @Column(name = "constraint_value",nullable = false)
    private Double constraintValue; // The value for the constraint (e.g., speed in knots)

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

}