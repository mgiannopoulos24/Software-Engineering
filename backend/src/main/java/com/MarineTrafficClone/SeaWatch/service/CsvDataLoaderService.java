package com.MarineTrafficClone.SeaWatch.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy; // Για τον τερματισμό του executor
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.TimeUnit;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;

/**
 * Service που υλοποιεί την {@link CommandLineRunner} για να ξεκινήσει αυτόματα
 * κατά την εκκίνηση της εφαρμογής. Ο σκοπός του είναι να διαβάσει το παρεχόμενο
 * ιστορικό αρχείο CSV με δεδομένα AIS και να τα αναπαράγει (replay) σε πραγματικό χρόνο
 * (ή με επιταχυνόμενο ρυθμό), στέλνοντάς τα σε ένα Kafka topic.
 * Αυτό προσομοιώνει μια ζωντανή ροή δεδομένων AIS.
 * Το @Order(2) εξασφαλίζει ότι αυτό το service θα εκτελεστεί ΜΕΤΑ το StaticShipDataLoaderService (@Order(1)).
 */
@Service
@Order(2)
public class CsvDataLoaderService implements CommandLineRunner {

    private final KafkaProducerService kafkaProducerService;
    private final ObjectMapper objectMapper;
    private final SimulationControlService simulationControlService;

    // Χρησιμοποιούμε έναν ExecutorService με ένα μόνο thread για να τρέξει η προσομοίωση ασύγχρονα στο background.
    private final ExecutorService simulationExecutor = Executors.newSingleThreadExecutor();
    // Volatile boolean για να σηματοδοτήσουμε με ασφάλεια τον τερματισμό του thread από άλλο thread.
    private volatile boolean shutdownSignal = false;

    private static final Logger log = LoggerFactory.getLogger(CsvDataLoaderService.class);

    @Autowired
    public CsvDataLoaderService(KafkaProducerService kafkaProducerService, ObjectMapper objectMapper, SimulationControlService simulationControlService) {
        this.kafkaProducerService = kafkaProducerService;
        this.objectMapper = objectMapper;
        this.simulationControlService = simulationControlService;
    }

    /**
     * Η μέθοδος run() καλείται αυτόματα από το Spring Boot κατά την εκκίνηση.
     * Υποβάλλει την εργασία της προσομοίωσης στον executor για να ξεκινήσει.
     */
    @Override
    public void run(String... args) {
        System.out.println("SIMULATION: Submitting CSV processing task to executor.");
        simulationExecutor.submit(this::simulateRealTimeDataFlowFromSortedCsv);
    }

