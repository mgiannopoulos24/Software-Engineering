package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.AbstractTest;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test για το AisDataRepository.
 * Κληρονομεί από το AbstractTest για να τρέξει με πλήρες Spring context.
 * Το @Transactional εξασφαλίζει ότι κάθε test τρέχει σε "καθαρή" βάση, κάνοντας rollback στο τέλος.
 */
@Transactional
// Παρέχει ένα mock secret key για το JWT Service, απαραίτητο για να μπορέσει
// να ξεκινήσει το test context, καθώς το AbstractTest χρησιμοποιεί @SpringBootTest.
@TestPropertySource(properties = { "jwt.secret-key=dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0" })
class AisDataRepositoryTest extends AbstractTest {

    @Autowired
    private AisDataRepository aisDataRepository;

    @BeforeEach
    void setUp() {
        // Καθαρίζουμε τον πίνακα πριν από κάθε test για πλήρη απομόνωση.
        aisDataRepository.deleteAll();

        AisData ship1_t1 = AisData.builder().mmsi("111").timestampEpoch(100L).latitude(10.0).longitude(10.0).build();
        AisData ship1_t2 = AisData.builder().mmsi("111").timestampEpoch(200L).latitude(11.0).longitude(11.0).build();
        AisData ship2_t1 = AisData.builder().mmsi("222").timestampEpoch(150L).latitude(20.0).longitude(20.0).build();

        // Χρησιμοποιούμε το repository για την προετοιμασία των δεδομένων.
        aisDataRepository.saveAll(List.of(ship1_t1, ship1_t2, ship2_t1));
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