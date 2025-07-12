package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.ShipTypeUpdateRequest;
import com.MarineTrafficClone.SeaWatch.dto.SimulationSpeedUpdateRequestDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.AdminService;
import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.SimulationControlService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import(SecurityConfiguration.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;
    
    @MockBean
    private SimulationControlService simulationControlService;

    // Πρέπει να κάνουμε mock τις εξαρτήσεις που χρειάζεται το SecurityConfiguration
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
    
    @Test
    @WithMockUser(authorities = "ADMIN")
    void getSimulationSpeed_shouldReturnCurrentSpeed() throws Exception {
        double expectedSpeed = 1.5;
        when(simulationControlService.getSpeedFactor()).thenReturn(expectedSpeed);
        
        mockMvc.perform(get("/api/admin/simulation/speed")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.speedFactor").value(expectedSpeed));
    }
    
    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateSimulationSpeed_shouldUpdateSpeedAndReturnSuccess() throws Exception {
        double newSpeed = 2.0;
        SimulationSpeedUpdateRequestDTO requestBody = new SimulationSpeedUpdateRequestDTO();
        requestBody.setNewSpeedFactor(newSpeed);
        
        mockMvc.perform(post("/api/admin/simulation/speed")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }
    
    @Test
    @WithMockUser(authorities = "REGISTERED")
    void getSimulationSpeed_whenUserIsNotAdmin_shouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/simulation/speed")
                .with(csrf()))
                .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(authorities = "REGISTERED")
    void updateSimulationSpeed_whenUserIsNotAdmin_shouldReturnForbidden() throws Exception {
        SimulationSpeedUpdateRequestDTO requestBody = new SimulationSpeedUpdateRequestDTO();
        requestBody.setNewSpeedFactor(2.0);
        
        mockMvc.perform(post("/api/admin/simulation/speed")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isForbidden());
    }
}