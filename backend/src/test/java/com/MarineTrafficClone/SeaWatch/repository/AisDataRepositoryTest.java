package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test για το AisDataRepository.
 * Το @DataJpaTest ρυθμίζει μια in-memory βάση και φορτώνει ΜΟΝΟ τα JPA components.
 * ΔΕΝ φορτώνει services, controllers, ή άλλες διαμορφώσεις.
 * Δεν χρειάζεται να κληρονομεί από AbstractTest γιατί δεν φορτώνει CommandLineRunners.
 */
@DataJpaTest
class AisDataRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AisDataRepository aisDataRepository;

    private AisData ship1_t1, ship1_t2, ship2_t1;

    @BeforeEach
    void setUp() {
        ship1_t1 = AisData.builder().mmsi("111").timestampEpoch(100L).latitude(10.0).longitude(10.0).build();
        ship1_t2 = AisData.builder().mmsi("111").timestampEpoch(200L).latitude(11.0).longitude(11.0).build();
        ship2_t1 = AisData.builder().mmsi("222").timestampEpoch(150L).latitude(20.0).longitude(20.0).build();

        entityManager.persist(ship1_t1);
        entityManager.persist(ship1_t2);
        entityManager.persist(ship2_t1);
        entityManager.flush();
    }

    @Test
    void findTopByMmsiOrderByTimestampEpochDesc_shouldReturnLatestRecord() {
        Optional<AisData> found = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc("111");
        assertThat(found).isPresent();
        assertThat(found.get().getTimestampEpoch()).isEqualTo(200L);
    }

    @Test
    void findByMmsiAndTimestampEpochAfter_shouldReturnSortedRecords() {
        List<AisData> foundList = aisDataRepository.findByMmsiAndTimestampEpochAfterOrderByTimestampEpochAsc("111", 50L);
        assertThat(foundList).hasSize(2);
        assertThat(foundList.get(0).getTimestampEpoch()).isEqualTo(100L);
        assertThat(foundList.get(1).getTimestampEpoch()).isEqualTo(200L);
    }

    @Test
    void findLatestAisDataForMmsiList_shouldReturnLatestForEachMmsi() {
        List<AisData> latestRecords = aisDataRepository.findLatestAisDataForMmsiList(List.of("111", "222"));
        assertThat(latestRecords).hasSize(2);
        assertThat(latestRecords).filteredOn(a -> a.getMmsi().equals("111"))
                .extracting(AisData::getTimestampEpoch)
                .containsExactly(200L);
        assertThat(latestRecords).filteredOn(a -> a.getMmsi().equals("222"))
                .extracting(AisData::getTimestampEpoch)
                .containsExactly(150L);
    }
}