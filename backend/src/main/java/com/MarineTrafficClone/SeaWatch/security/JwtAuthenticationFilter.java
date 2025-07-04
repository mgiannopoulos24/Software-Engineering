package com.MarineTrafficClone.SeaWatch.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Ένα φίλτρο (Filter) που εκτελείται μία φορά για κάθε εισερχόμενο HTTP request.
 * Ο σκοπός του είναι να ελέγχει την ύπαρξη ενός JWT (JSON Web Token) στο `Authorization` header,
 * να το επικυρώνει και, αν είναι έγκυρο, να αυθεντικοποιεί τον χρήστη για το συγκεκριμένο request.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // 1. Παίρνουμε το "Authorization" header από το request.
        final String authorizationHeader = request.getHeader(SecurityConstants.HEADER_STRING);

        // 2. Αν το header δεν υπάρχει ή δεν ξεκινάει με "Bearer ",
        // τότε δεν είναι αίτημα με token, οπότε το αφήνουμε να συνεχίσει στην επόμενη φάση (filter chain).
        if (authorizationHeader == null || !authorizationHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 3. Αφαιρούμε το "Bearer " για να πάρουμε το καθαρό token.
            final String jwt = authorizationHeader.substring(SecurityConstants.TOKEN_PREFIX.length());
            final String userEmail = jwtService.extractUsername(jwt);  // Εξαγωγή του email (username) από το token.

            // 4. Ελέγχουμε αν έχουμε email και αν ο χρήστης δεν είναι ήδη αυθεντικοποιημένος στο SecurityContext.
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Φορτώνουμε τα στοιχεία του χρήστη από τη βάση.
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                // 5. Επικυρώνουμε το token.
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Αν το token είναι έγκυρο, δημιουργούμε ένα αντικείμενο αυθεντικοποίησης.
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null, // Δεν χρειαζόμαστε credentials (password) εδώ.
                            userDetails.getAuthorities()
                    );
                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    // 6. Τοποθετούμε το αντικείμενο αυθεντικοποίησης στο SecurityContextHolder.
                    // Από αυτό το σημείο και μετά, για το υπόλοιπο του request, ο χρήστης θεωρείται αυθεντικοποιημένος.
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }
        } catch (JwtException e) {
            // Αν το token είναι κατεστραμμένο, ληγμένο, ή για οποιοδήποτε λόγο άκυρο,
            // η βιβλιοθήκη JJWT θα πετάξει μια εξαίρεση που κληρονομεί από JwtException.
            // Την πιάνουμε εδώ για να μην κρασάρει η εφαρμογή.
            log.debug("Invalid JWT Token received: {}", e.getMessage());
            // Δεν κάνουμε τίποτα άλλο. Απλά αφήνουμε την εκτέλεση να συνεχίσει στο filterChain.
            // Ο χρήστης δεν θα αυθεντικοποιηθεί, και το Spring Security θα το χειριστεί παρακάτω.
        }
        // Συνεχίζουμε την εκτέλεση της αλυσίδας των φίλτρων.
        filterChain.doFilter(request, response);
    }
}