package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Service που περιέχει μια προγραμματισμένη εργασία (scheduled task)
 * για τον περιοδικό καθαρισμό παλαιών δεδομένων AIS από τη βάση δεδομένων.
 * Αυτό είναι απαραίτητο για να μην αυξάνεται το μέγεθος της βάσης απεριόριστα
 * και να διατηρείται η απόδοση του συστήματος.
 */
@Service
public class DatabaseCleanupService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseCleanupService.class);

    private final AisDataRepository aisDataRepository;

    @Autowired
    public DatabaseCleanupService(AisDataRepository aisDataRepository) {
        this.aisDataRepository = aisDataRepository;
    }

    /**
     * Προγραμματισμένη εργασία που καθαρίζει τα παλιά δεδομένα AIS.
     * Το `@Scheduled(cron = "0 0 * * * *")` σημαίνει ότι η μέθοδος θα εκτελείται
     * στην αρχή κάθε ώρας (π.χ., 10:00:00, 11:00:00, κ.λπ.).
     */
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupOldAisData() {
        log.info("Scheduled Cleanup Task: Starting cleanup of old AIS data...");

        // 1. Βρες την πιο πρόσφατη "ώρα προσομοίωσης" από τη βάση.
        Optional<Long> latestTimestampOptional = aisDataRepository.findLatestTimestampEpoch();

        if (latestTimestampOptional.isEmpty()) {
            // Αν δεν υπάρχουν καθόλου δεδομένα, δεν χρειάζεται να κάνουμε τίποτα.
            log.info("Scheduled Cleanup Task: No data found in the database. Skipping cleanup.");
            return;
        }

        long latestTimestamp = latestTimestampOptional.get();

        // 2. Υπολόγισε το όριο διαγραφής (cutoff timestamp).
        // Το όριο είναι 12 ώρες πριν από το πιο πρόσφατο δεδομένο που έχουμε.
        // Αυτό διασφαλίζει ότι πάντα θα έχουμε δεδομένα για τις τελευταίες 12 ώρες
        // που απαιτούνται για την εμφάνιση της πορείας (track).
        long cutoffTimestamp = latestTimestamp - Duration.ofHours(12).toSeconds();

        try {
            log.info("Scheduled Cleanup Task: Latest data timestamp is {}. Deleting data older than {}.", latestTimestamp, cutoffTimestamp);
            // 3. Κάλεσε τη μέθοδο του repository για να διαγράψει τις παλιές εγγραφές.
            aisDataRepository.deleteByTimestampEpochBefore(cutoffTimestamp);
            log.info("Scheduled Cleanup Task: Cleanup finished successfully.");
        } catch (Exception e) {
            log.error("Scheduled Cleanup Task: An error occurred during database cleanup.", e);
        }
    }
}