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

import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    // FIX: Added mock for SimulationControlService, which is a dependency of AdminController.
    @MockBean
    private SimulationControlService simulationControlService;

    // Mocks required by SecurityConfiguration
    @MockBean
    private JwtService jwtService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    // Mocks for CommandLineRunners to prevent them from running in the test environment
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
                        .with(csrf()) // Include CSRF token for state-changing requests
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
    void getSimulationSpeed_whenUserIsAdmin_shouldReturnOk() throws Exception {
        double currentSpeed = 2.5;
        when(simulationControlService.getSpeedFactor()).thenReturn(currentSpeed);

        mockMvc.perform(get("/api/admin/simulation/speed")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.speedFactor").value(currentSpeed));
    }

    @Test
    @WithMockUser(authorities = "REGISTERED")
    void getSimulationSpeed_whenUserIsNotAdmin_shouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/simulation/speed")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateSimulationSpeed_whenUserIsAdmin_shouldReturnOk() throws Exception {
        double newSpeed = 5.0;
        SimulationSpeedUpdateRequestDTO requestBody = new SimulationSpeedUpdateRequestDTO();
        requestBody.setNewSpeedFactor(newSpeed);

        // Mock the void method setSpeedFactor
        doNothing().when(simulationControlService).setSpeedFactor(anyDouble());

        mockMvc.perform(post("/api/admin/simulation/speed")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Simulation speed updated to " + newSpeed + "x."));
    }

    @Test
    @WithMockUser(authorities = "REGISTERED")
    void updateSimulationSpeed_whenUserIsNotAdmin_shouldReturnForbidden() throws Exception {
        SimulationSpeedUpdateRequestDTO requestBody = new SimulationSpeedUpdateRequestDTO();
        requestBody.setNewSpeedFactor(10.0);

        mockMvc.perform(post("/api/admin/simulation/speed")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isForbidden());
    }
}