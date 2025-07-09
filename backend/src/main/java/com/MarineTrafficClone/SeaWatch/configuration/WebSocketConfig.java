package com.MarineTrafficClone.SeaWatch.configuration;


import com.MarineTrafficClone.SeaWatch.security.JwtChannelInterceptor;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
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

    private ThreadPoolTaskScheduler taskScheduler;

    /**
     * Διαμορφώνει τα heartbeats για τα websockets.
     * Ο server και ο client θα στέλνουν heartbeats
     * ώστε να κρατάνε ανοικτή την σύνδεση.
     * Αυτό εκτελείται μία φορά, αφού δημιουργηθεί το bean,
     * εξασφαλίζοντας ότι έχουμε μία και μοναδική instance του scheduler.
     */
    // Αυτό εκτελείται μία φορά, αφού δημιουργηθεί το bean, εξασφαλίζοντας
    // ότι έχουμε μία και μοναδική instance του scheduler.
    @PostConstruct
    public void init() {
        taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(1);
        taskScheduler.setThreadNamePrefix("wss-heartbeat-scheduler-");
        taskScheduler.initialize();
    }

    /**
     * Διαμορφώνει τον message broker που θα χρησιμοποιηθεί για την αποστολή μηνυμάτων.
     * @param config Το registry του message broker.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(this.taskScheduler) // Ορίζουμε τον scheduler για τα heartbeats
                // Ο server θα στέλνει heartbeats κάθε 10 δευτ.
                // Ο client πρέπει να στέλνει τουλάχιστον κάθε 10 δευτ.
                .setHeartbeatValue(new long[]{20000, 20000});
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
                // .setAllowedOriginPatterns("*")
                .setAllowedOriginPatterns(
                        "http://localhost:5173",
                        "https://localhost:5173",
                        "http://127.0.0.1:5173",
                        "https://127.0.0.1:5173"
                )
                .withSockJS()
                .setTaskScheduler(this.taskScheduler);
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

    /**
     * Διαμορφώνει τα heartbeats για τα websockets.
     * Ο server και ο client θα στέλνουν heartbeats
     * ώστε να κρατάνε ανοικτή την σύνδεση
     *
     */

    // Εξασφαλίζει ότι όταν κλείνει η εφαρμογή (ή το test context),
    // το thread pool του scheduler κλείνει και αυτό σωστά.
    @PreDestroy
    public void destroy() {
        if (this.taskScheduler != null) {
            this.taskScheduler.shutdown();
        }
    }
}