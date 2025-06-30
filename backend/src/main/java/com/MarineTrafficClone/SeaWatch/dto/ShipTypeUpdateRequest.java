package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO για το αίτημα ενημέρωσης του τύπου ενός πλοίου.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShipTypeUpdateRequest {

    @NotNull(message = "Ship type cannot be null")
    private ShipType shiptype;
}