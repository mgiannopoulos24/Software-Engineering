package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) για τη μεταφορά δεδομένων αυθεντικοποίησης.
 * Χρησιμοποιείται ως το σώμα (body) των αιτημάτων για εγγραφή (register) και σύνδεση (login).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthDTO {

    /** Το email του χρήστη. */
    private String email;

    /** Ο κωδικός πρόσβασης του χρήστη. */
    private String password;
}