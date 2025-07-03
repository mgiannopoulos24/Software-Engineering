package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneOfInterestDTO {
    private Long id;
    private String name;
    private Double centerLatitude;
    private Double centerLongitude;
    private Double radiusInMeters;
    private List<ZoneConstraintDTO> constraints;
}