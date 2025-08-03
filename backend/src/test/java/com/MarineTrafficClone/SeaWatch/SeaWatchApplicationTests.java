package com.MarineTrafficClone.SeaWatch;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

// This is necessary because this test class inherits from AbstractTest, which uses @SpringBootTest.
@TestPropertySource(properties = { "jwt.secret-key=dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0" })
class SeaWatchApplicationTests extends AbstractTest {

	@Test
	void contextLoads() {
	}

}