package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test για το UserEntityRepository.
 */
@DataJpaTest
class UserEntityRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserEntityRepository userEntityRepository;

    private UserEntity testUser;
    private Ship watchedShip;

    @BeforeEach
    void setUp() {
        // Δημιουργία και αποθήκευση ενός πλοίου
        watchedShip = Ship.builder().mmsi(111L).build();
        entityManager.persist(watchedShip);

        // Δημιουργία ενός χρήστη που παρακολουθεί το πλοίο
        testUser = UserEntity.builder()
                .email("test@example.com")
                .password("pass")
                .role(RoleType.REGISTERED)
                .build();
        testUser.addShipToFleet(watchedShip);
        entityManager.persist(testUser);

        // Δημιουργία ενός admin χρήστη
        UserEntity adminUser = UserEntity.builder().email("admin@example.com").password("admin").role(RoleType.ADMIN).build();
        entityManager.persist(adminUser);

        entityManager.flush();
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