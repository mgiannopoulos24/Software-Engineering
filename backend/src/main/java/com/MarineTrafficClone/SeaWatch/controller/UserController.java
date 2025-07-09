package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.UserDTO;
import com.MarineTrafficClone.SeaWatch.dto.UserSettingsUpdateDTO;
import com.MarineTrafficClone.SeaWatch.dto.UserUpdateDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.response.UserSettingsUpdateResponse;
import com.MarineTrafficClone.SeaWatch.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller για τη διαχείριση των χρηστών του συστήματος.
 * Περιλαμβάνει λειτουργίες για admin (π.χ. λίστα όλων των χρηστών, αλλαγή ρόλου)
 * και λειτουργίες για τον ίδιο τον χρήστη (π.χ. προβολή/τροποποίηση του προφίλ του).
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Endpoint που επιστρέφει μια λίστα με όλους τους χρήστες του συστήματος.
     * Η πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο 'ADMIN'.
     *
     * @return Ένα ResponseEntity που περιέχει τη λίστα των χρηστών (ως UserDTO) και status 200 OK.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')") // Annotation που επιβάλλει έλεγχο δικαιωμάτων.
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    /**
     * Endpoint που επιστρέφει τις λεπτομέρειες του τρέχοντος συνδεδεμένου χρήστη.
     * Η πρόσβαση επιτρέπεται σε οποιονδήποτε αυθεντικοποιημένο χρήστη (ADMIN ή REGISTERED).
     *
     * @param currentUser Το αντικείμενο του συνδεδεμένου χρήστη, παρέχεται από το Spring Security.
     * @return Ένα ResponseEntity που περιέχει τα στοιχεία του χρήστη (ως UserDTO) και status 200 OK.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()") // Απαιτεί ο χρήστης να είναι απλώς αυθεντικοποιημένος.
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserEntity currentUser) {
        // Χρησιμοποιούμε τη βοηθητική μέθοδο του service για να μετατρέψουμε την οντότητα UserEntity σε UserDTO.
        return ResponseEntity.ok(userService.convertToDto(currentUser));
    }

    /**
     * Endpoint για την ενημέρωση των ρυθμίσεων του τρέχοντος συνδεδεμένου χρήστη.
     *
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης, παρέχεται από το Spring Security.
     * @param settingsDTO Τα δεδομένα της ενημέρωσης από το frontend.
     * @return Ένα ResponseEntity που περιέχει το μήνυμα επιτυχίας και, αν χρειάζεται, ένα νέο JWT token.
     */
    @PutMapping("/me/settings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserSettingsUpdateResponse> updateUserSettings(
            @AuthenticationPrincipal UserEntity currentUser,
            @Valid @RequestBody UserSettingsUpdateDTO settingsDTO) {
        try {
            UserSettingsUpdateResponse response = userService.updateUserSettings(currentUser.getId(), settingsDTO);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // Αυτή η εξαίρεση πιάνεται για λάθη όπως "λάθος κωδικός" ή "email υπάρχει ήδη".
            // Θα μπορούσαμε να το κάνουμε πιο εξειδικευμένο με custom exceptions.
            // Για τώρα, επιστρέφουμε 400 Bad Request.
            // Σημείωση: Το GlobalExceptionHandler θα μπορούσε επίσης να χειριστεί αυτό.
            // Εδώ το κάνουμε ρητά για σαφήνεια.
            UserSettingsUpdateResponse errorResponse = UserSettingsUpdateResponse.builder()
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Endpoint που επιστρέφει τις λεπτομέρειες ενός συγκεκριμένου χρήστη μέσω του ID του.
     * Η πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο 'ADMIN'.
     *
     * @param id Το ID του χρήστη που αναζητούμε.
     * @return Ένα ResponseEntity που περιέχει τα στοιχεία του χρήστη (ως UserDTO) και status 200 OK.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findUserById(id));
    }

    /**
     * Endpoint για την ενημέρωση του ρόλου ενός χρήστη.
     * Η πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο 'ADMIN'.
     *
     * @param id Το ID του χρήστη προς τροποποίηση.
     * @param userUpdateDTO Ένα DTO που περιέχει τον νέο ρόλο.
     * @return Ένα ResponseEntity με τα ενημερωμένα στοιχεία του χρήστη και status 200 OK.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDTO> updateUserRole(@PathVariable Long id, @RequestBody UserUpdateDTO userUpdateDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userUpdateDTO));
    }

    /**
     * Endpoint για τη διαγραφή ενός χρήστη.
     * Η πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο 'ADMIN'.
     *
     * @param id Το ID του χρήστη προς διαγραφή.
     * @return Ένα ResponseEntity χωρίς περιεχόμενο και status 204 No Content.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}