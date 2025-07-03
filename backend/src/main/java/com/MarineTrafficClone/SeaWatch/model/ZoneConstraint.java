package com.MarineTrafficClone.SeaWatch.model;

import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "zone_constraints")
public class ZoneConstraint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ZoneConstraintType type;

    @Column(name = "value", nullable = false)
    private String value;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_of_interest_id", nullable = false)
    @JsonIgnore // Αποτρέπει το άπειρο loop κατά τη μετατροπή σε JSON
    private ZoneOfInterest zoneOfInterest;
}