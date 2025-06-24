package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Optional: for transactional save

import java.util.Optional;

@Service
public class KafkaConsumerService {

    private final AisDataRepository aisDataRepository;
    private final ShipRepository shipRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public KafkaConsumerService(AisDataRepository aisDataRepository, ShipRepository shipRepository, ObjectMapper objectMapper) {
        this.aisDataRepository = aisDataRepository;
        this.shipRepository = shipRepository;
        this.objectMapper = objectMapper;
    }

    // Listen to the same topic name used by the producer
    @KafkaListener(topics = KafkaProducerService.AIS_TOPIC_NAME, groupId = "${spring.kafka.consumer.group-id}")
    // @Transactional // make the database save operation transactional
    public void consumeAisData(String messageJson) {
        // System.out.println("Consumed from Kafka: " + messageJson.substring(0, Math.min(100, messageJson.length())) + "...");
        try {
            AisData aisData = objectMapper.readValue(messageJson, AisData.class);

            // Optional: Look up static ship information
            if (aisData.getMmsi() != null) {
                try {
                    Long mmsiLong = Long.parseLong(aisData.getMmsi()); // Assuming MMSI in AisData is String
                    Optional<Ship> shipOptional = shipRepository.findByMmsi(mmsiLong);
                    if (shipOptional.isPresent()) {
                        Ship ship = shipOptional.get();
                        System.out.println("Found static info for MMSI " + aisData.getMmsi() + ": Type = " + ship.getShiptype());
                    } else {
                        System.out.println("No static info found for MMSI " + aisData.getMmsi());
                    }
                } catch (NumberFormatException e) {
                    System.err.println("Could not parse MMSI to Long for static data lookup: " + aisData.getMmsi());
                }
            }

            aisDataRepository.save(aisData);
            System.out.println("Saved to DB: MMSI " + aisData.getMmsi() + ", ID: " + aisData.getId());

        } catch (Exception e) {
            System.err.println("Error deserializing/saving AisData from Kafka: " + messageJson + " | Error: " + e.getMessage());
            // Consider sending to a Dead Letter Topic (DLT) for unprocessable messages
        }
    }
}