package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.TrackPointDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests για τον ShipDataService.
 * Ελέγχει τη λογική συνδυασμού στατικών και δυναμικών δεδομένων.
 */
@ExtendWith(MockitoExtension.class)
class ShipDataServiceTest {

    @Mock
    private AisDataRepository aisDataRepository;
    @Mock
    private ShipRepository shipRepository;

    @InjectMocks
    private ShipDataService shipDataService;

    private Ship testShip;
    private AisData latestAisData;

    @BeforeEach
    void setup() {
        testShip = new Ship(1L, 12345L, ShipType.TANKER);
        latestAisData = AisData.builder()
                .mmsi("12345")
                .latitude(35.0)
                .longitude(25.0)
                .speedOverGround(15.0)
                .timestampEpoch(System.currentTimeMillis() / 1000L)
                .build();
    }

    @Test
    void getShipDetails_whenShipExists_shouldReturnCombinedDetails() {
        // Arrange
        when(shipRepository.findByMmsi(12345L)).thenReturn(Optional.of(testShip));
        when(aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc("12345")).thenReturn(Optional.of(latestAisData));

        // Act
        ShipDetailsDTO result = shipDataService.getShipDetails(12345L);

        // Assert
        assertThat(result).isNotNull();
        assertEquals(12345L, result.getMmsi());
        assertEquals(ShipType.TANKER, result.getShiptype());
        assertEquals(15.0, result.getSpeedOverGround());
        assertEquals(35.0, result.getLatitude());
    }

    @Test
    void getShipDetails_whenShipNotFound_shouldThrowException() {
        // Arrange
        when(shipRepository.findByMmsi(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            shipDataService.getShipDetails(999L);
        });
    }

    @Test
    void getShipTrack_shouldReturnTrackPoints() {
        // Arrange
        long now = System.currentTimeMillis() / 1000L;
        AisData point1 = AisData.builder().mmsi("12345").latitude(35.1).longitude(25.1).timestampEpoch(now - 3600).build();
        AisData point2 = AisData.builder().mmsi("12345").latitude(35.2).longitude(25.2).timestampEpoch(now).build();

        when(aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc("12345")).thenReturn(Optional.of(point2));
        when(aisDataRepository.findByMmsiAndTimestampEpochAfterOrderByTimestampEpochAsc(anyString(), anyLong()))
                .thenReturn(List.of(point1, point2));

        // Act
        List<TrackPointDTO> track = shipDataService.getShipTrack("12345");

        // Assert
        assertThat(track).hasSize(2);
        assertThat(track.get(0).getLatitude()).isEqualTo(35.1);
        assertThat(track.get(1).getTimestampEpoch()).isEqualTo(now);
    }

    /**
     * Test για τη μέθοδο getAllActiveShipsDetails.
     * Σενάριο: Έχουμε τρία πλοία στα στατικά δεδομένα. Τα δύο από αυτά έχουν και
     * δυναμικά δεδομένα (AIS), ενώ το τρίτο όχι.
     * Αναμένουμε: Η μέθοδος να επιστρέψει μια λίστα με δύο πλοία (αυτά που έχουν θέση),
     * συνδυάζοντας σωστά τα στατικά και δυναμικά τους στοιχεία.
     */
    @Test
    void getAllActiveShipsDetails_shouldReturnCombinedDataForActiveShips() {
        // --- ARRANGE ---
        // 1. Δημιουργία των στατικών δεδομένων (οντότητες Ship)
        Ship ship1_static = new Ship(1L, 111L, ShipType.CARGO);
        Ship ship2_static = new Ship(2L, 222L, ShipType.PASSENGER);
        Ship ship3_static_no_dynamic_data = new Ship(3L, 333L, ShipType.FISHING); // Αυτό δεν θα έχει AIS data

        // 2. Δημιουργία των τελευταίων δυναμικών δεδομένων (οντότητες AisData) μόνο για τα δύο πρώτα πλοία
        AisData ship1_dynamic = AisData.builder().mmsi("111").latitude(10.0).longitude(10.0).build();
        AisData ship2_dynamic = AisData.builder().mmsi("222").latitude(20.0).longitude(20.0).build();

        // 3. Mocking των repository methods
        // Το findAll() επιστρέφει και τα τρία πλοία
        when(shipRepository.findAll()).thenReturn(List.of(ship1_static, ship2_static, ship3_static_no_dynamic_data));

        // Το findLatestAisDataForMmsiList επιστρέφει δυναμικά δεδομένα μόνο για τα δύο πρώτα
        List<String> expectedMmsiList = List.of("111", "222", "333");
        when(aisDataRepository.findLatestAisDataForMmsiList(eq(expectedMmsiList)))
                .thenReturn(List.of(ship1_dynamic, ship2_dynamic));

        // --- ACT ---
        List<ShipDetailsDTO> result = shipDataService.getAllActiveShipsDetails();

        // --- ASSERT ---
        // 1. Το αποτέλεσμα πρέπει να περιέχει 2 πλοία, αφού το τρίτο φιλτραρίστηκε (δεν είχε θέση)
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);

        // 2. Μετατρέπουμε τη λίστα σε map για ευκολότερο έλεγχο
        var resultMap = result.stream().collect(Collectors.toMap(ShipDetailsDTO::getMmsi, dto -> dto));

        // 3. Έλεγχος των στοιχείων του πρώτου πλοίου
        ShipDetailsDTO dto1 = resultMap.get(111L);
        assertThat(dto1).isNotNull();
        assertThat(dto1.getShiptype()).isEqualTo(ShipType.CARGO);
        assertThat(dto1.getLatitude()).isEqualTo(10.0);
        assertThat(dto1.getLongitude()).isEqualTo(10.0);

        // 4. Έλεγχος των στοιχείων του δεύτερου πλοίου
        ShipDetailsDTO dto2 = resultMap.get(222L);
        assertThat(dto2).isNotNull();
        assertThat(dto2.getShiptype()).isEqualTo(ShipType.PASSENGER);
        assertThat(dto2.getLatitude()).isEqualTo(20.0);

        // 5. Επιβεβαίωση ότι το τρίτο πλοίο δεν υπάρχει στο αποτέλεσμα
        assertThat(resultMap.containsKey(333L)).isFalse();
    }
}