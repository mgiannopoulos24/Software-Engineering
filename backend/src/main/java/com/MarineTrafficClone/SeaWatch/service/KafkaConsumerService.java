package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.CollisionNotificationDTO;
import com.MarineTrafficClone.SeaWatch.dto.NotificationDTO;
import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType;
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
import java.util.concurrent.ConcurrentHashMap;


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
    // Χρησιμοποιούμε ConcurrentHashMap.newKeySet() για να είναι thread-safe.
    private final Set<String> notifiedCollisionPairs = ConcurrentHashMap.newKeySet();

    /**
     * Cache για τις ενεργές παραβιάσεις ζωνών ενδιαφέροντος.
     * Αποθηκεύει τις παραβιάσεις που "συμβαίνουν τώρα" για να μην στέλνονται επαναλαμβανόμενες ειδοποιήσεις.
     * Κλειδί: Ένα μοναδικό string που συνδυάζει MMSI, Zone ID και Constraint Type.
     * Χρησιμοποιούμε ConcurrentHashMap.newKeySet() για να είναι thread-safe, καθώς ο Kafka consumer μπορεί να τρέχει σε πολλαπλά threads.
     */
    private final Set<String> activeViolationsCache = ConcurrentHashMap.newKeySet();

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
            // Προσπαθούμε να βρούμε το πλοίο. Αν δεν υπάρχει, το orElseGet θα εκτελεστεί
            // για να δημιουργήσει ένα νέο, να το αποθηκεύσει και να το επιστρέψει.
            Ship ship = shipRepository.findByMmsi(mmsiLong).orElseGet(() -> {
                log.info("KAFKA CONSUMER: New ship with MMSI {} detected. Creating new entry with UNKNOWN type.", mmsiLong);
                Ship newShip = new Ship();
                newShip.setMmsi(mmsiLong);
                newShip.setShiptype(ShipType.UNKNOWN); // Ορίζουμε τον τύπο ως UNKNOWN
                return shipRepository.save(newShip); // Το αποθηκεύουμε στη βάση
            });
            // Τώρα είμαστε σίγουροι ότι έχουμε μια οντότητα Ship και μπορούμε να πάρουμε τον τύπο της.
            ShipType shipType = ship.getShiptype();

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

    /**
     * Βοηθητική μέθοδος που δημιουργεί ένα μοναδικό, αναγνωρίσιμο κλειδί για την cache παραβιάσεων.
     * @param mmsi Το MMSI του πλοίου.
     * @param zoneId Το ID της ζώνης.
     * @param type Ο τύπος του περιορισμού.
     * @return Ένα string που λειτουργεί ως κλειδί, π.χ., "mmsi:123-zone:45-constraint:SPEED_LIMIT_ABOVE".
     */
    private String createViolationCacheKey(String mmsi, Long zoneId, ZoneConstraintType type) {
        return "mmsi:" + mmsi + "-zone:" + zoneId + "-constraint:" + type.name();
    }

    // ----- Λογική για τις Ζώνες Ενδιαφέροντος -----

    /**
     * Η κύρια λογική για τον έλεγχο όλων των παραβιάσεων.
     * Ελέγχει την τρέχουσα θέση ενός πλοίου σε σχέση με όλες τις ενεργές ζώνες ενδιαφέροντος
     * και τους περιορισμούς τους, χρησιμοποιώντας την activeViolationsCache για να αποφύγει διπλές ειδοποιήσεις.
     * @param currentPosition Τα τρέχοντα δεδομένα του πλοίου.
     * @param previousAisDataOpt Τα προηγούμενα δεδομένα του πλοίου (αν υπάρχουν).
     * @param shipType Ο τύπος του πλοίου.
     */
    private void checkAllZoneViolations(AisData currentPosition, Optional<AisData> previousAisDataOpt, ShipType shipType) {
        List<ZoneOfInterest> zones = zoneCache.getAllActiveZones();
        if (zones.isEmpty() || currentPosition.getLatitude() == null) {
            return;
        }

        for (ZoneOfInterest zone : zones) {
            boolean isCurrentlyInZone = isInsideZone(currentPosition, zone);
            boolean wasPreviouslyInZone = previousAisDataOpt
                    .map(prev -> isInsideZone(prev, zone))
                    .orElse(false);

            // Έλεγχos για παραβιάσεις που αφορούν ΑΛΛΑΓΗ κατάστασης (είσοδος/έξοδος).
            if (isCurrentlyInZone && !wasPreviouslyInZone) {
                handleEntryExitViolation(zone, currentPosition, true); // Το πλοίο μόλις μπήκε.
            } else if (!isCurrentlyInZone && wasPreviouslyInZone) {
                handleEntryExitViolation(zone, currentPosition, false); // Το πλοίο μόλις βγήκε.
            }

            // Έλεγχος για παραβιάσεις που αφορούν ΣΥΝΕΧΗ κατάσταση (ταχύτητα, τύπος, κλπ.).
            if (isCurrentlyInZone) {
                // Αν το πλοίο είναι μέσα, ελέγχουμε όλους τους stateful περιορισμούς.
                for (ZoneConstraint constraint : zone.getConstraints()) {
                    handleStatefulViolation(constraint, zone, currentPosition, shipType);
                }
            } else {
                // Αν το πλοίο είναι έξω, πρέπει να καθαρίσουμε τυχόν ενεργές παραβιάσεις του για αυτή τη ζώνη.
                clearActiveViolationsForZone(zone, currentPosition.getMmsi());
            }
        }
    }

    /**
     * Χειρίζεται τις παραβιάσεις εισόδου/εξόδου, που είναι γεγονότα και δεν χρειάζονται cache.
     * @param zone Η ζώνη που παραβιάστηκε.
     * @param position Η θέση του πλοίου.
     * @param isEntry True αν είναι είσοδος, false αν είναι έξοδος.
     */
    private void handleEntryExitViolation(ZoneOfInterest zone, AisData position, boolean isEntry) {
        ZoneConstraintType type = isEntry ? ZoneConstraintType.ZONE_ENTRY : ZoneConstraintType.ZONE_EXIT;
        zone.getConstraints().stream()
                .filter(c -> c.getConstraintType() == type)
                .findFirst()
                .ifPresent(constraint -> {
                    String msg = String.format("Ship %s %s zone '%s'", position.getMmsi(), isEntry ? "entered" : "exited", zone.getName());
                    sendNotification(msg, zone, position, constraint);
                });
    }

    /**
     * Χειρίζεται τις παραβιάσεις που εξαρτώνται από την κατάσταση (stateful), όπως η ταχύτητα.
     * Χρησιμοποιεί την cache για να στέλνει ειδοποίηση μόνο μία φορά.
     * @param constraint Ο περιορισμός προς έλεγχο.
     * @param zone Η ζώνη.
     * @param position Η θέση του πλοίου.
     * @param shipType Ο τύπος του πλοίου.
     */
    private void handleStatefulViolation(ZoneConstraint constraint, ZoneOfInterest zone, AisData position, ShipType shipType) {
        String cacheKey = createViolationCacheKey(position.getMmsi(), zone.getId(), constraint.getConstraintType());
        boolean isViolating = false;
        String msg = "";

        try {
            switch (constraint.getConstraintType()) {
                case SPEED_LIMIT_ABOVE:
                    if (position.getSpeedOverGround() != null) {
                        double limit = Double.parseDouble(constraint.getConstraintValue());
                        if (position.getSpeedOverGround() > limit) {
                            isViolating = true;
                            msg = String.format("Ship %s exceeded speed limit in zone '%s'. Speed: %.1f kts (Limit: %.1f kts)", position.getMmsi(), zone.getName(), position.getSpeedOverGround(), limit);
                        }
                    }
                    break;
                case SPEED_LIMIT_BELOW:
                    if (position.getSpeedOverGround() != null) {
                        double limit = Double.parseDouble(constraint.getConstraintValue());
                        if (position.getSpeedOverGround() < limit) {
                            isViolating = true;
                            msg = String.format("Ship %s is below minimum speed in zone '%s'. Speed: %.1f kts (Limit: %.1f kts)", position.getMmsi(), zone.getName(), position.getSpeedOverGround(), limit);
                        }
                    }
                    break;
                case FORBIDDEN_SHIP_TYPE:
                    if (shipType != null && shipType.getValue().equalsIgnoreCase(constraint.getConstraintValue())) {
                        isViolating = true;
                        msg = String.format("Forbidden ship type ('%s') detected in zone '%s'. Ship: %s", shipType.getValue(), zone.getName(), position.getMmsi());
                    }
                    break;
                case UNWANTED_NAV_STATUS:
                    if (position.getNavigationalStatus() != null) {
                        int unwantedStatus = Integer.parseInt(constraint.getConstraintValue());
                        if (position.getNavigationalStatus() == unwantedStatus) {
                            isViolating = true;
                            msg = String.format("Ship %s with unwanted status code (%d) detected in zone '%s'.", position.getMmsi(), unwantedStatus, zone.getName());
                        }
                    }
                    break;
                default:
                    // Αυτό το switch χειρίζεται μόνο stateful παραβιάσεις.
                    return;
            }
        } catch (NumberFormatException e) {
            log.warn("ZONE CHECK: Invalid constraint value '{}' for constraint type {} in zone '{}'", constraint.getConstraintValue(), constraint.getConstraintType(), zone.getName());
            return;
        }

        // Κεντρική Λογική: Αποφασίζει αν θα στείλει ειδοποίηση ή θα καθαρίσει την cache.
        if (isViolating) {
            // Αν το πλοίο παραβιάζει τον κανόνα ΚΑΙ είναι μια ΝΕΑ παραβίαση (δεν υπάρχει στην cache),
            // τότε στέλνουμε ειδοποίηση και την προσθέτουμε στην cache.
            if (!activeViolationsCache.contains(cacheKey)) {
                sendNotification(msg, zone, position, constraint);
                activeViolationsCache.add(cacheKey);
            }
        } else {
            // Αν το πλοίο ΔΕΝ παραβιάζει τον κανόνα, αφαιρούμε την παραβίαση από την cache
            // (αν υπήρχε), ώστε να μπορεί να ενεργοποιηθεί ξανά στο μέλλον.
            activeViolationsCache.remove(cacheKey);
        }
    }

    /**
     * Καθαρίζει όλες τις ενεργές stateful παραβιάσεις για ένα συγκεκριμένο πλοίο όταν αυτό βγαίνει από μια ζώνη.
     * @param zone Η ζώνη από την οποία βγήκε το πλοίο.
     * @param mmsi Το MMSI του πλοίου.
     */
    private void clearActiveViolationsForZone(ZoneOfInterest zone, String mmsi) {
        for (ZoneConstraint constraint : zone.getConstraints()) {
            switch (constraint.getConstraintType()) {
                case SPEED_LIMIT_ABOVE:
                case SPEED_LIMIT_BELOW:
                case FORBIDDEN_SHIP_TYPE:
                case UNWANTED_NAV_STATUS:
                    String cacheKey = createViolationCacheKey(mmsi, zone.getId(), constraint.getConstraintType());
                    activeViolationsCache.remove(cacheKey);
                    break;
                default:
                    // Δεν κάνουμε τίποτα για τους περιορισμούς εισόδου/εξόδου.
            }
        }
    }

    /**
     * Υπολογίζει αν ένα σημείο βρίσκεται μέσα σε μια κυκλική ζώνη χρησιμοποιώντας τον τύπο Haversine.
     */
    private boolean isInsideZone(AisData position, ZoneOfInterest zone) {
        final int R = 6371 * 1000; // Ακτίνα της Γης σε μέτρα

        // Υπολόγισε την διαφορά σε longitude και latitude ανάμεσα σε 2 σημεία (κέντρο ζώνης και θέση πλοίου)
        double dLat = Math.toRadians(position.getLatitude() - zone.getCenterLatitude());
        double dLon = Math.toRadians(position.getLongitude() - zone.getCenterLongitude());

        // Υπολόγισε το τετράγωνο του μισού μήκους της χορδής μεταξύ των σημείων.
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(zone.getCenterLatitude())) * Math.cos(Math.toRadians(position.getLatitude()))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        // Υπολόγισε τη γωνιακή απόσταση σε ακτίνια.
        // Το atan2 είναι αριθμητικά πιο σταθερό από το asin(√a) όταν τα σημεία είναι πολύ κοντά το ένα στο άλλο.
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Υπολόγισε την τελική απόσταση και σύγκρινέ την με την ακτίνα της ζώνης
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
                    .violationType(violatedConstraint.getConstraintType())
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
                            // Στέλνουμε ειδοποίηση μόνο αν ΔΕΝ έχουμε ήδη ειδοποιήσει γι' αυτό το ζευγάρι.
                            if (!notifiedCollisionPairs.contains(pairKey)) {
                                String msg = String.format("Collision Alert in zone '%s'! Ship %s and Ship %s are on a collision course.",
                                        zone.getName(), currentShipData.getMmsi(), otherShipData.getMmsi());
                                sendCollisionNotification(msg, zone, currentShipData, otherShipData);
                                notifiedCollisionPairs.add(pairKey); // Σημειώνουμε ότι έχουμε ειδοποιήσει.
                            }
                        } else {
                            // Αν δεν βρίσκονται πλέον σε πορεία σύγκρουσης, τους αφαιρούμε από τη λίστα
                            // ειδοποιημένων, ώστε να ειδοποιηθούν ξανά αν ο κίνδυνος επανεμφανιστεί.
                            String pairKey = createCollisionPairKey(currentShipData.getMmsi(), otherShipData.getMmsi());
                            notifiedCollisionPairs.remove(pairKey);
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

        // Απλοποιημένη μετατροπή συντεταγμένων σε μέτρα. Για μεγαλύτερη ακρίβεια, χρειάζεται προβολή (π.χ. Mercator).
        double distanceX = (shipB.getLongitude() - shipA.getLongitude()) * 111111 * Math.cos(Math.toRadians(shipA.getLatitude()));
        double distanceY = (shipB.getLatitude() - shipA.getLatitude()) * 111111;

        // Σχετική ταχύτητα
        double rVx = vBx - vAx;
        double rVy = vBy - vAy;

        // Υπολογισμός του χρόνου και της απόστασης στο Closest Point of Approach (CPA)
        double dotProduct_v_d = (rVx * distanceX) + (rVy * distanceY);
        double dotProduct_v_v = (rVx * rVx) + (rVy * rVy);

        if (dotProduct_v_v == 0) return false; // Δεν έχουν σχετική ταχύτητα, δεν θα συγκρουστούν ποτέ.

        double t_cpa = -dotProduct_v_d / dotProduct_v_v;

        // Ελέγχουμε μόνο για μελλοντικές συγκρούσεις εντός του χρονικού μας ορίζοντα.
        if (t_cpa > 0 && t_cpa < TIME_HORIZON_SECONDS) {
            // Υπολογίζουμε την απόσταση στο σημείο CPA
            double d_cpa_squared = Math.pow(distanceX + rVx * t_cpa, 2) + Math.pow(distanceY + rVy * t_cpa, 2);
            return Math.sqrt(d_cpa_squared) < DANGER_DISTANCE_METERS; // ΚΙΝΔΥΝΟΣ!
        }

        return false;
    }

    // --- Βοηθητικές Μέθοδοι για τη Λογική Συγκρούσεων ---

    /**
     * Ελέγχει αν δύο πλοία πρέπει να συγκριθούν για σύγκρουση.
     * @param shipA Το πρώτο πλοίο.
     * @param shipB Το δεύτερο πλοίο.
     * @return true αν πρέπει να γίνει σύγκριση.
     */
    private boolean shouldCompareShips(AisData shipA, AisData shipB) {
        // Δεν συγκρίνουμε ένα πλοίο με τον εαυτό του.
        if (shipA.getMmsi().equals(shipB.getMmsi())) {
            return false;
        }
        // Αγνοούμε πλοία που είναι σχεδόν σταματημένα (ταχύτητα < 1 κόμβος) ή δεν έχουν έγκυρα δεδομένα ταχύτητας.
        return shipB.getSpeedOverGround() != null && shipB.getSpeedOverGround() >= 1.0;
    }

    /**
     * Δημιουργεί ένα σταθερό, ταξινομημένο κλειδί για ένα ζευγάρι MMSI.
     * Εξασφαλίζει ότι το κλειδί για (A, B) είναι ίδιο με το κλειδί για (B, A).
     * @param mmsi1 Το MMSI του πρώτου πλοίου.
     * @param mmsi2 Το MMSI του δεύτερου πλοίου.
     * @return Το ταξινομημένο κλειδί.
     */
    private String createCollisionPairKey(String mmsi1, String mmsi2) {
        return mmsi1.compareTo(mmsi2) < 0 ? mmsi1 + "-" + mmsi2 : mmsi2 + "-" + mmsi1;
    }

    /**
     * Ελέγχει αν μια θέση είναι μέσα σε μια ζώνη σύγκρουσης.
     * (Ίδια λογική με την isInsideZone, αλλά για διαφορετικό τύπο αντικειμένου).
     * @param data Τα δεδομένα θέσης του πλοίου.
     * @param zone Η ζώνη σύγκρουσης.
     * @return true αν το πλοίο είναι μέσα στη ζώνη.
     */
    private boolean isInsideCollisionZone(AisData data, CollisionZone zone) {
        if (data.getLatitude() == null || data.getLongitude() == null) return false;
        final int R = 6371 * 1000;  // Ακτίνα της Γης σε μέτρα

        double dLat = Math.toRadians(data.getLatitude() - zone.getCenterLatitude());
        double dLon = Math.toRadians(data.getLongitude() - zone.getCenterLongitude());

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(zone.getCenterLatitude())) * Math.cos(Math.toRadians(data.getLatitude())) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return (R * c) <= zone.getRadiusInMeters();
    }

    /**
     * Στέλνει μια ειδοποίηση επικείμενης σύγκρουσης στον χρήστη.
     * @param message Το μήνυμα της ειδοποίησης.
     * @param zone Η ζώνη όπου εντοπίστηκε ο κίνδυνος.
     * @param shipA Το πρώτο εμπλεκόμενο πλοίο.
     * @param shipB Το δεύτερο εμπλεκόμενο πλοίο.
     */
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