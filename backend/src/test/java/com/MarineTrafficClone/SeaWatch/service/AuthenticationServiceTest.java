package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.MarineTrafficClone.SeaWatch.response.AuthenticationResponse;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests για την κλάση AuthenticationService.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserEntityRepository userEntityRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthenticationService authenticationService;

    /**
     * Test για τη λειτουργία εγγραφής (register).
     * Αναμένουμε: Να δημιουργηθεί ένας νέος χρήστης και να επιστραφεί ένα token.
     */
    @Test
    void register_shouldCreateUserAndReturnToken() {
        // 1. Ρύθμιση (Arrange)
        AuthDTO request = new AuthDTO("test@example.com", "password123");
        UserEntity savedUser = UserEntity.builder()
                .email(request.getEmail())
                .password("encodedPassword")
                .role(RoleType.REGISTERED)
                .build();

        // Ορίζουμε τι θα επιστρέψουν τα mocks όταν κληθούν.
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userEntityRepository.save(any(UserEntity.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any(UserEntity.class))).thenReturn("mock-jwt-token");

        // 2. Δράση (Act)
        AuthenticationResponse response = authenticationService.register(request);

        // 3. Επιβεβαίωση (Assert)
        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals(RoleType.REGISTERED, response.getRole());
    }

    /**
     * Test για τη λειτουργία σύνδεσης (login).
     * Αναμένουμε: Να γίνει επιτυχής αυθεντικοποίηση και να επιστραφεί ένα token.
     */
    @Test
    void login_whenCredentialsAreValid_shouldReturnToken() {
        // 1. Ρύθμιση (Arrange)
        AuthDTO request = new AuthDTO("admin@example.com", "password123");
        UserEntity existingUser = UserEntity.builder()
                .email(request.getEmail())
                .password("encodedPassword")
                .role(RoleType.ADMIN)
                .build();

        // Ορίζουμε τι θα επιστρέψουν τα mocks.
        // Το authenticationManager.authenticate δεν επιστρέφει τιμή, οπότε δεν χρειάζεται when().
        when(userEntityRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken(existingUser)).thenReturn("mock-jwt-token-admin");

        // 2. Δράση (Act)
        AuthenticationResponse response = authenticationService.login(request);

        // 3. Επιβεβαίωση (Assert)
        assertNotNull(response);
        assertEquals("mock-jwt-token-admin", response.getToken());
        assertEquals(RoleType.ADMIN, response.getRole());
    }
}