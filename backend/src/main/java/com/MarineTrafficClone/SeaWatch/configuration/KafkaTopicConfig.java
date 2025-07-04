package com.MarineTrafficClone.SeaWatch.configuration;

import com.MarineTrafficClone.SeaWatch.service.KafkaProducerService; // To use the constant
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Κλάση διαμόρφωσης (Configuration) για τη δημιουργία των Kafka topics.
 * Το Spring Boot εκτελεί αυτόματα τις μεθόδους @Bean κατά την εκκίνηση της εφαρμογής
 * για να δημιουργήσει και να καταχωρήσει τα απαραίτητα beans στο Application Context.
 */
@Configuration
public class KafkaTopicConfig {

    /**
     * Δημιουργεί ένα bean τύπου NewTopic για το topic των δεδομένων AIS.
     * Αυτό εξασφαλίζει ότι το topic "ais-data-stream" θα υπάρχει στον Kafka broker
     * πριν η εφαρμογή προσπαθήσει να στείλει ή να λάβει μηνύματα από αυτό.
     *
     * @return Ένα αντικείμενο NewTopic που περιγράφει το topic προς δημιουργία.
     */
    @Bean
    public NewTopic aisDataStreamTopic() {
        return TopicBuilder.name(KafkaProducerService.AIS_TOPIC_NAME) // Using the constant
                .partitions(1)    // 1 is fine for now
                .replicas(1)      // For single Kafka broker in Docker, must be 1.
                .build();
    }
}