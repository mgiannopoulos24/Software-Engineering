package com.MarineTrafficClone.SeaWatch.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
                // Οποιοσδήποτε (ακόμα και ανώνυμοι χρήστες) μπορεί να κάνει subscribe σε κανάλια που αρχίζουν από /topic.
                // Αυτό επιτρέπει την παρακολούθηση της "παγκόσμιας εικόνας" από όλους.
                .simpSubscribeDestMatchers("/topic/**").permitAll()

                // Οποιοδήποτε άλλο μήνυμα (subscribe, message, etc.) απαιτεί αυθεντικοποίηση.
                // Αυτό προστατεύει τα private κανάλια (π.χ. /user/queue/fleet-updates) και την αποστολή μηνυμάτων προς την εφαρμογή.
                .anyMessage().authenticated();
    }

    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }
}
