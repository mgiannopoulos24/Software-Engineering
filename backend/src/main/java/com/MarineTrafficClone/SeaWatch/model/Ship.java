package com.MarineTrafficClone.SeaWatch.model;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ships", uniqueConstraints = {@UniqueConstraint(columnNames = {"mmsi"})}) // Each mmsi should be unique
public class Ship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mmsi", nullable = false)
    @NotNull
    private Long mmsi;

    @Column(name = "ship_type")
    private ShipType shiptype;
}
