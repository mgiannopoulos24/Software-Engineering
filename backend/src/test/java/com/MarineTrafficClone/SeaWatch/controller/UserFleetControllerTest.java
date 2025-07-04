package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import com.MarineTrafficClone.SeaWatch.security.SecurityConfiguration;
import com.MarineTrafficClone.SeaWatch.service.CsvDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.StaticShipDataLoaderService;
import com.MarineTrafficClone.SeaWatch.service.UserFleetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserFleetController.class)
@Import(SecurityConfiguration.class)
@WithMockUser // Γενικός mock user για να περνάμε την αυθεντικοποίηση
class UserFleetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserFleetService userFleetService;

    // Mocks για το SecurityConfiguration
    @MockBean private JwtService jwtService;
    @MockBean private AuthenticationProvider authenticationProvider;
    @MockBean private StaticShipDataLoaderService staticShipDataLoaderService;
    @MockBean private CsvDataLoaderService csvDataLoaderService;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        // Δημιουργούμε ένα mock UserEntity που θα χρησιμοποιήσουμε για το @AuthenticationPrincipal
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setEmail("test@user.com");
        testUser.setRole(RoleType.REGISTERED);
    }

    @Test
    void getMyWatchedShipsDetails_shouldReturnFleet() throws Exception {
        // Arrange
        ShipDetailsDTO shipInFleet = new ShipDetailsDTO();
        shipInFleet.setMmsi(12345L);
        when(userFleetService.getWatchedShipsDetails(testUser.getId())).thenReturn(Set.of(shipInFleet));

        // Act & Assert
        mockMvc.perform(get("/api/fleet/mine")
                        .with(user(testUser))) // Εισάγουμε το UserEntity στο security context
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].mmsi").value(12345L));
    }

    @Test
    void addShipToMyFleet_shouldReturnOk() throws Exception {
        // Arrange
        long mmsiToAdd = 54321L;
        // H service method είναι void, οπότε δεν επιστρέφει τίποτα.
        doNothing().when(userFleetService).addShipToUserFleet(testUser.getId(), mmsiToAdd);

        // Act & Assert
        mockMvc.perform(post("/api/fleet/mine/ships/{mmsi}", mmsiToAdd)
                        .with(user(testUser))
                        .with(csrf())) // Απαραίτητο για POST, PUT, DELETE
                .andExpect(status().isOk());

        // Επιβεβαιώνουμε ότι η service method κλήθηκε σωστά
        verify(userFleetService, times(1)).addShipToUserFleet(testUser.getId(), mmsiToAdd);
    }

    @Test
    void removeShipFromMyFleet_shouldReturnOk() throws Exception {
        // Arrange
        long mmsiToRemove = 12345L;
        doNothing().when(userFleetService).removeShipFromUserFleet(testUser.getId(), mmsiToRemove);

        // Act & Assert
        mockMvc.perform(delete("/api/fleet/mine/ships/{mmsi}", mmsiToRemove)
                        .with(user(testUser))
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(userFleetService, times(1)).removeShipFromUserFleet(testUser.getId(), mmsiToRemove);
    }
}