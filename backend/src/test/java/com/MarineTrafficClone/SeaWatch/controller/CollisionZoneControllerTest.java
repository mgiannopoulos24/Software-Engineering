package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.CollisionZoneDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.CollisionZoneService;
import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CollisionZoneController.class)
@Import(SecurityConfiguration.class)
@WithMockUser
class CollisionZoneControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CollisionZoneService collisionZoneService;

    // Mocks για το SecurityConfiguration
    @MockBean private JwtService jwtService;
    @MockBean private AuthenticationProvider authenticationProvider;
    @MockBean private StaticShipDataLoaderService staticShipDataLoaderService;
    @MockBean private CsvDataLoaderService csvDataLoaderService;

    private UserEntity testUser;
    private CollisionZone testZone;

    @BeforeEach
    void setUp() {
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setEmail("test@user.com");
        testUser.setRole(RoleType.REGISTERED);

        testZone = new CollisionZone();
        testZone.setId(20L);
        testZone.setName("Collision Test Zone");
        testZone.setUser(testUser);
    }

    @Test
    void getMyZone_whenZoneExists_shouldReturnZone() throws Exception {
        when(collisionZoneService.getZoneForUser(testUser.getId())).thenReturn(Optional.of(testZone));

        mockMvc.perform(get("/api/collision-zone/mine")
                        .with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20L))
                .andExpect(jsonPath("$.name").value("Collision Test Zone"));
    }

    @Test
    void getMyZone_whenZoneNotExists_shouldReturnNotFound() throws Exception {
        when(collisionZoneService.getZoneForUser(testUser.getId())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/collision-zone/mine")
                        .with(user(testUser)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createOrUpdateMyZone_shouldReturnUpdatedZone() throws Exception {
        CollisionZoneDTO requestDto = new CollisionZoneDTO();
        requestDto.setName("Updated Collision Zone");

        when(collisionZoneService.createOrUpdateZone(any(CollisionZoneDTO.class), any(UserEntity.class))).thenReturn(testZone);

        mockMvc.perform(put("/api/collision-zone/mine")
                        .with(user(testUser))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Collision Test Zone"));
    }

    @Test
    void deleteMyZone_shouldReturnNoContent() throws Exception {
        doNothing().when(collisionZoneService).deleteZoneForUser(testUser.getId());

        mockMvc.perform(delete("/api/collision-zone/mine")
                        .with(user(testUser))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(collisionZoneService, times(1)).deleteZoneForUser(testUser.getId());
    }
}