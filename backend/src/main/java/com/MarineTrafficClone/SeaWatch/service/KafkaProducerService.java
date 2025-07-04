package com.MarineTrafficClone.SeaWatch.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Service που λειτουργεί ως παραγωγός (Producer) για το Kafka.
 * Ο ρόλος του είναι να στέλνει μηνύματα (στην περίπτωσή μας, δεδομένα AIS σε μορφή JSON)
 * σε ένα συγκεκριμένο Kafka topic.
 */
@Service
public class KafkaProducerService {

    /**
     * Το όνομα του Kafka topic στο οποίο θα στέλνονται τα δεδομένα AIS.
     */
    public static final String AIS_TOPIC_NAME = "ais-data-stream";

    /**
     * Το KafkaTemplate είναι ένα high-level abstraction του Spring for Kafka
     * που απλοποιεί την αποστολή μηνυμάτων.
     * Είναι ρυθμισμένο να στέλνει μηνύματα με key τύπου String και value τύπου String (JSON).
     */
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Στέλνει ένα μήνυμα AIS στο Kafka topic.
     *
     * @param key Το κλειδί του μηνύματος. Στην περίπτωσή μας, χρησιμοποιούμε το MMSI του πλοίου.
     *            Η χρήση κλειδιού εξασφαλίζει ότι όλα τα μηνύματα για το ίδιο πλοίο θα πηγαίνουν
     *            στο ίδιο partition του topic, διατηρώντας τη σειρά τους.
     * @param aisDataJson Τα δεδομένα του μηνύματος, ως JSON string.
     */
    public void sendAisDataAsJson(String key, String aisDataJson) {
        try {
            kafkaTemplate.send(AIS_TOPIC_NAME, key, aisDataJson);
            // Το παρακάτω logging είναι χρήσιμο για debugging, αλλά μπορεί να "πλημμυρίσει" την κονσόλα.
            // System.out.println("Sent to Kafka topic '" + AIS_TOPIC_NAME + "', key='" + key + "': " + aisDataJson.substring(0, Math.min(100, aisDataJson.length())) + "...");
        } catch (Exception e) {
            System.err.println("Error sending message to Kafka: " + e.getMessage());
        }
    }
}