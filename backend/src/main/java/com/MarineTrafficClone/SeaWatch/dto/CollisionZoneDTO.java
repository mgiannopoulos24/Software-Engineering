package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollisionZoneDTO {
    private Long id;
    private String name;
    private Double centerLatitude;
    private Double centerLongitude;
    private Double radiusInMeters;
}
