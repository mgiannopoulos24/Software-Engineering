package com.MarineTrafficClone.SeaWatch.response;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Αντικείμενο που αναπαριστά την απάντηση του server μετά από μια επιτυχημένη
 * εγγραφή (register) ή σύνδεση (login).
 * Λειτουργεί ως Data Transfer Object (DTO) για την απάντηση.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

    /** Το JSON Web Token (JWT) που πρέπει να χρησιμοποιεί ο client για τα επόμενα αιτήματά του. */
    private String token;

    /** Ο ρόλος του χρήστη που αυθεντικοποιήθηκε. Χρήσιμο για το frontend ώστε να προσαρμόσει το UI. */
    private RoleType role;
}