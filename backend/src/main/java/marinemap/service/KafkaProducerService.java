package marinemap.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    // Might have to change name or define in application.properties and inject it.
    public static final String AIS_TOPIC_NAME = "ais-data-stream"; // Example topic name

    private final KafkaTemplate<String, String> kafkaTemplate; // To send JSON strings

    @Autowired
    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendAisDataAsJson(String key, String aisDataJson) {
        try {
            kafkaTemplate.send(AIS_TOPIC_NAME, key, aisDataJson);
            // System.out.println("Sent to Kafka topic '" + AIS_TOPIC_NAME + "', key='" + key + "': " + aisDataJson.substring(0, Math.min(100, aisDataJson.length())) + "...");
        } catch (Exception e) {
            System.err.println("Error sending message to Kafka: " + e.getMessage());
            // Consider more robust error handling
        }
    }
}