package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) που χρησιμοποιείται αποκλειστικά για το αίτημα
 * ενημέρωσης του τύπου ενός πλοίου από έναν διαχειριστή (Admin).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShipTypeUpdateRequest {

    /**
     * Ο νέος τύπος του πλοίου.
     * Το @NotNull διασφαλίζει ότι το πεδίο αυτό δεν μπορεί να είναι null στο αίτημα,
     * παρέχοντας βασική επικύρωση (validation).
     */
    @NotNull(message = "Ship type cannot be null")
    private ShipType shiptype;
}