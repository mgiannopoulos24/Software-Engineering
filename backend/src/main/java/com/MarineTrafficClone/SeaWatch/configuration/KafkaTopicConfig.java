package com.MarineTrafficClone.SeaWatch.configuration;

import com.MarineTrafficClone.SeaWatch.service.KafkaProducerService; // To use the constant
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic aisDataStreamTopic() {
        return TopicBuilder.name(KafkaProducerService.AIS_TOPIC_NAME) // Using the constant
                .partitions(1)    // 1 is fine for now
                .replicas(1)      // For single Kafka broker in Docker, must be 1.
                .build();
    }
}