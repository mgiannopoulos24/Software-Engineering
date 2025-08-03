package com.MarineTrafficClone.SeaWatch.security;

import com.MarineTrafficClone.SeaWatch.AbstractTest;
import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration Tests για τη ροή ασφαλείας της εφαρμογής.
 * Χρησιμοποιεί @SpringBootTest για να φορτώσει ολόκληρο το context της εφαρμογής
 * και @AutoConfigureMockMvc για να κάνει πραγματικά HTTP requests μέσω του MockMvc.
 */
@AutoConfigureMockMvc
@Transactional // Εξασφαλίζει ότι η βάση είναι καθαρή για κάθε test.
// Παρέχει ένα mock secret key για το JWT Service, ώστε το test context να μπορεί να ξεκινήσει.
@TestPropertySource(properties = { "jwt.secret-key=dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0" })
class SecurityIntegrationTest extends AbstractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserEntityRepository userEntityRepository;

    @Autowired
    private ShipRepository shipRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // Θα δημιουργήσουμε χρήστες για τα tests μας
    private UserEntity registeredUser;
    private UserEntity adminUser;

    @BeforeEach
    void setUp() {
        // Καθαρίζουμε τα πάντα πριν από κάθε test για πλήρη απομόνωση
        userEntityRepository.deleteAll();
        shipRepository.deleteAll();

        // Δημιουργούμε και αποθηκεύουμε έναν απλό εγγεγραμμένο χρήστη
        registeredUser = UserEntity.builder()
                .email("user@test.com")
                .password(passwordEncoder.encode("password"))
                .role(RoleType.REGISTERED)
                .build();
        userEntityRepository.save(registeredUser);

        // Δημιουργούμε και αποθηκεύουμε έναν διαχειριστή
        adminUser = UserEntity.builder()
                .email("admin@test.com")
                .password(passwordEncoder.encode("adminpass"))
                .role(RoleType.ADMIN)
                .build();
        userEntityRepository.save(adminUser);

        // Δημιουργούμε ένα πλοίο για να το προσθέσουμε σε στόλο
        shipRepository.save(Ship.builder().mmsi(12345L).shiptype(ShipType.CARGO).build());
    }

    // --- Tests για Authentication (Ποιος είσαι;) ---

    @Test
    void accessProtectedEndpoint_asAnonymous_shouldReturnForbidden() throws Exception {
        // Σενάριο: Ανώνυμος χρήστης προσπαθεί να δει τον στόλο του.
        // Αναμένουμε: 403 Forbidden, καθώς δεν είναι καν αυθεντικοποιημένος.
        mockMvc.perform(get("/api/fleet/mine"))
                .andExpect(status().isForbidden());
    }

    @Test
    void accessAdminEndpoint_asAnonymous_shouldReturnForbidden() throws Exception {
        // Σενάριο: Ανώνυμος χρήστης προσπαθεί να δει τη λίστα χρηστών.
        // Αναμένουμε: 403 Forbidden.
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    // --- Tests για Authorization (Έχεις το δικαίωμα;) ---

    @Test
    void accessAdminEndpoint_asRegisteredUser_shouldReturnForbidden() throws Exception {
        // Σενάrio: Εγγεγραμμένος χρήστης προσπαθεί να δει τη λίστα όλων των χρηστών (admin-only).
        // Αναμένουμε: 403 Forbidden.

        // Δημιουργούμε ένα έγκυρο token για τον απλό χρήστη.
        String userToken = jwtService.generateToken(registeredUser);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ADMIN") // Ένας εναλλακτικός, πιο καθαρός τρόπος για το ίδιο πράγμα.
    void accessAdminEndpoint_asAdmin_shouldReturnOk() throws Exception {
        // Σενάριο: Admin χρήστης προσπαθεί να δει τη λίστα χρηστών.
        // Αναμένουμε: 200 OK.

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk());
    }

    @Test
    void accessFleetEndpoint_asRegisteredUser_shouldReturnOk() throws Exception {
        // Σενάριο: Εγγεγραμμένος χρήστης προσπαθεί να δει τον (κενό) στόλο του.
        // Αναμένουμε: 200 OK, γιατί έχει το σωστό ρόλο.

        String userToken = jwtService.generateToken(registeredUser);

        mockMvc.perform(get("/api/fleet/mine")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());
    }

    // --- Tests για Ροές και Εξαιρέσεις Ασφαλείας ---

    @Test
    void registerWithExistingEmail_shouldReturnConflict() throws Exception {
        // Σενάριο: Προσπάθεια εγγραφής με email που υπάρχει ήδη στη βάση.
        // Αναμένουμε: 409 Conflict, όπως ορίζεται στον GlobalExceptionHandler.

        AuthDTO registrationRequest = new AuthDTO("user@test.com", "new-password");

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registrationRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    void loginWithWrongPassword_shouldReturnForbidden() throws Exception {
        // Σενάριο: Προσπάθεια σύνδεσης με σωστό email αλλά λάθος κωδικό.
        // Αναμένουμε: 403 Forbidden (το Spring Security το μεταφράζει έτσι από την BadCredentialsException).

        AuthDTO loginRequest = new AuthDTO("user@test.com", "wrong-password");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void accessWithMalformedToken_shouldReturnForbidden() throws Exception {
        // Σενάριο: Προσπάθεια πρόσβασης με ένα token που δεν είναι έγκυρο JWT.
        // Αναμένουμε: 403 Forbidden. Ο JwtAuthenticationFilter θα αποτύχει να το κάνει parse.

        mockMvc.perform(get("/api/fleet/mine")
                        .header("Authorization", "Bearer this.is.not.a.valid.token"))
                .andExpect(status().isForbidden());
    }
}