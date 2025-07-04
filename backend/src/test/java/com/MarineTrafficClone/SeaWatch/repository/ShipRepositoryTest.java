package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test για το ShipRepository.
 * Χρησιμοποιεί H2 in-memory database.
 */
@DataJpaTest
class ShipRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ShipRepository shipRepository;

    @BeforeEach
    void setUp() {
        Ship ship1 = Ship.builder().mmsi(123456789L).shiptype(ShipType.CARGO).build();
        entityManager.persist(ship1);
        entityManager.flush();
    }

    @Test
    void findByMmsi_whenShipExists_shouldReturnShip() {
        // Act
        Optional<Ship> found = shipRepository.findByMmsi(123456789L);

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getShiptype()).isEqualTo(ShipType.CARGO);
    }

    @Test
    void findByMmsi_whenShipDoesNotExist_shouldReturnEmpty() {
        // Act
        Optional<Ship> found = shipRepository.findByMmsi(999L);

        // Assert
        assertThat(found).isNotPresent();
    }
}