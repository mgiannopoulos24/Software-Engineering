package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.UserDTO;
import com.MarineTrafficClone.SeaWatch.dto.UserUpdateDTO;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Autowired
    public UserService(UserEntityRepository userRepository) {
        this.userRepository = userRepository;
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