package com.MarineTrafficClone.SeaWatch.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Service
public class CsvDataLoaderService {

    private final KafkaProducerService kafkaProducerService;
    private final ObjectMapper objectMapper; // For converting AisData to JSON

    @Autowired
    public CsvDataLoaderService(KafkaProducerService kafkaProducerService, ObjectMapper objectMapper) {
        this.kafkaProducerService = kafkaProducerService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct // Load data on application startup
    public void loadCsvDataAndProduceToKafka() {
        String filePath = "AIS-Data/nari_dynamic.csv";
        System.out.println("Attempting to load CSV: " + filePath);

        try (InputStream is = new ClassPathResource(filePath).getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {

            String line;
            boolean headerSkipped = false;
            int recordsProcessed = 0;
            int recordsSent = 0;

            while ((line = reader.readLine()) != null) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue; // Skip header row
                }
                if (line.trim().isEmpty()) {
                    continue; // Skip empty lines
                }

                String[] values = line.split(",");
                if (values.length == 9) { // sourcemmsi,navigationalstatus,rateofturn,speedoverground,courseoverground,trueheading,lon,lat,t
                    try {
                        AisData aisData = new AisData();
                        aisData.setMmsi(values[0].trim());
                        aisData.setNavigationalStatus(Integer.parseInt(values[1].trim()));
                        aisData.setRateOfTurn(parseDoubleOrNull(values[2].trim())); // Handle potential non-numeric
                        aisData.setSpeedOverGround(Double.parseDouble(values[3].trim()));
                        aisData.setCourseOverGround(Double.parseDouble(values[4].trim()));
                        aisData.setTrueHeading(parseIntegerOrSpecial(values[5].trim(), 511)); // Handle potential non-numeric, default to 511
                        aisData.setLongitude(Double.parseDouble(values[6].trim()));
                        aisData.setLatitude(Double.parseDouble(values[7].trim()));
                        aisData.setTimestampEpoch(Long.parseLong(values[8].trim()));
                        // aisData.setProcessedAt(Instant.now()); // If we end up needing this field

                        String aisDataJson = objectMapper.writeValueAsString(aisData);
                        kafkaProducerService.sendAisDataAsJson(aisData.getMmsi(), aisDataJson); // Using MMSI as key
                        recordsSent++;
                    } catch (NumberFormatException e) {
                        System.err.println("Skipping line due to parsing error (NumberFormat): " + line + " | " + e.getMessage());
                    } catch (Exception e) {
                        System.err.println("Skipping line due to general error during processing or sending: " + line + " | " + e.getMessage());
                    }
                } else {
                    System.err.println("Skipping malformed CSV line (expected 9 columns): " + line);
                }
                recordsProcessed++;
                if (recordsProcessed % 1000 == 0) { // Log progress every 1000 records
                    System.out.println("Processed " + recordsProcessed + " lines, sent " + recordsSent + " messages to Kafka.");
                }
            }
            System.out.println("Finished processing CSV. Total lines processed: " + recordsProcessed + ". Total messages sent to Kafka: " + recordsSent);

        } catch (Exception e) {
            System.err.println("Failed to load or process CSV file '" + filePath + "': " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Double parseDoubleOrNull(String value) {
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null; // Or handle as needed, e.g., return 0.0 or log
        }
    }

    private Integer parseIntegerOrSpecial(String value, Integer defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue; // e.g., 511 for trueHeading if it's "NA" or invalid
        }
    }
}
