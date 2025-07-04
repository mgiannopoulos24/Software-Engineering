package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.MarineTrafficClone.SeaWatch.response.AuthenticationResponse;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service που περιέχει την επιχειρησιακή λογική για την αυθεντικοποίηση:
 * εγγραφή (register) και σύνδεση (login) χρηστών.
 */
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserEntityRepository userEntityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Δημιουργεί έναν νέο χρήστη, τον αποθηκεύει στη βάση δεδομένων
     * και επιστρέφει ένα JWT token για αυτόν.
     *
     * @param authDTO Τα στοιχεία (email, password) του νέου χρήστη.
     * @return Ένα αντικείμενο AuthenticationResponse που περιέχει το token και τον ρόλο.
     */
    public AuthenticationResponse register(AuthDTO authDTO) {
        // 1. Δημιουργούμε ένα νέο αντικείμενο UserEntity.
        var user = UserEntity.builder()
                .email(authDTO.getEmail())
                .password(passwordEncoder.encode(authDTO.getPassword())) // Κρυπτογραφούμε τον κωδικό πριν την αποθήκευση!
                .role(RoleType.REGISTERED) // Ο προεπιλεγμένος ρόλος για νέους χρήστες.
                .build();

        // 2. Αποθηκεύουμε τον χρήστη στη βάση.
        userEntityRepository.save(user);

        // 3. Δημιουργούμε ένα JWT token για τον νέο χρήστη.
        var jwtToken = jwtService.generateToken(user);

        // 4. Επιστρέφουμε την απάντηση.
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole())
                .build();
    }

    /**
     * Αυθεντικοποιεί έναν υπάρχοντα χρήστη και, αν είναι επιτυχής η αυθεντικοποίηση,
     * επιστρέφει ένα νέο JWT token.
     *
     * @param authDTO Τα διαπιστευτήρια (email, password) του χρήστη.
     * @return Ένα αντικείμενο AuthenticationResponse που περιέχει το token και τον ρόλο.
     */
    public AuthenticationResponse login(AuthDTO authDTO) {
        // 1. Χρησιμοποιούμε τον AuthenticationManager του Spring Security για να
        //    ελέγξουμε αν τα διαπιστευτήρια είναι σωστά. Αν δεν είναι,
        //    θα προκληθεί μια AuthenticationException που θα χειριστεί το Spring.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authDTO.getEmail(),
                        authDTO.getPassword()
                )
        );

        // 2. Αν η αυθεντικοποίηση είναι επιτυχής, βρίσκουμε τον χρήστη στη βάση.
        var user = userEntityRepository.findByEmail(authDTO.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + authDTO.getEmail()));

        // 3. Δημιουργούμε ένα νέο JWT token.
        var jwtToken = jwtService.generateToken(user);

        // 4. Επιστρέφουμε την απάντηση.
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole())
                .build();
    }
}