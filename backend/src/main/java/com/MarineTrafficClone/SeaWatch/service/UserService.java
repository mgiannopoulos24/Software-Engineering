package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.UserDTO;
import com.MarineTrafficClone.SeaWatch.dto.UserSettingsUpdateDTO;
import com.MarineTrafficClone.SeaWatch.dto.UserUpdateDTO;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.MarineTrafficClone.SeaWatch.response.UserSettingsUpdateResponse;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service που περιέχει την επιχειρησιακή λογική για τη διαχείριση των χρηστών
 * (εκτός από την αυθεντικοποίηση, η οποία βρίσκεται στο AuthenticationService).
 * Περιλαμβάνει λειτουργίες όπως η ανάκτηση, η ενημέρωση και η διαγραφή χρηστών.
 */
@Service
public class UserService {

    private final UserEntityRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired
    public UserService(UserEntityRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Ανακτά όλους τους χρήστες από τη βάση δεδομένων και τους μετατρέπει σε UserDTO.
     * @return Μια λίστα από UserDTO.
     */
    @Transactional(readOnly = true)
    public List<UserDTO> findAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Βρίσκει έναν χρήστη με βάση το ID του.
     * @param userId Το ID του χρήστη.
     * @return Το UserDTO του χρήστη.
     * @throws ResourceNotFoundException αν ο χρήστης δεν βρεθεί.
     */
    @Transactional(readOnly = true)
    public UserDTO findUserById(Long userId) {
        return userRepository.findById(userId)
                .map(this::convertToDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    /**
     * Ενημερώνει τον ρόλο ενός χρήστη.
     * @param userId Το ID του χρήστη προς ενημέρωση.
     * @param userUpdateDTO Το DTO που περιέχει τον νέο ρόλο.
     * @return Το ενημερωμένο UserDTO.
     */
    @Transactional
    public UserDTO updateUser(Long userId, UserUpdateDTO userUpdateDTO) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setRole(userUpdateDTO.getRole());

        UserEntity updatedUser = userRepository.save(user);
        return convertToDto(updatedUser);
    }

    /**
     * Διαγράφει έναν χρήστη από τη βάση δεδομένων.
     * @param userId Το ID του χρήστη προς διαγραφή.
     */
    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    /**
     * ΝΕΑ ΜΕΘΟΔΟΣ
     * Ενημερώνει τις ρυθμίσεις (email/κωδικό) του τρέχοντος συνδεδεμένου χρήστη.
     *
     * @param userId Το ID του χρήστη που κάνει την αλλαγή.
     * @param settingsDTO Τα νέα δεδομένα από το frontend.
     * @return Ένα αντικείμενο UserSettingsUpdateResponse που περιέχει μήνυμα και (προαιρετικά) νέο token.
     */
    @Transactional
    public UserSettingsUpdateResponse updateUserSettings(Long userId, UserSettingsUpdateDTO settingsDTO) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isEmailChanged = !user.getEmail().equals(settingsDTO.getEmail());
        boolean isPasswordChanged = StringUtils.hasText(settingsDTO.getNewPassword());

        // Αν δεν αλλάζει τίποτα, δεν κάνουμε τίποτα.
        if (!isEmailChanged && !isPasswordChanged) {
            return UserSettingsUpdateResponse.builder().message("No changes detected.").build();
        }

        // Ο έλεγχος του τρέχοντος κωδικού είναι απαραίτητος για οποιαδήποτε αλλαγή.
        if (!passwordEncoder.matches(settingsDTO.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password provided.");
        }

        // Αλλαγή κωδικού
        if (isPasswordChanged) {
            user.setPassword(passwordEncoder.encode(settingsDTO.getNewPassword()));
        }

        String newToken = null;
        // Αλλαγή email
        if (isEmailChanged) {
            // Έλεγχος αν το νέο email χρησιμοποιείται ήδη
            if (userRepository.findByEmail(settingsDTO.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email address " + settingsDTO.getEmail() + " is already in use.");
            }
            user.setEmail(settingsDTO.getEmail());
        }

        UserEntity savedUser = userRepository.save(user);

        // Αν το email άλλαξε, πρέπει να δημιουργήσουμε νέο token γιατί το "subject" του JWT είναι το email.
        if (isEmailChanged) {
            newToken = jwtService.generateToken(savedUser);
        }

        return UserSettingsUpdateResponse.builder()
                .message("Settings updated successfully.")
                .newToken(newToken)
                .build();
    }

    /**
     * Βοηθητική (helper) μέθοδος για τη μετατροπή μιας οντότητας UserEntity σε UserDTO.
     * Αυτό εξασφαλίζει ότι ευαίσθητες πληροφορίες (όπως ο κωδικός) δεν αποστέλλονται ποτέ στον client.
     * @param user Η οντότητα UserEntity.
     * @return Το αντίστοιχο UserDTO.
     */
    public UserDTO convertToDto(UserEntity user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setRole(user.getRole());
        // Ελέγχουμε αν οι συσχετισμένες ζώνες είναι null για να θέσουμε τα boolean flags.
        userDTO.setHasActiveInterestZone(user.getZoneOfInterest() != null);
        userDTO.setHasActiveCollisionZone(user.getCollisionZone() != null);
        return userDTO;
    }
}