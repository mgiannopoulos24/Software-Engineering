package com.MarineTrafficClone.SeaWatch.security;

import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Κλάση διαμόρφωσης (Configuration) που παρέχει τα βασικά beans που απαιτούνται
 * για τη λειτουργία του Spring Security.
 */
@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserEntityRepository userEntityRepository;

    /**
     * Δημιουργεί ένα bean για το {@link UserDetailsService}.
     * Αυτή η υπηρεσία είναι υπεύθυνη για τη φόρτωση των στοιχείων ενός χρήστη
     * (στην περίπτωσή μας, από το UserEntityRepository) βάσει του username (email).
     *
     * @return Μια υλοποίηση του UserDetailsService.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userEntityRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
    }

    /**
     * Δημιουργεί ένα bean για τον {@link AuthenticationProvider}.
     * Ο DaoAuthenticationProvider είναι η προεπιλεγμένη υλοποίηση του Spring Security
     * που χρησιμοποιεί ένα UserDetailsService για να ανακτήσει τα στοιχεία του χρήστη
     * και ένα PasswordEncoder για να ελέγξει τον κωδικό πρόσβασης.
     *
     * @return Ένα αντικείμενο DaoAuthenticationProvider.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService()); // Ορίζει την υπηρεσία για φόρτωση χρηστών.
        authProvider.setPasswordEncoder(passwordEncoder()); // Ορίζει τον αλγόριθμο κρυπτογράφησης κωδικών.
        return authProvider;
    }

    /**
     * Δημιουργεί ένα bean για τον {@link AuthenticationManager}.
     * Ο AuthenticationManager είναι ο κεντρικός διαχειριστής που επεξεργάζεται
     * ένα αίτημα αυθεντικοποίησης.
     *
     * @param config Το configuration της αυθεντικοποίησης.
     * @return Το AuthenticationManager.
     * throws Exception
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Δημιουργεί ένα bean για τον {@link PasswordEncoder}.
     * Ορίζουμε τον BCrypt ως τον αλγόριθμο για την κρυπτογράφηση (hashing) των κωδικών πρόσβασης.
     * Το BCrypt είναι ένα ισχυρό και ευρέως αποδεκτό πρότυπο.
     *
     * @return Ένα αντικείμενο BCryptPasswordEncoder.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}