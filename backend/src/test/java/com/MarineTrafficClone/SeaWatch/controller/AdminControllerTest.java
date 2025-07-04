package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.AbstractTest; // Κράτα το αυτό
import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.ShipTypeUpdateRequest;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.AdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import; // <-- Import
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider; // <-- Import
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import(SecurityConfiguration.class)
class AdminControllerTest extends AbstractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    // Πρέπει να κάνουμε mock τις εξαρτήσεις που χρειάζεται το SecurityConfiguration
    @MockBean
    private JwtService jwtService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateShipType_whenUserIsAdmin_shouldReturnOk() throws Exception {
        long mmsi = 12345L;
        ShipType newType = ShipType.TUG;
        ShipTypeUpdateRequest requestBody = new ShipTypeUpdateRequest(newType);

        ShipDetailsDTO responseDto = new ShipDetailsDTO();
        responseDto.setMmsi(mmsi);
        responseDto.setShiptype(newType);

        when(adminService.updateShipType(eq(mmsi), eq(newType))).thenReturn(responseDto);

        mockMvc.perform(put("/api/admin/ships/{mmsi}/type", mmsi)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mmsi").value(mmsi))
                .andExpect(jsonPath("$.shiptype").value(newType.getValue()));
    }

    @Test
    @WithMockUser(authorities = "REGISTERED")
    void updateShipType_whenUserIsNotAdmin_shouldReturnForbidden() throws Exception {
        long mmsi = 12345L;
        ShipTypeUpdateRequest requestBody = new ShipTypeUpdateRequest(ShipType.TUG);

        mockMvc.perform(put("/api/admin/ships/{mmsi}/type", mmsi)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isForbidden());
    }
}