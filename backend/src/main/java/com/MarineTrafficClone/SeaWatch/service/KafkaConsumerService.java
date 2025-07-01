package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class KafkaConsumerService {

    private final AisDataRepository aisDataRepository;
    private final UserEntityRepository userEntityRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ShipRepository shipRepository;
    private final ZoneOfInterestCacheService zoneCache;

    @Autowired
    public KafkaConsumerService(AisDataRepository aisDataRepository,
                                ShipRepository shipRepository,
                                ObjectMapper objectMapper,
                                UserEntityRepository userEntityRepository,
                                SimpMessagingTemplate messagingTemplate,
                                ZoneOfInterestCacheService zoneCache) {
        this.aisDataRepository = aisDataRepository;
        this.userEntityRepository = userEntityRepository;
        this.shipRepository = shipRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
        this.zoneCache = zoneCache;
    }

    @KafkaListener(topics = KafkaProducerService.AIS_TOPIC_NAME, groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void consumeAisData(String messageJson) {
        try {
            // AIS JSON -> Java object
            AisData aisData = objectMapper.readValue(messageJson, AisData.class);

            // Fetching previous (if it exists) dynamic data for use in zone of interest logic
            Optional<AisData> previous = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(aisData.getMmsi());

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

            // --- Zone Violation Check Logic ---
            checkAllZoneViolations(aisData, previous);

        } catch (NumberFormatException e) {
            System.err.println("KAFKA CONSUMER: Could not parse MMSI to Long. Message: " + messageJson);
        } catch (JsonProcessingException e) {
            System.err.println("KAFKA CONSUMER: Critical error deserializing message from Kafka. Message: " + messageJson + " | Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("KAFKA CONSUMER: Critical error during data enrichment or WebSocket push. Message: " + messageJson + " | Error: " + e.getMessage());
        }
    }


    // ------------------ Methods for Zone Of Interest Logic ---------------------------------------

    private void checkAllZoneViolations(AisData currentPosition, Optional<AisData> previousAisData) {
        List<ZoneOfInterest> zones = zoneCache.getAllActiveZones();
        if (zones.isEmpty() || currentPosition.getLatitude() == null) {
            return; // Nothing to check
        }

        for (ZoneOfInterest zone : zones) {
            boolean isCurrentlyInZone = isInsideZone(currentPosition.getLatitude(), currentPosition.getLongitude(), zone);

            // For entry/exit, we need the previous position ( if it exists )
            boolean wasPreviouslyInZone = false;
            AisData previousPosition = previousAisData.orElse(null);
            if (previousPosition != null && previousPosition.getLatitude() != null) {
                wasPreviouslyInZone = isInsideZone(previousPosition.getLatitude(), previousPosition.getLongitude(), zone);
            }

            switch (zone.getConstraintType()) {
                case ZONE_ENTRY:
                    if (isCurrentlyInZone && !wasPreviouslyInZone) {
                        String msg = String.format("Ship %s entered zone '%s'", currentPosition.getMmsi(), zone.getName());
                        sendNotification(msg, zone);
                    }
                    break;
                case ZONE_EXIT:
                    if (!isCurrentlyInZone && wasPreviouslyInZone) {
                        String msg = String.format("Ship %s exited zone '%s'", currentPosition.getMmsi(), zone.getName());
                        sendNotification(msg, zone);
                    }
                    break;
                case SPEED_LIMIT_ABOVE:
                    if (isCurrentlyInZone && currentPosition.getSpeedOverGround() > zone.getConstraintValue()) {
                        String msg = String.format("Ship %s exceeded speed limit in zone '%s'. Speed: %.1f kts (Limit: %.1f kts)",
                                currentPosition.getMmsi(), zone.getName(), currentPosition.getSpeedOverGround(), zone.getConstraintValue());
                        sendNotification(msg, zone);
                    }
                    break;
                case SPEED_LIMIT_BELOW:
                    if (isCurrentlyInZone && currentPosition.getSpeedOverGround() < zone.getConstraintValue()) {
                        String msg = String.format("Ship %s below minimum speed limit in zone '%s'. Speed: %.1f kts (Limit: %.1f kts)",
                                currentPosition.getMmsi(), zone.getName(), currentPosition.getSpeedOverGround(), zone.getConstraintValue());
                        sendNotification(msg, zone);
                    }
                    break;
            }
        }
    }

    /* Haversine formula for distance calculation between two points on a sphere */
    private boolean isInsideZone(Double lat, Double lon, ZoneOfInterest zone) {
        final int R = 6371 * 1000; // Earth radius in meters

        // Calculate difference in longitude and latitude between the two points (zone center and ship position)
        double dlat = Math.toRadians(lat - zone.getCenterLatitude());
        double dlon = Math.toRadians(lon - zone.getCenterLongitude());

        // Calculate the square of half the chord length between the points.
        double a = Math.sin(dlat / 2) * Math.sin(dlat / 2)
                + Math.cos(Math.toRadians(zone.getCenterLatitude())) * Math.cos(Math.toRadians(lat))
                * Math.sin(dlon / 2) * Math.sin(dlon / 2);

        // Calculate the angular distance in radians.
        // atan2 more numerically stable than asin(√a) when the points are very close to each other.
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Calculate the final distance and compare with the radius of the zone
        return (R * c) <= zone.getRadiusInMeters();
    }

    private void sendNotification(String message, ZoneOfInterest violatedZone) {
        User user = violatedZone.getUser();
        if (user != null && user.getEmail() != null) {
            System.out.println("NOTIFICATION -> To " + user.getEmail() + ": " + message);
            NotificationDTO notification = new NotificationDTO(Instant.now(), message, violatedZone.getId(), violatedZone.getName());
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", notification);
        }
    }
}