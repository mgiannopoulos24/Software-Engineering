package com.MarineTrafficClone.SeaWatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) που χρησιμοποιείται για το αίτημα ενημέρωσης
 * των ρυθμίσεων ενός χρήστη (email και/ή κωδικός πρόσβασης).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsUpdateDTO {

    /**
     * Το νέο email του χρήστη.
     * Πρέπει να είναι σε έγκυρη μορφή email.
     */
    @Email(message = "Email should be valid")
    private String email;

    /**
     * Ο τρέχων κωδικός πρόσβασης του χρήστη.
     * Απαιτείται για την επιβεβαίωση οποιασδήποτε αλλαγής.
     */
    private String currentPassword;

    /**
     * Ο νέος κωδικός πρόσβασης του χρήστη.
     * Είναι προαιρετικός. Αν δοθεί, πρέπει να έχει τουλάχιστον 5 χαρακτήρες.
     */
    @Size(min = 5, message = "New password must be at least 5 characters long")
    private String newPassword;
}