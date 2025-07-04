package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.response.AuthenticationResponse;
import com.MarineTrafficClone.SeaWatch.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller για τη διαχείριση της αυθεντικοποίησης των χρηστών.
 * Περιλαμβάνει endpoints για την εγγραφή (register) και τη σύνδεση (login).
 * Αυτά τα endpoints είναι δημόσια προσβάσιμα.
 */
@RestController
@RequestMapping("/api/auth") // Βασικό URL path για τα endpoints αυθεντικοποίησης.
@RequiredArgsConstructor // Lombok annotation για αυτόματη δημιουργία constructor με final πεδία.
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    /**
     * Endpoint για την εγγραφή ενός νέου χρήστη.
     * Δέχεται ένα POST αίτημα στο /api/auth/register.
     *
     * @param authDTO Ένα Data Transfer Object που περιέχει το email και τον κωδικό του νέου χρήστη.
     * @return Ένα ResponseEntity που περιέχει το JWT token και τον ρόλο του χρήστη, και status 200 OK.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> registerUser(@RequestBody AuthDTO authDTO) {
        return ResponseEntity.ok(authenticationService.register(authDTO));
    }

    /**
     * Endpoint για τη σύνδεση (login) ενός υπάρχοντος χρήστη.
     * Δέχεται ένα POST αίτημα στο /api/auth/login.
     *
     * @param authDTO Ένα Data Transfer Object που περιέχει το email και τον κωδικό του χρήστη.
     * @return Ένα ResponseEntity που περιέχει το JWT token και τον ρόλο του χρήστη, και status 200 OK.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticateUser(@RequestBody AuthDTO authDTO) {
        return ResponseEntity.ok(authenticationService.login(authDTO));
    }
}