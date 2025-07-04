package com.MarineTrafficClone.SeaWatch.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

/**
 * Κλάση διαμόρφωσης για την ασφάλεια των WebSockets.
 * Ορίζει κανόνες πρόσβασης για τα μηνύματα που ανταλλάσσονται μέσω του STOMP message broker.
 */
@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    /**
     * Διαμορφώνει τους κανόνες ασφαλείας για τα εισερχόμενα μηνύματα WebSocket.
     * @param messages Το registry για τους κανόνες ασφαλείας.
     */
    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
                // Κανόνας 1:
                // Οποιοσδήποτε (ακόμα και ανώνυμοι χρήστες) μπορεί να κάνει subscribe σε κανάλια που αρχίζουν από /topic.
                // Αυτό επιτρέπει σε όλους τους επισκέπτες της σελίδας να βλέπουν την "παγκόσμια εικόνα" των πλοίων.
                .simpSubscribeDestMatchers("/topic/**").permitAll()

                // Κανόνας 2:
                // Οποιοδήποτε άλλο μήνυμα (π.χ. subscribe σε /user/queue, αποστολή μηνύματος στο /app)
                // απαιτεί ο χρήστης να είναι αυθεντικοποιημένος.
                // Αυτό προστατεύει τα ιδιωτικά κανάλια (όπως οι ειδοποιήσεις και οι ενημερώσεις στόλου)
                // και την αποστολή μηνυμάτων προς την εφαρμογή.
                .anyMessage().authenticated();
    }

    /**
     * Απενεργοποιεί τον έλεγχο "same origin" για τα WebSockets.
     * Αυτό είναι απαραίτητο (σε περιβάλλοντα development) επειδή το frontend
     * και το backend τρέχουν σε διαφορετικά ports.
     *
     * @return true για να απενεργοποιηθεί ο έλεγχος.
     */
    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }
}