package com.MarineTrafficClone.SeaWatch.security;

import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Ένας προσαρμοσμένος ChannelInterceptor που αποτελεί τον συνδετικό κρίκο μεταξύ της JWT αυθεντικοποίησης
 * και της ασφάλειας των WebSockets του Spring. Ο βασικός μηχανισμός ασφαλείας του Spring (JwtAuthenticationFilter)
 * λειτουργεί μόνο για HTTP requests και δεν μεταφέρει αυτόματα την αυθεντικοποίηση στις WebSocket sessions.
 *
 * Ο ρόλος αυτού του interceptor είναι να "παρεμβαίνει" στα εισερχόμενα μηνύματα STOMP από τον client,
 * να εντοπίζει το αρχικό μήνυμα σύνδεσης (CONNECT), να εξάγει το JWT token από τα headers του,
 * να επικυρώνει το token και να "εμπλουτίζει" τη WebSocket session με τα στοιχεία αυθεντικοποίησης του χρήστη.
 * Με αυτόν τον τρόπο, οι επόμενοι interceptors στην αλυσίδα (όπως αυτοί του Spring Security)
 * μπορούν να αναγνωρίσουν τον χρήστη ως αυθεντικοποιημένο και να εφαρμόσουν τους κανόνες εξουσιοδότησης.
 */
@Component
@RequiredArgsConstructor
// Το @Order είναι ΚΡΙΣΙΜΟ. Δίνει την ύψιστη προτεραιότητα εκτέλεσης σε αυτόν τον interceptor.
// Αυτό διασφαλίζει ότι θα τρέξει ΠΡΙΝ από τους ενσωματωμένους interceptors ασφαλείας του Spring,
// δίνοντάς μας την ευκαιρία να κάνουμε την αυθεντικοποίηση πρώτοι.
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class JwtChannelInterceptor implements ChannelInterceptor {

    /** Η υπηρεσία για τη διαχείριση των JWT (δημιουργία, επικύρωση, εξαγωγή claims). */
    private final JwtService jwtService;

    /** Η υπηρεσία του Spring Security για τη φόρτωση των στοιχείων ενός χρήστη από τη βάση δεδομένων. */
    private final UserDetailsService userDetailsService;

    /**
     * Η μέθοδος αυτή καλείται αυτόματα για κάθε μήνυμα που αποστέλλεται από τον client
     * στο κανάλι εισόδου του server (clientInboundChannel), πριν αυτό φτάσει στον message broker.
     *
     * @param message Το εισερχόμενο μήνυμα.
     * @param channel Το κανάλι από το οποίο προήλθε το μήνυμα.
     * @return Το μήνυμα (πιθανώς τροποποιημένο) για να συνεχίσει την πορεία του, ή null για να σταματήσει η επεξεργασία.
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // Χρησιμοποιούμε έναν accessor για να διαβάσουμε εύκολα και με ασφάλεια τα STOMP headers.
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Η λογική μας εφαρμόζεται ΜΟΝΟ στο αρχικό frame τύπου CONNECT,
        // καθώς οι clients στέλνουν το token αυθεντικοποίησης μόνο κατά τη σύνδεση.
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Αναζητούμε το 'Authorization' header μέσα στα native headers του WebSocket handshake.
            String authorizationHeader = accessor.getFirstNativeHeader("Authorization");

            if (authorizationHeader != null && authorizationHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
                // Απομόνωση του καθαρού JWT από το "Bearer " prefix.
                String jwt = authorizationHeader.substring(SecurityConstants.TOKEN_PREFIX.length());
                String userEmail = jwtService.extractUsername(jwt);

                if (userEmail != null) {
                    // Φόρτωση των στοιχείων του χρήστη από τη βάση.
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                    // Επικύρωση του token (ελέγχει αν ανήκει στον χρήστη και αν δεν έχει λήξει).
                    if (jwtService.isTokenValid(jwt, userDetails)) {
                        // Δημιουργία του αντικειμένου Authentication που χρησιμοποιεί το Spring Security.
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null, // Τα credentials (password) δεν είναι απαραίτητα εδώ.
                                userDetails.getAuthorities()
                        );

                        // Αυτή είναι η πιο κρίσιμη γραμμή. Τοποθετούμε το αντικείμενο αυθεντικοποίησης
                        // ως το "user" (Principal) μέσα στα headers της STOMP session.
                        // Ο μηχανισμός ασφαλείας του Spring θα το βρει εδώ για να εφαρμόσει τους κανόνες εξουσιοδότησης
                        // στα επόμενα μηνύματα (π.χ. SUBSCRIBE) αυτής της session.
                        accessor.setUser(authToken);
                    }
                }
            }
        }
        // Επιστρέφουμε το μήνυμα για να συνεχιστεί η επεξεργασία του από τους επόμενους interceptors.
        return message;
    }
}
