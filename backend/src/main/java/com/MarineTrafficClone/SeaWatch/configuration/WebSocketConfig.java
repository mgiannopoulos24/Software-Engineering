package com.MarineTrafficClone.SeaWatch.configuration;


import com.MarineTrafficClone.SeaWatch.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Κλάση διαμόρφωσης για τα WebSockets.
 * Ενεργοποιεί τον message broker για την επικοινωνία σε πραγματικό χρόνο
 * μεταξύ του server και των clients, χρησιμοποιώντας το πρωτόκολλο STOMP πάνω από WebSocket.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor; // Κάνουμε inject τον interceptor μας

    /**
     * Διαμορφώνει τον message broker που θα χρησιμοποιηθεί για την αποστολή μηνυμάτων.
     * @param config Το registry του message broker.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Καταχωρεί τα STOMP endpoints, τα οποία οι clients θα χρησιμοποιήσουν για να συνδεθούν
     * στον WebSocket server.
     * @param registry Το registry των endpoints.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-ais")
                .setAllowedOriginPatterns("*") // <-- ΑΛΛΑΓΗ: Χρήση setAllowedOriginPatterns για μεγαλύτερη ευελιξία
                .withSockJS();
    }

    /**
     * Καταχωρεί τον custom interceptor μας στο κανάλι εισερχομένων μηνυμάτων από τον client.
     * Αυτό εξασφαλίζει ότι ο interceptor μας θα τρέξει για κάθε μήνυμα που έρχεται από τον client,
     * ΠΡΙΝ από τους interceptors ασφαλείας του Spring.
     *
     * @param registration Το registration του καναλιού.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}