package com.MarineTrafficClone.SeaWatch;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@EmbeddedKafka(partitions = 1, brokerProperties = { "listeners=PLAINTEXT://localhost:9093", "port=9093" })
@DirtiesContext // <-- Σημαντικό: Καθαρίζει το context μετά το test για να μην επηρεάζει άλλα
class SeaWatchApplicationTests extends AbstractTest {

	@Test
	void contextLoads() {
	}

}