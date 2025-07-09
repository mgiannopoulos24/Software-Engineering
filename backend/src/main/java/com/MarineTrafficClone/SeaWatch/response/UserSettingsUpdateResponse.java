package com.MarineTrafficClone.SeaWatch.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Αντικείμενο απάντησης μετά από μια επιτυχημένη ενημέρωση των ρυθμίσεων του χρήστη.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
// Αυτό το annotation εξασφαλίζει ότι το πεδίο 'newToken' θα συμπεριληφθεί στο JSON
// μόνο αν δεν είναι null.
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSettingsUpdateResponse {

    /** Ένα μήνυμα που περιγράφει το αποτέλεσμα της ενέργειας. */
    private String message;

    /**
     * Το νέο JWT token. Παρέχεται μόνο όταν ο χρήστης αλλάζει το email του,
     * καθώς το παλιό token, που βασιζόταν στο παλιό email, καθίσταται άκυρο.
     */
    private String newToken;
}