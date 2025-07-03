package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.UserDTO;
import com.MarineTrafficClone.SeaWatch.dto.UserUpdateDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users
     * Επιστρέφει μια λίστα με όλους τους χρήστες.
     * Πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο ADMIN.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    /**
     * GET /api/users/me
     * Επιστρέφει τις λεπτομέρειες του συνδεδεμένου χρήστη.
     * Πρόσβαση επιτρέπεται σε οποιονδήποτε αυθεντικοποιημένο χρήστη.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserEntity currentUser) {
        // Χρησιμοποιούμε τον converter του service για να μετατρέψουμε τον τρέχοντα χρήστη σε DTO
        return ResponseEntity.ok(userService.convertToDto(currentUser));
    }

    /**
     * GET /api/users/{id}
     * Επιστρέφει τις λεπτομέρειες ενός συγκεκριμένου χρήστη.
     * Πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο ADMIN.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findUserById(id));
    }

    /**
     * PUT /api/users/{id}
     * Ενημερώνει τον ρόλο ενός χρήστη.
     * Πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο ADMIN.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDTO> updateUserRole(@PathVariable Long id, @RequestBody UserUpdateDTO userUpdateDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userUpdateDTO));
    }

    /**
     * DELETE /api/users/{id}
     * Διαγράφει έναν χρήστη.
     * Πρόσβαση επιτρέπεται μόνο σε χρήστες με ρόλο ADMIN.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}