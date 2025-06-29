package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.User;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class KafkaConsumerService {

    private final AisDataRepository aisDataRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ShipRepository shipRepository;

    @Autowired
    public KafkaConsumerService(AisDataRepository aisDataRepository,
                                ShipRepository shipRepository,
                                ObjectMapper objectMapper,
                                UserRepository userRepository,
                                SimpMessagingTemplate messagingTemplate) {
        this.aisDataRepository = aisDataRepository;
        this.userRepository = userRepository;
        this.shipRepository = shipRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = KafkaProducerService.AIS_TOPIC_NAME, groupId = "${spring.kafka.consumer.group-id}")
    @Transactional // Good to have for the DB save and subsequent logic
    public void consumeAisData(String messageJson) {
        try {
            AisData aisData = objectMapper.readValue(messageJson, AisData.class);

            // Save the dynamic data to the database
            aisDataRepository.save(aisData);
            // System.out.println("Saved to DB: MMSI " + aisData.getMmsi() + ", ID: " + aisData.getId());

            // --- WebSocket Push Logic ---

            // 1. ALWAYS send to the public "/topic/ais-updates" for "Watch All" mode
            messagingTemplate.convertAndSend("/topic/ais-updates", aisData);

            // 2. NOW, find specific users watching this ship and send to their private queue
            if (aisData.getMmsi() != null && !aisData.getMmsi().isBlank()) {
                try {
                    Long mmsiLong = Long.parseLong(aisData.getMmsi());
                    List<User> usersWatchingThisShip = userRepository.findUsersWatchingMmsi(mmsiLong);

                    for (User user : usersWatchingThisShip) {
                        // Spring uses the user's name (from the Principal) to route the message.
                        // Ensure your UserDetailsService provides the user's email or username here.
                        if (user.getEmail() != null) { // Or getUsername(), depending on what your security Principal uses
                            messagingTemplate.convertAndSendToUser(
                                    user.getEmail(),             // The user's principal name (must match what Spring Security uses)
                                    "/queue/fleet-updates",      // The private queue destination
                                    aisData                      // The message payload (AisData object)
                            );
                        }
                    }
                } catch (NumberFormatException e) {
                    System.err.println("WEBSOCKET PUSH: Could not parse MMSI to Long: " + aisData.getMmsi());
                } catch (Exception e) {
                    // Catch other exceptions to prevent the whole consumer from failing
                    System.err.println("WEBSOCKET PUSH: Error finding users or sending message for MMSI " + aisData.getMmsi() + ". Error: " + e.getMessage());
                }
            }

        } catch (JsonProcessingException e) {
            System.err.println("KAFKA CONSUMER: Critical error deserializing message from Kafka. Message: " + messageJson + " | Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("KAFKA CONSUMER: Critical error saving to DB or during WebSocket push. Message: " + messageJson + " | Error: " + e.getMessage());
            // Consider sending to a Dead Letter Topic (DLT) for unprocessable messages
        }
    }
}