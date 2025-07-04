package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.CollisionNotificationDTO;
import com.MarineTrafficClone.SeaWatch.dto.NotificationDTO;
import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.*;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Κεντρικό service που "ακούει" (consumes) μηνύματα από το Kafka topic.
 * Αυτή είναι η καρδιά του backend, καθώς κάθε νέο δεδομένο AIS που φτάνει
 * πυροδοτεί μια σειρά από ενέργειες: αποθήκευση στη βάση, ενημέρωση των clients μέσω WebSocket,
 * έλεγχο για παραβιάσεις ζωνών ενδιαφέροντος και έλεγχο για πιθανές συγκρούσεις.
 */
@Service
public class KafkaConsumerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);

    private final AisDataRepository aisDataRepository;
    private final UserEntityRepository userEntityRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ShipRepository shipRepository;
    private final ZoneOfInterestCacheService zoneCache; // Cache για τις ζώνες ενδιαφέροντος.
    private final CollisionZoneCacheService collisionZoneCache; // Cache για τις ζώνες σύγκρουσης.
    private final ShipPositionCacheService positionCache; // Cache για τις τελευταίες θέσεις όλων των πλοίων.

    // Ένα Set για να παρακολουθούμε ποια ζευγάρια πλοίων έχουν ήδη ειδοποιηθεί για σύγκρουση.
    // Αυτό αποτρέπει την αποστολή εκατοντάδων ειδοποιήσεων για το ίδιο επικείμενο γεγονός.
    // Το κλειδί είναι ένα string της μορφής "mmsi1-mmsi2" (ταξινομημένα).
    private final Set<String> notifiedCollisionPairs = new HashSet<>();

    @Autowired
    public KafkaConsumerService(AisDataRepository aisDataRepository,
                                ShipRepository shipRepository,
                                ObjectMapper objectMapper,
                                UserEntityRepository userEntityRepository,
                                SimpMessagingTemplate messagingTemplate,
                                ZoneOfInterestCacheService zoneCache,
                                CollisionZoneCacheService collisionZoneCache,
                                ShipPositionCacheService positionCache) {
        this.aisDataRepository = aisDataRepository;
        this.userEntityRepository = userEntityRepository;
        this.shipRepository = shipRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
        this.zoneCache = zoneCache;
        this.collisionZoneCache = collisionZoneCache;
        this.positionCache = positionCache;
    }

    /**
     * Η κύρια μέθοδος που καταναλώνει μηνύματα από το Kafka.
     * Το @KafkaListener την ορίζει ως τον παραλήπτη για το συγκεκριμένο topic και group ID.
     * @param messageJson Το μήνυμα από το Kafka, σε μορφή JSON string.
     */
    @KafkaListener(topics = KafkaProducerService.AIS_TOPIC_NAME, groupId = "${spring.kafka.consumer.group-id}")
    @Transactional // Η επεξεργασία γίνεται μέσα σε transaction για ακεραιότητα.
    public void consumeAisData(String messageJson) {
        try {
            // 1. Μετατροπή του JSON σε αντικείμενο AisData.
            AisData aisData = objectMapper.readValue(messageJson, AisData.class);

            if (aisData.getMmsi() == null || aisData.getMmsi().isBlank()) {
                log.debug("Consumed AIS message with no MMSI. Skipping.");
                return;
            }

            // 2. Βρίσκουμε την προηγούμενη θέση του πλοίου. Χρήσιμο για τον έλεγχο εισόδου/εξόδου από ζώνες.
            Optional<AisData> previousAisDataOpt = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(aisData.getMmsi());

            // 3. Αποθήκευση της νέας εγγραφής στη βάση δεδομένων.
            aisDataRepository.save(aisData);

            // 4. Ενημέρωση της cache με την τελευταία θέση του πλοίου.
            positionCache.updatePosition(aisData);

            Long mmsiLong = Long.parseLong(aisData.getMmsi());

            // 5. Βρίσκουμε τα στατικά στοιχεία του πλοίου (τον τύπο του) από το repository.
            // Αν δεν βρεθεί (π.χ., είναι η πρώτη φορά που βλέπουμε αυτό το MMSI),
            // χρησιμοποιούμε τον τύπο UNKNOWN ως προεπιλογή.
            ShipType shipType = shipRepository.findByMmsi(mmsiLong)
                    .map(Ship::getShiptype)
                    .orElse(ShipType.UNKNOWN);

            // 6. Αποστολή ενημερώσεων θέσης μέσω WebSocket στους clients.
            sendRealTimeUpdates(aisData, shipType, mmsiLong);

            // 7. Έλεγχος για παραβιάσεις των ζωνών ενδιαφέροντος.
            checkAllZoneViolations(aisData, previousAisDataOpt, shipType);

            // 8. Έλεγχος για πιθανές συγκρούσεις.
            checkCollisions(aisData);

        } catch (NumberFormatException e) {
            log.warn("KAFKA CONSUMER: Could not parse MMSI to Long. Message: {}", messageJson, e);
        } catch (JsonProcessingException e) {
            log.error("KAFKA CONSUMER: Critical error deserializing message from Kafka. Message: {}", messageJson, e);
        } catch (Exception e) {
            log.error("KAFKA CONSUMER: An unexpected critical error occurred. Message: {}", messageJson, e);
        }
    }

    /**
     * Στέλνει ενημερώσεις σε πραγματικό χρόνο μέσω WebSocket.
     */
    private void sendRealTimeUpdates(AisData aisData, ShipType shipType, Long mmsiLong) {
        // Δημιουργία του DTO που θα σταλεί.
        RealTimeShipUpdateDTO updateDTO = new RealTimeShipUpdateDTO();
        updateDTO.setMmsi(aisData.getMmsi());
        updateDTO.setSpeedOverGround(aisData.getSpeedOverGround());
        updateDTO.setCourseOverGround(aisData.getCourseOverGround());
        updateDTO.setNavigationalStatus(aisData.getNavigationalStatus());
        updateDTO.setTrueHeading(aisData.getTrueHeading());
        updateDTO.setLongitude(aisData.getLongitude());
        updateDTO.setLatitude(aisData.getLatitude());
        updateDTO.setTimestampEpoch(aisData.getTimestampEpoch());
        updateDTO.setShiptype(shipType);

        // Αποστολή 1: Public broadcast στο κανάλι /topic/ais-updates για όλους τους clients.
        messagingTemplate.convertAndSend("/topic/ais-updates", updateDTO);

        // Αποστολή 2: Private updates στους χρήστες που παρακολουθούν αυτό το πλοίο στον στόλο τους.
        List<UserEntity> usersWatchingThisShip = userEntityRepository.findUsersWatchingMmsi(mmsiLong);
        for (UserEntity userEntity : usersWatchingThisShip) {
            if (userEntity.getEmail() != null) {
                // Η SimpMessagingTemplate χειρίζεται τη δρομολόγηση στο σωστό session του χρήστη.
                messagingTemplate.convertAndSendToUser(userEntity.getEmail(), "/queue/fleet-updates", updateDTO);
            }
        }
    }

    // ----- Λογική για τις Ζώνες Ενδιαφέροντος -----

    /**
     * Ελέγχει την τρέχουσα θέση ενός πλοίου σε σχέση με όλες τις ενεργές ζώνες ενδιαφέροντος
     * και τους περιορισμούς τους.
     */
    private void checkAllZoneViolations(AisData currentPosition, Optional<AisData> previousAisData, ShipType shipType) {
        List<ZoneOfInterest> zones = zoneCache.getAllActiveZones();
        if (zones.isEmpty() || currentPosition.getLatitude() == null) {
            return;
        }

        for (ZoneOfInterest zone : zones) {
            // Έλεγχος αν το πλοίο είναι τώρα μέσα στη ζώνη.
            boolean isCurrentlyInZone = isInsideZone(currentPosition, zone);
            // Έλεγχος αν το πλοίο ήταν πριν μέσα στη ζώνη.
            boolean wasPreviouslyInZone = previousAisData
                    .filter(prev -> prev.getLatitude() != null)
                    .map(prev -> isInsideZone(prev, zone))
                    .orElse(false);

            // Έλεγχos για κάθε περιορισμό της ζώνης.
            for (ZoneConstraint constraint : zone.getConstraints()) {
                String msg;
                switch (constraint.getType()) {
                    case ZONE_ENTRY:
                        if (isCurrentlyInZone && !wasPreviouslyInZone) {
                            msg = String.format("Ship %s entered zone '%s'", currentPosition.getMmsi(), zone.getName());
                            sendNotification(msg, zone, currentPosition, constraint);
                        }
                        break;

                    case ZONE_EXIT:
                        if (!isCurrentlyInZone && wasPreviouslyInZone) {
                            msg = String.format("Ship %s exited zone '%s'", currentPosition.getMmsi(), zone.getName());
                            sendNotification(msg, zone, currentPosition, constraint);
                        }
                        break;

                    // --- Κανόνες Κατάστασης (Ελέγχονται μόνο αν το πλοίο είναι ΜΕΣΑ) ---
                    case SPEED_LIMIT_ABOVE:
                        if (isCurrentlyInZone && currentPosition.getSpeedOverGround() != null) {
                            try {
                                double speedLimit = Double.parseDouble(constraint.getValue());
                                if (currentPosition.getSpeedOverGround() > speedLimit) {
                                    msg = String.format("Ship %s exceeded speed limit in zone '%s'. Speed: %.1f kts (Limit: %.1f kts)",
                                            currentPosition.getMmsi(), zone.getName(), currentPosition.getSpeedOverGround(), speedLimit);
                                    sendNotification(msg, zone, currentPosition, constraint);
                                }
                            } catch (NumberFormatException e) {
                                log.warn("ZONE CHECK: Invalid speed limit above value '{}' for zone '{}'", constraint.getValue(), zone.getName());
                            }
                        }
                        break;

                    case SPEED_LIMIT_BELOW:
                        if (isCurrentlyInZone && currentPosition.getSpeedOverGround() != null) {
                            try {
                                double speedLimit = Double.parseDouble(constraint.getValue());
                                if (currentPosition.getSpeedOverGround() < speedLimit) {
                                    msg = String.format("Ship %s is below minimum speed in zone '%s'. Speed: %.1f kts (Limit: %.1f kts)",
                                            currentPosition.getMmsi(), zone.getName(), currentPosition.getSpeedOverGround(), speedLimit);
                                    sendNotification(msg, zone, currentPosition, constraint);
                                }
                            } catch (NumberFormatException e) {
                                log.warn("ZONE CHECK: Invalid speed limit below value '{}' for zone '{}'", constraint.getValue(), zone.getName());
                            }
                        }
                        break;

                    case FORBIDDEN_SHIP_TYPE:
                        if (isCurrentlyInZone && shipType != null) {
                            if (shipType.getValue().equalsIgnoreCase(constraint.getValue())) {
                                msg = String.format("Forbidden ship type ('%s') detected in zone '%s'. Ship: %s",
                                        shipType.getValue(), zone.getName(), currentPosition.getMmsi());
                                sendNotification(msg, zone, currentPosition, constraint);
                            }
                        }
                        break;

                    case UNWANTED_NAV_STATUS:
                        if (isCurrentlyInZone && currentPosition.getNavigationalStatus() != null) {
                            try {
                                int unwantedStatus = Integer.parseInt(constraint.getValue());
                                if (currentPosition.getNavigationalStatus() == unwantedStatus) {
                                    msg = String.format("Ship %s with unwanted status code (%d) detected in zone '%s'.",
                                            currentPosition.getMmsi(), unwantedStatus, zone.getName());
                                    sendNotification(msg, zone, currentPosition, constraint);
                                }
                            } catch (NumberFormatException e) {
                                log.warn("ZONE CHECK: Invalid NavStatus value '{}' for zone '{}'", constraint.getValue(), zone.getName());
                            }
                        }
                        break;
                }
            }
        }
    }

    /**
     * Υπολογίζει αν ένα σημείο βρίσκεται μέσα σε μια κυκλική ζώνη χρησιμοποιώντας τον τύπο Haversine.
     */
    private boolean isInsideZone(AisData position, ZoneOfInterest zone) {
        final int R = 6371 * 1000; // Ακτίνα της Γης σε μέτρα

        // Υπολόγισε την διαφρορά σε longitude και latitude ανάμεσα σε 2 σημεία (κέντρο ζόνης και θέση πλοίου)
        double dLat = Math.toRadians(position.getLatitude() - zone.getCenterLatitude());
        double dLon = Math.toRadians(position.getLongitude() - zone.getCenterLongitude());

        // Υπολόγισε το τετράγωνο του μισού μήκους της χορδής μεταξύ των σημείων.
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(zone.getCenterLatitude())) * Math.cos(Math.toRadians(position.getLatitude()))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        // Υπολόγισε τη γωνιακή απόσταση σε ακτίνια.
        // Το atan2 είναι αριθμητικά πιο σταθερό από το asin(√a) όταν τα σημεία είναι πολύ κοντά το ένα στο άλλο.
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Υπολόγισε την τελική απόσταση και σύγκρινε την με την ακτίνα της ζώνης
        return (R * c) <= zone.getRadiusInMeters();
    }

    /**
     * Στέλνει μια ειδοποίηση παραβίασης ζώνης στον ιδιοκτήτη της ζώνης.
     */
    private void sendNotification(String message, ZoneOfInterest violatedZone, AisData shipData, ZoneConstraint violatedConstraint) {
        UserEntity user = violatedZone.getUser();
        if (user != null && user.getEmail() != null) {
            log.info("NOTIFICATION -> To {}: {}", user.getEmail(), message);
            NotificationDTO notification = NotificationDTO.builder()
                    .timestamp(Instant.now())
                    .message(message)
                    .zoneId(violatedZone.getId())
                    .zoneName(violatedZone.getName())
                    .violationType(violatedConstraint.getType())
                    .mmsi(shipData.getMmsi())
                    .latitude(shipData.getLatitude())
                    .longitude(shipData.getLongitude())
                    .build();
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", notification);
        }
    }

    // ----- Λογική για τις Συγκρούσεις -----

    /**
     * Ελέγχει το τρέχον πλοίο για πιθανές συγκρούσεις με όλα τα άλλα ενεργά πλοία.
     */
    private void checkCollisions(AisData currentShipData) {
        List<CollisionZone> zones = collisionZoneCache.getAllActiveZones();
        if (zones.isEmpty() || currentShipData.getLatitude() == null) {
            return;
        }

        // Παίρνουμε την τελευταία θέση ΟΛΩΝ των πλοίων από την cache για σύγκριση.
        Collection<AisData> allOtherShips = positionCache.getAllLatestPositions();

        for (CollisionZone zone : zones) {
            // Έλεγχος αν το τρέχον πλοίο είναι μέσα στη ζώνη σύγκρουσης.
            if (isInsideCollisionZone(currentShipData, zone)) {
                // Αν είναι, το συγκρίνουμε με όλα τα άλλα πλοία.
                for (AisData otherShipData : allOtherShips) {
                    if (!shouldCompareShips(currentShipData, otherShipData)) {
                        continue; // Αγνοούμε τη σύγκριση με τον εαυτό του ή με σταματημένα πλοία.
                    }

                    // Έλεγχος αν και το άλλο πλοίο είναι μέσα στην ΙΔΙΑ ζώνη.
                    if (isInsideCollisionZone(otherShipData, zone)) {
                        // Αν είναι και τα δύο μέσα, ελέγχουμε για πιθανή σύγκρουση.
                        if (predictCollision(currentShipData, otherShipData)) {
                            String pairKey = createCollisionPairKey(currentShipData.getMmsi(), otherShipData.getMmsi());
                            if (!notifiedCollisionPairs.contains(pairKey)) {
                                String msg = String.format("Collision Alert in zone '%s'! Ship %s and Ship %s are on a collision course.",
                                        zone.getName(), currentShipData.getMmsi(), otherShipData.getMmsi());
                                sendCollisionNotification(msg, zone, currentShipData, otherShipData);
                                notifiedCollisionPairs.add(pairKey); // Σημειώνουμε ότι έχουμε ειδοποιήσει γι' αυτό το ζευγάρι.
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Απλός αλγόριθμος πρόβλεψης σύγκρουσης βασισμένος στον υπολογισμό του
     * Closest Point of Approach (CPA).
     */
    private boolean predictCollision(AisData shipA, AisData shipB) {
        // Ορίζουμε τα όρια μας: κίνδυνος αν θα πλησιάσουν κάτω από 500 μέτρα στα επόμενα 10 λεπτά (600 δευτ.)
        final double DANGER_DISTANCE_METERS = 500.0; // Επικίνδυνη απόσταση < 500μ.
        final double TIME_HORIZON_SECONDS = 600.0;   // Χρονικός ορίζοντας πρόβλεψης: 10 λεπτά.

        // Μετατροπή ταχύτητας από κόμβους σε μέτρα/δευτερόλεπτο
        double vA = shipA.getSpeedOverGround() * 0.514444; // κόμβοι σε m/s
        double vB = shipB.getSpeedOverGround() * 0.514444; // κόμβοι σε m/s

        // Μετατροπή πορείας από μοίρες σε radians
        double courseA_rad = Math.toRadians(shipA.getCourseOverGround());
        double courseB_rad = Math.toRadians(shipB.getCourseOverGround());

        // Υπολογισμός συνιστωσών ταχύτητας (vx, vy) για κάθε πλοίο
        double vAx = vA * Math.sin(courseA_rad);
        double vAy = vA * Math.cos(courseA_rad);
        double vBx = vB * Math.sin(courseB_rad);
        double vBy = vB * Math.cos(courseB_rad);

        // Απλοποιημένη μετατροπή συντεταγμένων σε μέτρα. Για μεγαλύτερη ακρίβεια, χρειάζεται προβολή.
        double distanceX = (shipB.getLongitude() - shipA.getLongitude()) * 111111 * Math.cos(Math.toRadians(shipA.getLatitude()));
        double distanceY = (shipB.getLatitude() - shipA.getLatitude()) * 111111;

        // Σχετική ταχύτητα
        double rVx = vBx - vAx;
        double rVy = vBy - vAy;

        // Υπολογισμός του χρόνου και της απόστασης στο Closest Point of Approach (CPA)
        double dotProduct_v_d = (rVx * distanceX) + (rVy * distanceY);
        double dotProduct_v_v = (rVx * rVx) + (rVy * rVy);

        if (dotProduct_v_v == 0) return false; // Δεν έχουν σχετική ταχύτητα

        double t_cpa = -dotProduct_v_d / dotProduct_v_v;

        // Ελέγχουμε μόνο για μελλοντικές συγκρούσεις εντός του χρονικού μας ορίζοντα
        if (t_cpa > 0 && t_cpa < TIME_HORIZON_SECONDS) {
            // Απόσταση στο σημείο CPA
            double d_cpa_squared = Math.pow(distanceX + rVx * t_cpa, 2) + Math.pow(distanceY + rVy * t_cpa, 2);
            return Math.sqrt(d_cpa_squared) < DANGER_DISTANCE_METERS; // ΚΙΝΔΥΝΟΣ!
        }

        return false;
    }

    // --- Βοηθητικές Μέθοδοι για τη Λογική Συγκρούσεων ---

    private boolean shouldCompareShips(AisData shipA, AisData shipB) {
        if (shipA.getMmsi().equals(shipB.getMmsi())) {
            return false;
        }
        // Αγνοούμε πλοία που είναι σχεδόν σταματημένα ή δεν έχουν έγκυρα δεδομένα
        return shipB.getSpeedOverGround() != null && shipB.getSpeedOverGround() >= 1.0;
    }

    private String createCollisionPairKey(String mmsi1, String mmsi2) {
        // Δημιουργεί ένα σταθερό, ταξινομημένο κλειδί για ένα ζευγάρι MMSI.
        return mmsi1.compareTo(mmsi2) < 0 ? mmsi1 + "-" + mmsi2 : mmsi2 + "-" + mmsi1;
    }

    private boolean isInsideCollisionZone(AisData data, CollisionZone zone) {
        if (data.getLatitude() == null || data.getLongitude() == null) return false;
        final int R = 6371 * 1000;  // Ακτίνα της Γης σε μέτρα

        // Υπολόγισε την διαφρορά σε longitude και latitude ανάμεσα σε 2 σημεία (κέντρο ζόνης και θέση πλοίου)
        double dLat = Math.toRadians(data.getLatitude() - zone.getCenterLatitude());
        double dLon = Math.toRadians(data.getLongitude() - zone.getCenterLongitude());

        // Υπολόγισε το τετράγωνο του μισού μήκους της χορδής μεταξύ των σημείων.
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(zone.getCenterLatitude())) * Math.cos(Math.toRadians(data.getLatitude())) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        // Υπολόγισε τη γωνιακή απόσταση σε ακτίνια.
        // Το atan2 είναι αριθμητικά πιο σταθερό από το asin(√a) όταν τα σημεία είναι πολύ κοντά το ένα στο άλλο.
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Υπολόγισε την τελική απόσταση και σύγκρινε την με την ακτίνα της ζώνης
        return (R * c) <= zone.getRadiusInMeters();
    }

    private void sendCollisionNotification(String message, CollisionZone zone, AisData shipA, AisData shipB) {
        UserEntity user = zone.getUser();
        if (user != null && user.getEmail() != null) {
            log.info("COLLISION_ALERT -> To {}: {}", user.getEmail(), message);

            // Δημιουργία των αντικειμένων ShipInfo για κάθε πλοίο
            CollisionNotificationDTO.ShipInfo shipInfoA = CollisionNotificationDTO.ShipInfo.builder()
                    .mmsi(shipA.getMmsi())
                    .latitude(shipA.getLatitude())
                    .longitude(shipA.getLongitude())
                    .build();

            CollisionNotificationDTO.ShipInfo shipInfoB = CollisionNotificationDTO.ShipInfo.builder()
                    .mmsi(shipB.getMmsi())
                    .latitude(shipB.getLatitude())
                    .longitude(shipB.getLongitude())
                    .build();

            // Δημιουργία του τελικού DTO της ειδοποίησης
            CollisionNotificationDTO notification = CollisionNotificationDTO.builder()
                    .timestamp(Instant.now())
                    .message(message)
                    .zoneId(zone.getId())
                    .zoneName(zone.getName())
                    .shipA(shipInfoA)
                    .shipB(shipInfoB)
                    .build();

            // Αποστολή σε ένα νέο, εξειδικευμένο κανάλι WebSocket για τις ειδοποιήσεις σύγκρουσης.
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/collision-alerts", notification);
        }
    }
}