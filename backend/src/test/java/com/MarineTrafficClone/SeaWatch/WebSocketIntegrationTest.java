package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.dto.NotificationDTO;
import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.ssl.SSLContexts;
import org.apache.hc.core5.ssl.TrustStrategy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.RestTemplateXhrTransport;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import javax.net.ssl.SSLContext;
import java.lang.reflect.Type;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class WebSocketIntegrationTest extends AbstractTest {

    @LocalServerPort
    private Integer port;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserEntityRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private WebSocketStompClient stompClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private String URL;
    private UserEntity testUser;

    @BeforeEach
    public void setup() throws Exception {
        URL = "wss://localhost:" + port + "/ws-ais";

        // ΒΗΜΑ 1: Δημιουργία ενός SSLContext που εμπιστεύεται το self-signed certificate του server.
        TrustStrategy acceptingTrustStrategy = (chain, authType) -> true;
        SSLContext sslContext = SSLContexts.custom()
                .loadTrustMaterial(null, acceptingTrustStrategy)
                .build();

        // ΒΗΜΑ 2: Δημιουργία του WebSocketTransport (κύρια μέθοδος σύνδεσης)
        // Ρυθμίζουμε τον StandardWebSocketClient για να χρησιμοποιεί το custom SSLContext.
        StandardWebSocketClient standardWebSocketClient = new StandardWebSocketClient();
        Map<String, Object> userProperties = new HashMap<>();
        // Αυτή είναι η κρίσιμη γραμμή για το κυρίως WebSocket transport
        userProperties.put("javax.websocket.ssl.SSLContext", sslContext);
        standardWebSocketClient.setUserProperties(userProperties);
        WebSocketTransport webSocketTransport = new WebSocketTransport(standardWebSocketClient);


        // ΒΗΜΑ 3: Δημιουργία του RestTemplateXhrTransport (fallback μέθοδος σύνδεσης του SockJS)
        // Αυτό απαιτεί ένα custom RestTemplate που επίσης εμπιστεύεται το self-signed cert.
        SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(sslContext, NoopHostnameVerifier.INSTANCE);
        HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setSSLSocketFactory(socketFactory)
                .build();
        var httpClient = HttpClients.custom().setConnectionManager(connectionManager).build();
        var requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
        var restTemplate = new RestTemplate(requestFactory);
        RestTemplateXhrTransport xhrTransport = new RestTemplateXhrTransport(restTemplate);

        // ΒΗΜΑ 4: Δημιουργία του SockJsClient με τα δύο transports (πρώτα το WebSocket, μετά το XHR).
        List<Transport> transports = new ArrayList<>();
        transports.add(webSocketTransport);
        transports.add(xhrTransport);
        SockJsClient sockJsClient = new SockJsClient(transports);

        // ΒΗΜΑ 5: Δημιουργία του τελικού StompClient.
        stompClient = new WebSocketStompClient(sockJsClient);
        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        objectMapper.registerModule(new JavaTimeModule());
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);
    }

    @AfterEach
    public void cleanup() {
        if (testUser != null && testUser.getEmail() != null) {
            userRepository.findByEmail(testUser.getEmail()).ifPresent(userRepository::delete);
        }
    }

    @Test
    void testPublicTopicReceivesMessage() throws Exception {
        CompletableFuture<RealTimeShipUpdateDTO> resultFuture = new CompletableFuture<>();

        StompSessionHandler sessionHandler = new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                session.subscribe("/topic/ais-updates", new StompFrameHandler() {
                    @Override
                    public Type getPayloadType(StompHeaders headers) {
                        return RealTimeShipUpdateDTO.class;
                    }
                    @Override
                    public void handleFrame(StompHeaders headers, Object payload) {
                        resultFuture.complete((RealTimeShipUpdateDTO) payload);
                    }
                });

                // Στέλνουμε το μήνυμα ΜΟΝΟ ΑΦΟΥ συνδεθούμε και κάνουμε subscribe
                RealTimeShipUpdateDTO testDto = RealTimeShipUpdateDTO.builder().mmsi("12345").speedOverGround(10.0).build();
                messagingTemplate.convertAndSend("/topic/ais-updates", testDto);
            }

            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }
            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }
        };

        // Συνδεόμαστε και περιμένουμε να ολοκληρωθεί η σύνδεση
        StompSession stompSession = stompClient.connectAsync(URL, sessionHandler).get(10, TimeUnit.SECONDS);

        // Περιμένουμε το αποτέλεσμα από το CompletableFuture
        RealTimeShipUpdateDTO receivedMessage = resultFuture.get(10, TimeUnit.SECONDS);

        assertThat(receivedMessage).isNotNull();
        assertThat(receivedMessage.getMmsi()).isEqualTo("12345");
        assertThat(receivedMessage.getSpeedOverGround()).isEqualTo(10.0);

        stompSession.disconnect();
    }

    @Test
    void testPrivateUserQueueReceivesAuthenticatedMessage() throws Exception {
        testUser = UserEntity.builder()
                .email("private-user@test.com")
                .password(passwordEncoder.encode("password"))
                .role(RoleType.REGISTERED)
                .build();
        userRepository.save(testUser);

        String jwtToken = jwtService.generateToken(testUser);
        CompletableFuture<NotificationDTO> resultFuture = new CompletableFuture<>();

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + jwtToken);

        StompSessionHandler sessionHandler = new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                session.subscribe("/user/queue/notifications", new StompFrameHandler() {
                    @Override
                    public Type getPayloadType(StompHeaders headers) {
                        return NotificationDTO.class;
                    }
                    @Override
                    public void handleFrame(StompHeaders headers, Object payload) {
                        resultFuture.complete((NotificationDTO) payload);
                    }
                });

                // Στέλνουμε το μήνυμα ΜΟΝΟ ΑΦΟΥ συνδεθούμε και κάνουμε subscribe
                NotificationDTO testNotification = NotificationDTO.builder()
                        .message("Test Violation")
                        .timestamp(Instant.now())
                        .mmsi("98765")
                        .build();
                messagingTemplate.convertAndSendToUser(testUser.getUsername(), "/queue/notifications", testNotification);
            }
            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }
            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }
        };

        StompSession stompSession = stompClient.connectAsync(URL, new WebSocketHttpHeaders(), connectHeaders, sessionHandler)
                .get(10, TimeUnit.SECONDS);

        NotificationDTO receivedMessage = resultFuture.get(10, TimeUnit.SECONDS);

        assertThat(receivedMessage).isNotNull();
        assertThat(receivedMessage.getMessage()).isEqualTo("Test Violation");
        assertThat(receivedMessage.getMmsi()).isEqualTo("98765");

        stompSession.disconnect();
    }
}