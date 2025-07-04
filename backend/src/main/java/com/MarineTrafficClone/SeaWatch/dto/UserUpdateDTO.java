package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) που χρησιμοποιείται για το αίτημα ενημέρωσης
 * του ρόλου ενός χρήστη από έναν διαχειριστή (Admin).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {
    /**
     * Ο νέος ρόλος που θα αποδοθεί στον χρήστη.
     * Το @NotNull εξασφαλίζει ότι το πεδίο αυτό πρέπει να υπάρχει στο αίτημα.
     */
    @NotNull(message = "Role cannot be null")
    private RoleType role;
}