package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.response.AuthenticationResponse;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.AuthenticationService;
import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests για τον AuthenticationController.
 * Ελέγχει τα public endpoints για register και login.
 */
@WebMvcTest(controllers = AuthenticationController.class)
@Import(SecurityConfiguration.class)
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationService authenticationService;

    // Τα @MockBean για τις εξαρτήσεις του SecurityConfiguration είναι απαραίτητα εδώ
    @MockBean
    private JwtService jwtService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    // Πρέπει να κάνουμε mock και τα CommandLineRunners γιατί το @WebMvcTest τα ψάχνει
    @MockBean
    private StaticShipDataLoaderService staticShipDataLoaderService;
    @MockBean
    private CsvDataLoaderService csvDataLoaderService;

    @Test
    void registerUser_shouldReturnTokenOnSuccess() throws Exception {
        // 1. Ρύθμιση (Arrange)
        AuthDTO request = new AuthDTO("newuser@example.com", "password123");
        AuthenticationResponse response = new AuthenticationResponse("new-token", RoleType.REGISTERED);

        // Όταν κληθεί το service, να επιστρέψει την παραπάνω απάντηση.
        when(authenticationService.register(any(AuthDTO.class))).thenReturn(response);

        // 2. Δράση & 3. Επιβεβαίωση (Act & Assert)
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new-token"))
                .andExpect(jsonPath("$.role").value("registered"));
    }

    @Test
    void authenticateUser_shouldReturnTokenOnSuccess() throws Exception {
        // 1. Ρύθμιση (Arrange)
        AuthDTO request = new AuthDTO("existinguser@example.com", "password123");
        AuthenticationResponse response = new AuthenticationResponse("auth-token", RoleType.REGISTERED);

        when(authenticationService.login(any(AuthDTO.class))).thenReturn(response);

        // 2. Δράση & 3. Επιβεβαίωση (Act & Assert)
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("auth-token"));
    }
}