    /**
     * Η μέθοδος αυτή καλείται αυτόματα όταν η εφαρμογή τερματίζεται.
     * Εξασφαλίζει τον ομαλό τερματισμό του thread της προσομοίωσης.
     */
    @PreDestroy
    public void stopSimulation() {
        System.out.println("SIMULATION: Shutdown signal received. Attempting to stop simulation executor.");
        shutdownSignal = true; // Σηματοδοτούμε στο loop να σταματήσει.
        simulationExecutor.shutdown(); // Ξεκινάει τη διαδικασία τερματισμού.
        try {
            // Περιμένουμε για 30 δευτερόλεπτα να τερματίσει.
            if (!simulationExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                System.err.println("SIMULATION: Simulation executor did not terminate in 30s. Forcing shutdown.");
                simulationExecutor.shutdownNow(); // Αν δεν τερματίσει, τον αναγκάζουμε.
            } else {
                System.out.println("SIMULATION: Simulation executor shut down gracefully.");
            }
        } catch (InterruptedException e) {
            System.err.println("SIMULATION: Interrupted while waiting for executor termination.");
            simulationExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Η κύρια λογική της προσομοίωσης. Διαβάζει το CSV γραμμή-γραμμή,
     * υπολογίζει την καθυστέρηση μεταξύ των εγγραφών και στέλνει τα δεδομένα στο Kafka.
     */
    @SuppressWarnings("BusyWait") // Επιτρέπουμε το Thread.sleep() που είναι σκόπιμο εδώ.
    private void simulateRealTimeDataFlowFromSortedCsv() {
        String filePath = "AIS-Data/nari_dynamic.csv";
        System.out.println("SIMULATION: Thread started. Processing CSV: " + filePath);
        System.out.println("SIMULATION: Initial speed factor: " + simulationControlService.getSpeedFactor());

        long previousRecordEpoch = -1; // Η χρονοσφραγίδα της προηγούμενης εγγραφής.
        AtomicLong recordsSentCounter = new AtomicLong(0);

        try (InputStream is = new ClassPathResource(filePath).getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {

            String line;
            boolean headerSkipped = false;

            // Διαβάζουμε το αρχείο γραμμή-γραμμή μέχρι το τέλος ή μέχρι να λάβουμε σήμα τερματισμού.
            while ((line = reader.readLine()) != null && !shutdownSignal) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue; // Παρακάμπτουμε τη γραμμή-κεφαλίδα (header).
                }
                if (line.trim().isEmpty()) {
                    continue; // Παρακάμπτουμε κενές γραμμές.
                }

                double currentSpeedFactor = simulationControlService.getSpeedFactor();

                String[] values = line.split(",");
                if (values.length == 9) {
                    try {
                        // Δημιουργία του αντικειμένου AisData από τις τιμές του CSV.
                        AisData currentRecord = new AisData();
                        currentRecord.setMmsi(values[0].trim());
                        currentRecord.setNavigationalStatus(Integer.parseInt(values[1].trim()));
                        currentRecord.setRateOfTurn(parseDoubleOrNull(values[2].trim()));
                        currentRecord.setSpeedOverGround(Double.parseDouble(values[3].trim()));
                        currentRecord.setCourseOverGround(Double.parseDouble(values[4].trim()));
                        currentRecord.setTrueHeading(parseTrueHeading(values[5].trim()));
                        currentRecord.setLongitude(Double.parseDouble(values[6].trim()));
                        currentRecord.setLatitude(Double.parseDouble(values[7].trim()));
                        currentRecord.setTimestampEpoch(Long.parseLong(values[8].trim()));

                        if (previousRecordEpoch != -1) {
                            // Υπολογίζουμε τη χρονική διαφορά (σε δευτερόλεπτα) από την προηγούμενη εγγραφή.
                            long timestampDiffSeconds = currentRecord.getTimestampEpoch() - previousRecordEpoch;
                            if (timestampDiffSeconds < 0) {
                                // Το αρχείο πρέπει να είναι ταξινομημένο. Αν όχι, στέλνουμε το μήνυμα αμέσως.
                                log.warn("SIMULATION: Timestamp out of order. Current: {}, Previous: {}. Sending with minimal delay.",
                                        currentRecord.getTimestampEpoch(), previousRecordEpoch);
                                timestampDiffSeconds = 0;
                            }
                            // Υπολογίζουμε την καθυστέρηση σε milliseconds, λαμβάνοντας υπόψη τον παράγοντα επιτάχυνσης.
                            long delayMillis = (long) ((timestampDiffSeconds * 1000) / currentSpeedFactor);
                            if (delayMillis > 0) {
                                Thread.sleep(delayMillis);
                            }
                        }
                        previousRecordEpoch = currentRecord.getTimestampEpoch(); // Ενημερώνουμε για την επόμενη επανάληψη.

                        if (shutdownSignal) break; // Ελέγχουμε ξανά μετά την πιθανή καθυστέρηση.

                        // Μετατρέπουμε το αντικείμενο σε JSON και το στέλνουμε στο Kafka.
                        String aisDataJson = objectMapper.writeValueAsString(currentRecord);
                        kafkaProducerService.sendAisDataAsJson(currentRecord.getMmsi(), aisDataJson);
                        long count = recordsSentCounter.incrementAndGet();

                        if (count % 100 == 0) { // Καταγραφή της προόδου κάθε 100 εγγραφές.
                            log.info("SIMULATION: Sent record #{} (MMSI: {})", count, currentRecord.getMmsi());
                        }

                    } catch (InterruptedException e) {
                        log.warn("SIMULATION: Thread interrupted. Stopping simulation.");
                        Thread.currentThread().interrupt();
                        break;
                    } catch (Exception e) {
                        log.error("SIMULATION: Error processing line or sending to Kafka: {}", line, e);
                    }
                } else {
                    log.error("SIMULATION: Malformed CSV line (expected 9 columns): {}", line);
                }
            }
        } catch (Exception e) {
            if (!shutdownSignal) {
                log.error("SIMULATION: Critical error reading CSV file '{}'", filePath, e);
            }
        } finally {
            if (shutdownSignal) {
                System.out.println("SIMULATION: Processing loop interrupted by shutdown signal.");
            }
            System.out.println("SIMULATION: Finished processing CSV. Total messages sent: " + recordsSentCounter.get() + ".");
        }
    }

    // Βοηθητική μέθοδος για την ανάλυση (parsing) ενός Double, επιστρέφοντας null αν αποτύχει.
    private Double parseDoubleOrNull(String value) {
        if (value == null || value.trim().isEmpty() || value.equalsIgnoreCase("NA")) {
            return null;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            log.warn("SIMULATION: Could not parse Double: '{}'", value);
            return null;
        }
    }

    // Βοηθητική μέθοδος για την ανάλυση του TrueHeading, επιστρέφοντας 511 (not available) αν αποτύχει.
    private Integer parseTrueHeading(String value) {
        final int UNAVAILABLE_HEADING = 511;
        if (value == null || value.trim().isEmpty() || value.equalsIgnoreCase("NA")) {
            return UNAVAILABLE_HEADING;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.warn("SIMULATION: Could not parse TrueHeading: '{}', using default: {}", value, UNAVAILABLE_HEADING);
            return UNAVAILABLE_HEADING;
        }
    }
}