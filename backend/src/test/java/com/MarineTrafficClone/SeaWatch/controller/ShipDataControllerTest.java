package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.dto.TrackPointDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.ShipDataService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ShipDataController.class)
@Import(SecurityConfiguration.class)
@WithMockUser // Όλα τα endpoints απαιτούν αυθεντικοποίηση, οπότε βάζουμε έναν mock user σε όλα τα tests.
class ShipDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ShipDataService shipDataService;

    // Mocks για το SecurityConfiguration
    @MockBean private JwtService jwtService;
    @MockBean private AuthenticationProvider authenticationProvider;
    @MockBean private StaticShipDataLoaderService staticShipDataLoaderService;
    @MockBean private CsvDataLoaderService csvDataLoaderService;

    @Test
    void getShipDetails_whenShipExists_shouldReturnDetails() throws Exception {
        // Arrange
        long mmsi = 12345L;
        ShipDetailsDTO mockDetails = new ShipDetailsDTO();
        mockDetails.setMmsi(mmsi);
        mockDetails.setShiptype(ShipType.CARGO);
        mockDetails.setSpeedOverGround(10.5);

        when(shipDataService.getShipDetails(mmsi)).thenReturn(mockDetails);

        // Act & Assert
        mockMvc.perform(get("/api/ship-data/ships/{mmsi}/details", mmsi))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mmsi", is(12345)))
                .andExpect(jsonPath("$.shiptype", is("cargo")))
                .andExpect(jsonPath("$.speedOverGround", is(10.5)));
    }

    @Test
    void getShipDetails_whenShipNotFound_shouldReturnNotFound() throws Exception {
        // Arrange
        long mmsi = 99999L;
        when(shipDataService.getShipDetails(anyLong())).thenThrow(new ResourceNotFoundException("Ship not found"));

        // Act & Assert
        mockMvc.perform(get("/api/ship-data/ships/{mmsi}/details", mmsi))
                .andExpect(status().isNotFound());
    }

    @Test
    void getShipTrack_shouldReturnTrackPoints() throws Exception {
        // Arrange
        String mmsi = "54321";
        List<TrackPointDTO> track = List.of(
                new TrackPointDTO(34.0, 25.0, 1000L),
                new TrackPointDTO(34.1, 25.1, 1100L)
        );
        when(shipDataService.getShipTrack(anyString())).thenReturn(track);

        // Act & Assert
        mockMvc.perform(get("/api/ship-data/track/{mmsi}", mmsi))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].latitude", is(34.0)))
                .andExpect(jsonPath("$[1].timestampEpoch", is(1100)));
    }

    @Test
    void getAllActiveShips_shouldReturnShipList() throws Exception {
        // Arrange
        ShipDetailsDTO ship1 = new ShipDetailsDTO();
        ship1.setMmsi(111L);
        ship1.setShiptype(ShipType.TUG);

        ShipDetailsDTO ship2 = new ShipDetailsDTO();
        ship2.setMmsi(222L);
        ship2.setShiptype(ShipType.PASSENGER);

        when(shipDataService.getAllActiveShipsDetails()).thenReturn(List.of(ship1, ship2));

        // Act & Assert
        mockMvc.perform(get("/api/ship-data/active-ships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].mmsi", is(111)))
                .andExpect(jsonPath("$[1].shiptype", is("passenger")));
    }
}