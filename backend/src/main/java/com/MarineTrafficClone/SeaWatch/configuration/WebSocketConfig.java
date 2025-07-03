package com.MarineTrafficClone.SeaWatch.configuration;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic for broadcasting all AIS updates ("Watch All")
        // Topic for private, user-specific fleet updates
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages sent from clients to the server (e.g., to an @MessageMapping)
        config.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific destinations, e.g., /user/queue/fleet-updates
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-ais").setAllowedOrigins("https://localhost:5173", "http://localhost:5173", "http://localhost:8080").withSockJS();
    }
}