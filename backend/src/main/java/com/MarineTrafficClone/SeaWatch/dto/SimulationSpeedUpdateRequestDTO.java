package com.MarineTrafficClone.SeaWatch.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) για την ενημέρωση του simulation speed από έναν admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationSpeedUpdateRequestDTO {
    @Positive(message = "Speed factor must be a positive number.")
    private double newSpeedFactor;
}