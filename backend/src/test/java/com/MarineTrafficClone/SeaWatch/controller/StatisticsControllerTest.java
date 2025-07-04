package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.AbstractTest;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.StatisticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests για τον StatisticsController.
 * Ελέγχει τα endpoints που επιστρέφουν στατιστικά στοιχεία.
 */
@WebMvcTest(controllers = StatisticsController.class)
@Import(SecurityConfiguration.class)
@WithMockUser // Απαιτείται ένας αυθεντικοποιημένος χρήστης για την πρόσβαση.
class StatisticsControllerTest extends AbstractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StatisticsService statisticsService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    @Test
    void getActiveShipCount_shouldReturnCount() throws Exception {
        // Arrange
        when(statisticsService.getActiveShipCount()).thenReturn(150L);

        // Act & Assert
        mockMvc.perform(get("/api/statistics/active-ships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(150));
    }

    @Test
    void getStoppedShipCount_shouldReturnCount() throws Exception {
        // Arrange
        when(statisticsService.getStoppedShipCount()).thenReturn(25L);

        // Act & Assert
        mockMvc.perform(get("/api/statistics/stopped-ships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(25));
    }

    @Test
    void getInterestZoneCount_shouldReturnCount() throws Exception {
        // Arrange
        when(statisticsService.getInterestZoneCount()).thenReturn(5);

        // Act & Assert
        mockMvc.perform(get("/api/statistics/interest-zones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));
    }
}
