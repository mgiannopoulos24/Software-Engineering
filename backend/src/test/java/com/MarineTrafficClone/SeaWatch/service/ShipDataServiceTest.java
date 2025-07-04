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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
}