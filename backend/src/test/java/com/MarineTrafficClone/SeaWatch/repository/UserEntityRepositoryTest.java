package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.AbstractTest;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test για το UserEntityRepository.
 * Κληρονομεί από το AbstractTest για να τρέξει με πλήρες Spring context.
 * Το @Transactional εξασφαλίζει ότι κάθε test τρέχει σε "καθαρή" βάση.
 */
@Transactional
class UserEntityRepositoryTest extends AbstractTest {

    @Autowired
    private UserEntityRepository userEntityRepository;

    @Autowired
    private ShipRepository shipRepository;

    @BeforeEach
    void setUp() {
        // Καθαρίζουμε τους πίνακες με τη σωστή σειρά για να αποφύγουμε foreign key constraint violations.
        userEntityRepository.deleteAll();
        shipRepository.deleteAll();

        // Δημιουργία και αποθήκευση ενός πλοίου πρώτα
        Ship watchedShip = shipRepository.save(Ship.builder().mmsi(111L).shiptype(ShipType.TUG).build());

        // Δημιουργία ενός χρήστη που παρακολουθεί το πλοίο
        UserEntity testUser = UserEntity.builder()
                .email("test@example.com")
                .password("pass")
                .role(RoleType.REGISTERED)
                .build();
        testUser.addShipToFleet(watchedShip);

        // Δημιουργία ενός admin χρήστη
        UserEntity adminUser = UserEntity.builder().email("admin@example.com").password("admin").role(RoleType.ADMIN).build();

        // Αποθήκευση των χρηστών
        userEntityRepository.saveAll(List.of(testUser, adminUser));
    }

    @Test
    void findByEmail_whenUserExists_shouldReturnUser() {
        // Act
        Optional<UserEntity> found = userEntityRepository.findByEmail("test@example.com");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getRole()).isEqualTo(RoleType.REGISTERED);
    }

    @Test
    void findUsersWatchingMmsi_shouldReturnCorrectUser() {
        // Act
        List<UserEntity> watchers = userEntityRepository.findUsersWatchingMmsi(111L);

        // Assert
        assertThat(watchers).hasSize(1);
        assertThat(watchers.get(0).getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void findUsersWatchingMmsi_forUnwatchedShip_shouldReturnEmptyList() {
        // Act
        List<UserEntity> watchers = userEntityRepository.findUsersWatchingMmsi(999L);

        // Assert
        assertThat(watchers).isEmpty();
    }
}