package com.MarineTrafficClone.SeaWatch.service; // Your package

import com.fasterxml.jackson.databind.ObjectMapper;
import com.MarineTrafficClone.SeaWatch.model.AisData; // Your model
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy; // For shutting down the executor
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



@Service
@Order(2)
public class CsvDataLoaderService implements CommandLineRunner {

    private final KafkaProducerService kafkaProducerService;
    private final ObjectMapper objectMapper;

    @Value("${simulation.speed.factor:1.0}")
    private double simulationSpeedFactor;

    // Use a single-thread executor to run the simulation task
    private final ExecutorService simulationExecutor = Executors.newSingleThreadExecutor();
    private volatile boolean shutdownSignal = false; // To signal shutdown

    @Autowired
    public CsvDataLoaderService(KafkaProducerService kafkaProducerService, ObjectMapper objectMapper) {
        this.kafkaProducerService = kafkaProducerService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("SIMULATION (Rate-Limited Stream): Submitting CSV processing task.");
        simulationExecutor.submit(this::simulateRealTimeDataFlowFromSortedCsv);
    }

    @PreDestroy // Called when the application is shutting down
    public void stopSimulation() {
        System.out.println("SIMULATION (Rate-Limited Stream): Shutdown signal received. Attempting to stop simulation executor.");
        shutdownSignal = true;
        simulationExecutor.shutdown();
        try {
            if (!simulationExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                System.err.println("SIMULATION (Rate-Limited Stream): Simulation executor did not terminate in 30s.");
                simulationExecutor.shutdownNow();
            } else {
                System.out.println("SIMULATION (Rate-Limited Stream): Simulation executor shut down gracefully.");
            }
        } catch (InterruptedException e) {
            System.err.println("SIMULATION (Rate-Limited Stream): Interrupted while waiting for executor termination.");
            simulationExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private void simulateRealTimeDataFlowFromSortedCsv() {
        String filePath = "AIS-Data/nari_dynamic.csv";
        System.out.println("SIMULATION (Rate-Limited Stream): Thread started. Processing CSV: " + filePath);
        System.out.println("SIMULATION (Rate-Limited Stream): Speed factor: " + simulationSpeedFactor);

        long previousRecordEpoch = -1; // Initialize to indicate no previous record yet
        AtomicLong recordsSentCounter = new AtomicLong(0);
        AtomicLong linesReadCounter = new AtomicLong(0);
        long simulationWallClockStartTime = System.currentTimeMillis();

        try (InputStream is = new ClassPathResource(filePath).getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {

            String line;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null && !shutdownSignal) { // Check shutdown signal
                linesReadCounter.incrementAndGet();
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }
                if (line.trim().isEmpty()) {
                    continue;
                }

                String[] values = line.split(",");
                if (values.length == 9) {
                    try {
                        AisData currentRecord = new AisData();
                        currentRecord.setMmsi(values[0].trim());
                        currentRecord.setNavigationalStatus(Integer.parseInt(values[1].trim()));
                        currentRecord.setRateOfTurn(parseDoubleOrNull(values[2].trim()));
                        currentRecord.setSpeedOverGround(Double.parseDouble(values[3].trim()));
                        currentRecord.setCourseOverGround(Double.parseDouble(values[4].trim()));
                        currentRecord.setTrueHeading(parseIntegerOrSpecial(values[5].trim(), 511));
                        currentRecord.setLongitude(Double.parseDouble(values[6].trim()));
                        currentRecord.setLatitude(Double.parseDouble(values[7].trim()));
                        currentRecord.setTimestampEpoch(Long.parseLong(values[8].trim()));

                        if (previousRecordEpoch != -1) {
                            long timestampDiffSeconds = currentRecord.getTimestampEpoch() - previousRecordEpoch;
                            if (timestampDiffSeconds < 0) {
                                System.err.println("SIMULATION (Rate-Limited Stream): Warning - Timestamp out of order or same as previous. Current: " +
                                        currentRecord.getTimestampEpoch() + ", Previous: " + previousRecordEpoch + ". Sending with minimal delay.");
                                timestampDiffSeconds = 0;
                            }
                            long delayMillis = (long) ((timestampDiffSeconds * 1000) / simulationSpeedFactor);
                            if (delayMillis > 0) {
                                Thread.sleep(delayMillis); // Introduce delay
                            }
                        }
                        previousRecordEpoch = currentRecord.getTimestampEpoch(); // Update for next iteration

                        if (shutdownSignal) break; // Check again after potential sleep

                        String aisDataJson = objectMapper.writeValueAsString(currentRecord);
                        kafkaProducerService.sendAisDataAsJson(currentRecord.getMmsi(), aisDataJson);
                        long count = recordsSentCounter.incrementAndGet();

                        if (count % 1000 == 0) { // Log progress
                            System.out.printf("SIMULATION (Rate-Limited Stream): Sent record #%d (MMSI: %s, CSV Epoch: %d). Elapsed: %dms\n",
                                    count, currentRecord.getMmsi(), currentRecord.getTimestampEpoch(), (System.currentTimeMillis() - simulationWallClockStartTime));
                        }

                    } catch (InterruptedException e) {
                        System.err.println("SIMULATION (Rate-Limited Stream): Thread interrupted. Stopping simulation.");
                        Thread.currentThread().interrupt(); // Preserve interrupt status
                        break; // Exit loop
                    } catch (NumberFormatException e) {
                        System.err.println("SIMULATION (Rate-Limited Stream): CSV Parse Error (NumberFormat) on line: " + line + " | " + e.getMessage());
                    } catch (Exception e) {
                        System.err.println("SIMULATION (Rate-Limited Stream): Error processing line or sending to Kafka: " + line + " | " + e.getMessage());
                    }
                } else {
                    System.err.println("SIMULATION (Rate-Limited Stream): Malformed CSV line (expected 9 columns): " + line);
                }
            }
        } catch (Exception e) {
            if (!shutdownSignal) { // Don't log as critical if it was a graceful shutdown request
                System.err.println("SIMULATION (Rate-Limited Stream): Critical error reading CSV file '" + filePath + "': " + e.getMessage());
                e.printStackTrace();
            }
        } finally {
            if (shutdownSignal) {
                System.out.println("SIMULATION (Rate-Limited Stream): Processing loop interrupted by shutdown signal.");
            }
            System.out.println("SIMULATION (Rate-Limited Stream): Finished processing CSV. Total lines read: " + linesReadCounter.get() +
                    ". Total messages sent: " + recordsSentCounter.get() + ".");
            // Executor is shut down in @PreDestroy
        }
    }


    // Helper method to parse Double, returning null if parsing fails
    private Double parseDoubleOrNull(String value) {
        if (value == null || value.trim().isEmpty() || value.equalsIgnoreCase("NA")) {
            return null;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            System.err.println("SIMULATION (Sorted CSV): Could not parse Double: '" + value + "'");
            return null; // Or throw, or return a default
        }
    }

    // Helper method to parse Integer, returning a default value if parsing fails or value is "NA"
    private Integer parseIntegerOrSpecial(String value, Integer defaultValueForSpecial) {
        if (value == null || value.trim().isEmpty() || value.equalsIgnoreCase("NA")) {
            return defaultValueForSpecial;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            System.err.println("SIMULATION (Sorted CSV): Could not parse Integer: '" + value + "', using default: " + defaultValueForSpecial);
            return defaultValueForSpecial;
        }
    }
}