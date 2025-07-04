package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

/**
 * Αφηρημένη κλάση βάσης για όλα τα INTEGRATION tests που απαιτούν πλήρες Spring Context.
 * Παρέχει ένα συνεπές περιβάλλον δοκιμών:
 * - @SpringBootTest: Σηκώνει ένα πλήρες application context σε τυχαία πόρτα.
 * - @EmbeddedKafka: Παρέχει έναν in-memory Kafka broker.
 * - @DirtiesContext: Εξασφαλίζει ότι το context "μολύνεται" και θα ξαναδημιουργηθεί,
 *   αλλά με το EXHAUSTIVE, θα προσπαθήσει να το κρατήσει όσο περισσότερο μπορεί.
 * - @MockBean: Κάνει mock τα services που φορτώνουν δεδομένα κατά την εκκίνηση.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EmbeddedKafka(partitions = 1, topics = { "ais-data-stream" })
// Αυτή η ρύθμιση λέει στο Spring να προσπαθήσει να επαναχρησιμοποιήσει το context όσο μπορεί.
// Θα το κλείσει μόνο στο τέλος ολόκληρου του test suite.
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS, hierarchyMode = DirtiesContext.HierarchyMode.EXHAUSTIVE)
public abstract class AbstractTest {

    // Κάνοντας mock αυτά τα beans, εμποδίζουμε την εκτέλεσή τους κατά την έναρξη του test context.
    // Αυτό είναι κρίσιμο για την ταχύτητα και την απομόνωση των tests.
    @MockBean
    protected StaticShipDataLoaderService staticShipDataLoaderService;

    @MockBean
    protected CsvDataLoaderService csvDataLoaderService;
}