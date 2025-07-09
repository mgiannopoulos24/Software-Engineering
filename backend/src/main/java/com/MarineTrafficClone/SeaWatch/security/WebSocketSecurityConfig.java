package com.MarineTrafficClone.SeaWatch.security;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessageType;
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
                // Οποιοσδήποτε μπορεί να στείλει CONNECT, DISCONNECT, OTHER, HEARTBEATS και UNSUBSCRIBE μηνύματα
                .simpTypeMatchers(
                        SimpMessageType.CONNECT,
                        SimpMessageType.DISCONNECT,
                        SimpMessageType.OTHER,
                        SimpMessageType.HEARTBEAT,
                        SimpMessageType.UNSUBSCRIBE
                ).permitAll()
                // Οποιοσδήποτε μπορεί να κάνει subscribe σε public topics
                .simpSubscribeDestMatchers("/topic/**").permitAll()
                // Για να κάνεις subscribe σε private κανάλια ή να στείλεις μήνυμα στο /app,
                // πρέπει να έχεις τουλάχιστον ρόλο REGISTERED.
                .simpDestMatchers("/app/**", "/user/**").hasAnyAuthority(RoleType.REGISTERED.name(), RoleType.ADMIN.name())
                // Οποιοδήποτε άλλο μήνυμα (π.χ. ένα άγνωστο subscription) απορρίπτεται.
                .anyMessage().denyAll();
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