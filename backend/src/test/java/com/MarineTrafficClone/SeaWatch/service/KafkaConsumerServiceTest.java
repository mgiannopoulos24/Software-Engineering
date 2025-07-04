package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.RealTimeShipUpdateDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests για τον KafkaConsumerService.
 * Ελέγχει τη λογική επεξεργασίας ενός μηνύματος AIS, χωρίς να χρειάζεται πραγματικό Kafka.
 */
@ExtendWith(MockitoExtension.class)
class KafkaConsumerServiceTest {

    @Mock
    private AisDataRepository aisDataRepository;
    @Mock
    private ShipRepository shipRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private ShipPositionCacheService positionCache;
    @Mock
    private ZoneOfInterestCacheService zoneCache;
    @Mock
    private CollisionZoneCacheService collisionZoneCache;
    @Mock
    private UserEntityRepository userEntityRepository;

    // Θα χρησιμοποιήσουμε έναν πραγματικό ObjectMapper, όπως και στο service.
    private ObjectMapper objectMapper;

    // Η κλάση υπό δοκιμή (System Under Test). Δεν χρησιμοποιούμε πλέον @InjectMocks.
    private KafkaConsumerService kafkaConsumerService;

    private AisData testAisData;
    private Ship testShip;

    @BeforeEach
    void setUp() {
        // Αρχικοποιούμε τον πραγματικό ObjectMapper
        objectMapper = new ObjectMapper();

        // Αρχικοποιούμε το service χειροκίνητα, περνώντας όλα τα mocks
        // και τον πραγματικό objectMapper, όπως ακριβώς θα έκανε το Spring.
        kafkaConsumerService = new KafkaConsumerService(
                aisDataRepository,
                shipRepository,
                objectMapper, // Περνάμε την πραγματική instance
                userEntityRepository,
                messagingTemplate,
                zoneCache,
                collisionZoneCache,
                positionCache
        );

        // Αρχικοποίηση των test data
        testAisData = new AisData();
        testAisData.setMmsi("123456789");
        testAisData.setLatitude(35.12);
        testAisData.setLongitude(25.34);
        testAisData.setSpeedOverGround(12.5);
        testAisData.setCourseOverGround(90.0);
        testAisData.setTimestampEpoch(System.currentTimeMillis() / 1000);

        testShip = new Ship(1L, 123456789L, ShipType.CARGO);
    }

    @Test
    void consumeAisData_shouldProcessMessageAndSendUpdates() throws Exception {
        // 1. Ρύθμιση (Arrange)
        // Προετοιμασία των mocks
        when(shipRepository.findByMmsi(123456789L)).thenReturn(Optional.of(testShip));
        when(userEntityRepository.findUsersWatchingMmsi(anyLong())).thenReturn(Collections.emptyList());
        when(zoneCache.getAllActiveZones()).thenReturn(Collections.emptyList());
        when(collisionZoneCache.getAllActiveZones()).thenReturn(Collections.emptyList());

        // Μετατροπή του αντικειμένου σε JSON string, όπως θα ερχόταν από το Kafka.
        // Χρησιμοποιούμε τον objectMapper που αρχικοποιήθηκε στο setUp.
        String messageJson = objectMapper.writeValueAsString(testAisData);

        // 2. Δράση (Act)
        // Καλούμε τη μέθοδο του service που θέλουμε να δοκιμάσουμε.
        kafkaConsumerService.consumeAisData(messageJson);

        // 3. Επιβεβαίωση (Assert)
        // Ελέγχουμε ότι οι βασικές λειτουργίες εκτελέστηκαν.
        // - Το νέο στίγμα αποθηκεύτηκε στη βάση.
        verify(aisDataRepository, times(1)).save(any(AisData.class));
        // - Η cache θέσεων ενημερώθηκε.
        verify(positionCache, times(1)).updatePosition(any(AisData.class));
        // - Στάλθηκε ένα public update στο WebSocket.
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/ais-updates"), any(RealTimeShipUpdateDTO.class));
        // - Δεν στάλθηκε private update, αφού κανείς δεν παρακολουθεί το πλοίο.
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), eq("/queue/fleet-updates"), any(Object.class));
    }
}