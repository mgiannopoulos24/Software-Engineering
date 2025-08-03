package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.AbstractTest;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test για το ShipRepository.
 * Κληρονομεί από το AbstractTest για να τρέξει με πλήρες Spring context.
 * Το @Transactional εξασφαλίζει ότι κάθε test τρέχει σε "καθαρή" βάση.
 */
@Transactional
// Παρέχει ένα mock secret key για το JWT Service, απαραίτητο για να μπορέσει
// να ξεκινήσει το test context, καθώς το AbstractTest χρησιμοποιεί @SpringBootTest.
@TestPropertySource(properties = { "jwt.secret-key=dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0" })
class ShipRepositoryTest extends AbstractTest {

    @Autowired
    private ShipRepository shipRepository;

    @BeforeEach
    void setUp() {
        shipRepository.deleteAll();
        Ship ship1 = Ship.builder().mmsi(123456789L).shiptype(ShipType.CARGO).build();
        shipRepository.save(ship1);
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