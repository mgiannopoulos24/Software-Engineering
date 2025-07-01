package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
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
    private final UserEntityRepository userEntityRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ShipRepository shipRepository;

    @Autowired
    public KafkaConsumerService(AisDataRepository aisDataRepository,
                                ShipRepository shipRepository,
                                ObjectMapper objectMapper,
                                UserEntityRepository userEntityRepository,
                                SimpMessagingTemplate messagingTemplate) {
        this.aisDataRepository = aisDataRepository;
        this.userEntityRepository = userEntityRepository;
        this.shipRepository = shipRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = KafkaProducerService.AIS_TOPIC_NAME, groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void consumeAisData(String messageJson) {
        try {
            AisData aisData = objectMapper.readValue(messageJson, AisData.class);

            // Save the dynamic data to the database
            aisDataRepository.save(aisData);
            // System.out.println("Saved to DB: MMSI " + aisData.getMmsi() + ", ID: " + aisData.getId());

            // --- 1. WebSocket Push Logic ---

            if (aisData.getMmsi() == null || aisData.getMmsi().isBlank()) {
                // Αν δεν υπάρχει MMSI, δεν μπορούμε να κάνουμε τίποτα, οπότε σταματάμε.
                return;
            }

            Long mmsiLong = Long.parseLong(aisData.getMmsi());

            // Βρες το αντίστοιχο 'Ship' από τη βάση για να πάρεις τα στατικά του στοιχεία.
            // Αν δεν βρεθεί το πλοίο (π.χ. είναι η πρώτη φορά που το βλέπουμε),
            // χρησιμοποιούμε τον τύπο UNKNOWN ως προεπιλογή.
            ShipType shipType = shipRepository.findByMmsi(mmsiLong)
                    .map(Ship::getShiptype) // Πάρε μόνο τον τύπο του πλοίου
                    .orElse(ShipType.UNKNOWN); // Αν δεν βρεθεί, χρησιμοποίησε UNKNOWN

            // Δημιούργησε το νέο, εμπλουτισμένο DTO που θα σταλεί μέσω WebSocket.
            RealTimeShipUpdateDTO updateDTO = new RealTimeShipUpdateDTO();
            updateDTO.setMmsi(aisData.getMmsi());
            updateDTO.setSpeedOverGround(aisData.getSpeedOverGround());
            updateDTO.setCourseOverGround(aisData.getCourseOverGround());
            updateDTO.setTrueHeading(aisData.getTrueHeading());

            updateDTO.setLongitude(aisData.getLongitude());
            updateDTO.setLatitude(aisData.getLatitude());
            updateDTO.setTimestampEpoch(aisData.getTimestampEpoch());
            updateDTO.setShiptype(shipType);

            // --- 2. ΑΠΟΣΤΟΛΗ ΜΕΣΩ WEBSOCKET ---

            // A. Στείλε το εμπλουτισμένο DTO στο public κανάλι για όλους.
            messagingTemplate.convertAndSend("/topic/ais-updates", updateDTO);

            // B. Στείλε το εμπλουτισμένο DTO στα ιδιωτικά κανάλια των χρηστών που παρακολουθούν το πλοίο.
            List<UserEntity> usersWatchingThisShip = userEntityRepository.findUsersWatchingMmsi(mmsiLong);
            for (UserEntity userEntity : usersWatchingThisShip) {
                if (userEntity.getEmail() != null) {
                    messagingTemplate.convertAndSendToUser(
                            userEntity.getEmail(),
                            "/queue/fleet-updates",
                            updateDTO // Στέλνουμε το ίδιο εμπλουτισμένο DTO
                    );
                }
            }

        } catch (NumberFormatException e) {
            System.err.println("KAFKA CONSUMER: Could not parse MMSI to Long. Message: " + messageJson);
        } catch (JsonProcessingException e) {
            System.err.println("KAFKA CONSUMER: Critical error deserializing message from Kafka. Message: " + messageJson + " | Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("KAFKA CONSUMER: Critical error during data enrichment or WebSocket push. Message: " + messageJson + " | Error: " + e.getMessage());
        }
    }
}