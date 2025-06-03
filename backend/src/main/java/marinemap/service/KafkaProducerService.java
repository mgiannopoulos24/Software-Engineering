package marinemap.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

// import marinemap.model.AisData;

@Service
public class KafkaProducerService {

    private static final String TOPIC = "ais-data-topic"; 

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate; // Should change to KafkaTemplate <String, AISData>

    public void sendAISData(String message) {
        this.kafkaTemplate.send(TOPIC, message);
        System.out.println("Sent AIS data: " + message);
    }
}