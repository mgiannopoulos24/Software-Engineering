package marinemap.service;

import marinemap.model.AisData;
import marinemap.repository.AisDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private static final String TOPIC = "ais-data-topic";
    private static final String GROUP_ID = "ais-consumer-group";

    @Autowired
    private AisDataRepository aisDataRepository;

    @Autowired
    private ObjectMapper objectMapper; // Autowire ObjectMapper

    @KafkaListener(topics = TOPIC, groupId = GROUP_ID)
    public void consumeAISData(String message) {
        System.out.println("Received AIS data string: " + message);
        try {
            // Assuming the message is a JSON string representing AisData
            AisData aisData = objectMapper.readValue(message, AisData.class);
            aisDataRepository.save(aisData);
            System.out.println("Saved AIS data to database: " + aisData);
        } catch (Exception e) {
            System.err.println("Error processing or saving AIS data: " + e.getMessage());
            // Should add exception handling
        }
    }
}