package com.MarineTrafficClone.SeaWatch.security;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Κεντρική κλάση διαμόρφωσης για το Spring Security.
 * Ορίζει τους κανόνες ασφαλείας για τα HTTP requests, τη διαχείριση των sessions,
 * και την ενσωμάτωση του custom JWT filter.
 */
@Configuration
@EnableWebSecurity // Ενεργοποιεί την υποστήριξη ασφάλειας web του Spring.
@RequiredArgsConstructor
@EnableMethodSecurity // Επιτρέπει τη χρήση annotations όπως @PreAuthorize στους controllers.
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    /**
     * Διαμορφώνει την αλυσίδα φίλτρων ασφαλείας (SecurityFilterChain).
     * Εδώ ορίζονται οι κανόνες για το ποια endpoints είναι δημόσια και ποια απαιτούν αυθεντικοποίηση.
     *
     * @param http Το αντικείμενο HttpSecurity για τη διαμόρφωση.
     * @return Το διαμορφωμένο SecurityFilterChain.
     * throws Exception
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Απενεργοποίηση του CSRF, καθώς χρησιμοποιούμε JWTs.
                .authorizeHttpRequests(authorize -> authorize
                        // Ορίζουμε τα endpoints που είναι δημόσια προσβάσιμα.
                        .requestMatchers(
                                "/api/auth/**", // Endpoints για login/register.
                                "/ws-ais/**",    // Το endpoint για τη σύνδεση WebSocket.
                                "/api/ship-data/**",    // Endpoint για την αρχική φόρτωση των πλοίων στο χάρτη.
                                "/api/zone/**" // Endpoints για τις ζώνες.
                        ).permitAll()
                        // Ορίζουμε ότι τα admin endpoints απαιτούν τον ρόλο 'ADMIN'.
                        .requestMatchers("/api/admin/**").hasAuthority(RoleType.ADMIN.name())
                        // Οποιοδήποτε άλλο request απαιτεί αυθεντικοποίηση.
                        .anyRequest().authenticated()
                )
                // Διαχείριση των sessions.
                .sessionManagement(session -> session
                        // Ορίζουμε την πολιτική ως STATELESS, καθώς με τα JWTs δεν χρειαζόμαστε server-side sessions.
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider) // Ορίζουμε τον custom authentication provider μας.
                // Προσθέτουμε το JWT filter μας πριν από το standard filter του Spring.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .cors(cors -> cors
                        .configurationSource(corsConfigurationSource()) // Ενεργοποίηση της διαμόρφωσης CORS.
                );


        return http.build();
    }

    /**
     * Διαμορφώνει τους κανόνες για το Cross-Origin Resource Sharing (CORS).
     * Επιτρέπει στο frontend (που τρέχει σε διαφορετικό origin, π.χ., localhost:5173)
     * να κάνει αιτήματα στο backend (π.χ., localhost:8080).
     *
     * @return Η πηγή διαμόρφωσης CORS.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*")); // Επιτρέπει όλα τα origins (για development).
        // Σε production, θα ήταν καλύτερα να ορίσουμε συγκεκριμένα origins:
        // config.setAllowedOriginPatterns(List.of("http://localhost:5173", "https://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")); // Επιτρεπόμενες μέθοδοι HTTP.
        config.setAllowedHeaders(List.of("Authorization", "Content-Type")); // Επιτρεπόμενα headers.
        config.setExposedHeaders(List.of("Authorization")); // Headers που ο client μπορεί να διαβάσει.
        config.setAllowCredentials(true); // Επιτρέπει την αποστολή cookies (αν και δεν τα χρησιμοποιούμε εδώ).
        source.registerCorsConfiguration("/**", config); // Εφαρμογή των κανόνων για όλα τα paths.
        return source;
    }
}