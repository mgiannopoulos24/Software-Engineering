package com.MarineTrafficClone.SeaWatch.configuration;


import org.springframework.context.annotation.Configuration;
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
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Διαμορφώνει τον message broker που θα χρησιμοποιηθεί για την αποστολή μηνυμάτων.
     * @param config Το registry του message broker.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Ενεργοποιεί έναν απλό, ενσωματωμένο message broker.
        // "/topic": Για μηνύματα που αποστέλλονται σε όλους τους συνδρομητές (broadcast).
        // "/queue": Για μηνύματα που προορίζονται για έναν συγκεκριμένο χρήστη (private messages).
        config.enableSimpleBroker("/topic", "/queue");

        // Ορίζει το πρόθεμα για τα μηνύματα που στέλνονται από τους clients προς τον server.
        // Για παράδειγμα, ένα μήνυμα που στέλνεται στο "/app/some-endpoint" θα δρομολογηθεί
        // σε μια μέθοδο με annotation @MessageMapping("/some-endpoint").
        config.setApplicationDestinationPrefixes("/app");

        // Ορίζει το πρόθεμα που χρησιμοποιείται για τον εντοπισμό των προορισμών που αφορούν συγκεκριμένο χρήστη.
        // Π.χ., για την αποστολή σε έναν χρήστη, ο client κάνει subscribe στο /user/queue/fleet-updates,
        // και ο server στέλνει στο ίδιο κανάλι χρησιμοποιώντας την SimpMessagingTemplate.
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Καταχωρεί τα STOMP endpoints, τα οποία οι clients θα χρησιμοποιήσουν για να συνδεθούν
     * στον WebSocket server.
     * @param registry Το registry των endpoints.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Καταχωρεί το endpoint "/ws-ais".
        // Οι clients θα συνδέονται σε αυτό το URL για να ξεκινήσουν την WebSocket επικοινωνία.
        // .setAllowedOrigins: Επιτρέπει συνδέσεις από το frontend development server.
        // .withSockJS(): Παρέχει fallback επιλογές (π.χ. long-polling) για browsers που δεν υποστηρίζουν WebSockets.
        registry.addEndpoint("/ws-ais").setAllowedOrigins("https://localhost:5173", "http://localhost:5173", "http://localhost:8080").withSockJS();
    }
}