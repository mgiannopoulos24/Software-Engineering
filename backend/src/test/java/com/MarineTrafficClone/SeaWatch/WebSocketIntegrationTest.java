package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.dto.NotificationDTO;
import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.time.Instant;
import java.util.List;
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
    private UserEntity testUser; // Για εύκολο cleanup

    @BeforeEach
    public void setup() {
        URL = "ws://localhost:" + port + "/ws-ais";
        List<Transport> transports = List.of(new WebSocketTransport(new StandardWebSocketClient()));
        SockJsClient sockJsClient = new SockJsClient(transports);
        stompClient = new WebSocketStompClient(sockJsClient);
        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        // Χρειάζεται το JavaTimeModule για σωστή (de)serialization του Instant
        objectMapper.registerModule(new JavaTimeModule());
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);
    }

    @AfterEach
    public void cleanup() {
        // Καθαρίζουμε τον χρήστη μετά από κάθε test για να είναι τα tests ανεξάρτητα
        if (testUser != null && testUser.getEmail() != null) {
            userRepository.findByEmail(testUser.getEmail()).ifPresent(userRepository::delete);
        }
    }


    @Test
    public void testPublicTopicReceivesMessage() throws Exception {
        // 1. Ρύθμιση (Arrange)
        CompletableFuture<RealTimeShipUpdateDTO> resultFuture = new CompletableFuture<>();

        // Δημιουργούμε τον handler και συνδεόμαστε.
        // Η μέθοδος connectAsync επιστρέφει ένα Future που ολοκληρώνεται όταν η session είναι έτοιμη.
        // ΚΑΝΟΥΜΕ GET ΣΤΟ FUTURE ΓΙΑ ΝΑ ΠΕΡΙΜΕΝΟΥΜΕ.
        StompSession stompSession = stompClient.connectAsync(URL, new StompSessionHandlerAdapter() {
            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }
        }).get(3, TimeUnit.SECONDS); // <-- ΔΙΟΡΘΩΣΗ: Περιμένουμε μέχρι 3 δευτερόλεπτα για να συνδεθεί.

        // 2. Δράση (Act)
        // Αφού είμαστε σίγουροι ότι έχουμε συνδεθεί, κάνουμε subscribe.
        stompSession.subscribe("/topic/ais-updates", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RealTimeShipUpdateDTO.class;
            }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                resultFuture.complete((RealTimeShipUpdateDTO) payload);
            }
        });

        // Δίνουμε μια μικρή ανάσα και εδώ για σιγουριά, αν και συνήθως δεν χρειάζεται για public topics
        Thread.sleep(200);

        // Στέλνουμε το μήνυμα από τον server.
        RealTimeShipUpdateDTO testDto = RealTimeShipUpdateDTO.builder().mmsi("12345").speedOverGround(10.0).build();
        messagingTemplate.convertAndSend("/topic/ais-updates", testDto);

        // 3. Επιβεβαίωση (Assert)
        RealTimeShipUpdateDTO receivedMessage = resultFuture.get(5, TimeUnit.SECONDS);

        assertThat(receivedMessage).isNotNull();
        assertThat(receivedMessage.getMmsi()).isEqualTo("12345");
        assertThat(receivedMessage.getSpeedOverGround()).isEqualTo(10.0);

        stompSession.disconnect();
    }

    @Test
    public void testPrivateUserQueueReceivesAuthenticatedMessage() throws Exception {
        // 1. Ρύθμιση (Arrange)
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


        // Συνδεόμαστε και περιμένουμε να ολοκληρωθεί η σύνδεση
        StompSession stompSession = stompClient.connectAsync(URL, new WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() {
            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                resultFuture.completeExceptionally(exception);
            }
        }).get(3, TimeUnit.SECONDS); // <-- ΔΙΟΡΘΩΣΗ: Περιμένουμε κι εδώ τη σύνδεση.

        // 2. Δράση (Act)
        // Τώρα που είμαστε συνδεδεμένοι, κάνουμε subscribe στο private κανάλι.
        stompSession.subscribe("/user/queue/notifications", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return NotificationDTO.class;
            }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                resultFuture.complete((NotificationDTO) payload);
            }
        });

        // Δίνουμε χρόνο στον broker να καταχωρήσει το subscription πριν στείλουμε το μήνυμα.
        // Αυτό αποτρέπει τη race condition.
        Thread.sleep(200);

        // Στέλνουμε την ειδοποίηση ΣΥΓΚΕΚΡΙΜΕΝΑ σε αυτόν τον χρήστη.
        NotificationDTO testNotification = NotificationDTO.builder()
                .message("Test Violation")
                .timestamp(Instant.now())
                .mmsi("98765")
                .build();
        messagingTemplate.convertAndSendToUser(testUser.getUsername(), "/queue/notifications", testNotification);

        // 3. Επιβεβαίωση (Assert)
        NotificationDTO receivedMessage = resultFuture.get(10, TimeUnit.SECONDS);

        assertThat(receivedMessage).isNotNull();
        assertThat(receivedMessage.getMessage()).isEqualTo("Test Violation");
        assertThat(receivedMessage.getMmsi()).isEqualTo("98765");

        stompSession.disconnect();
    }
}