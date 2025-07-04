package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests για τον StatisticsService.
 * Ελέγχει ότι τα στατιστικά υπολογίζονται σωστά βάσει των δεδομένων από τις caches.
 */
@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private ShipPositionCacheService positionCache;
    @Mock
    private ZoneOfInterestCacheService interestZoneCache;
    @Mock
    private CollisionZoneCacheService collisionZoneCache;

    @InjectMocks
    private StatisticsService statisticsService;

    @Test
    void getActiveAndStoppedShipCount_shouldReturnCorrectCounts() {
        // Arrange
        AisData movingShip = AisData.builder().speedOverGround(10.5).build();
        AisData stoppedShip1 = AisData.builder().speedOverGround(0.5).build();
        AisData stoppedShip2 = AisData.builder().speedOverGround(1.0).build();

        when(positionCache.getAllLatestPositions()).thenReturn(List.of(movingShip, stoppedShip1, stoppedShip2));

        // Act
        long activeCount = statisticsService.getActiveShipCount();
        long stoppedCount = statisticsService.getStoppedShipCount();

        // Assert
        assertThat(activeCount).isEqualTo(3);
        assertThat(stoppedCount).isEqualTo(2);
    }

    @Test
    void getZoneCounts_shouldReturnCorrectCounts() {
        // Arrange
        when(interestZoneCache.getAllActiveZones()).thenReturn(List.of(new ZoneOfInterest(), new ZoneOfInterest()));
        when(collisionZoneCache.getAllActiveZones()).thenReturn(List.of(new CollisionZone()));

        // Act
        int interestCount = statisticsService.getInterestZoneCount();
        int collisionCount = statisticsService.getCollisionZoneCount();

        // Assert
        assertThat(interestCount).isEqualTo(2);
        assertThat(collisionCount).isEqualTo(1);
    }
}