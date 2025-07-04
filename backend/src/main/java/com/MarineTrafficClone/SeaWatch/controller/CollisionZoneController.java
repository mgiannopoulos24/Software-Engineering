package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.CollisionZoneDTO;
import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.service.CollisionZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller για τη διαχείριση της μοναδικής ζώνης παρακολούθησης συγκρούσεων (Collision Zone)
 * που μπορεί να ορίσει ένας εγγεγραμμένος χρήστης.
 */
@RestController
@RequestMapping("/api/collision-zone") // Βασικό URL path για τις ζώνες σύγκρουσης.
public class CollisionZoneController {

    private final CollisionZoneService collisionZoneService;

    @Autowired
    public CollisionZoneController(CollisionZoneService collisionZoneService) {
        this.collisionZoneService = collisionZoneService;
    }

    /**
     * Endpoint για την ανάκτηση της ζώνης σύγκρουσης του τρέχοντος συνδεδεμένου χρήστη.
     *
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης, παρέχεται αυτόματα από το Spring Security.
     * @return Ένα ResponseEntity που περιέχει τα δεδομένα της ζώνης (CollisionZoneDTO) και status 200 OK,
     *         ή status 404 Not Found αν ο χρήστης δεν έχει ορίσει ζώνη.
     */
    @GetMapping("/mine")
    public ResponseEntity<CollisionZoneDTO> getMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        return collisionZoneService.getZoneForUser(currentUser.getId())
                .map(this::convertToDto) // Μετατροπή της οντότητας (Entity) σε DTO.
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Endpoint για τη δημιουργία ή ενημέρωση της ζώνης σύγκρουσης του τρέχοντος χρήστη.
     * Η μέθοδος PUT χρησιμοποιείται εδώ επειδή η λειτουργία είναι idempotent:
     * το να στέλνεις τα ίδια δεδομένα πολλές φορές έχει το ίδιο τελικό αποτέλεσμα.
     *
     * @param zoneDetailsDTO Τα δεδομένα της ζώνης που αποστέλλονται από τον client.
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity που περιέχει τα δεδομένα της αποθηκευμένης/ενημερωμένης ζώνης και status 200 OK.
     */
    @PutMapping("/mine")
    public ResponseEntity<CollisionZoneDTO> createOrUpdateMyZone(@RequestBody CollisionZoneDTO zoneDetailsDTO, @AuthenticationPrincipal UserEntity currentUser) {
        CollisionZone updatedZone = collisionZoneService.createOrUpdateZone(zoneDetailsDTO, currentUser);
        return ResponseEntity.ok(convertToDto(updatedZone));
    }

    /**
     * Endpoint για τη διαγραφή της ζώνης σύγκρουσης του τρέχοντος χρήστη.
     *
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity χωρίς περιεχόμενο (noContent) και status 204.
     */
    @DeleteMapping("/mine")
    public ResponseEntity<Void> deleteMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        collisionZoneService.deleteZoneForUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Βοηθητική (helper) μέθοδος για τη μετατροπή ενός αντικειμένου CollisionZone (Entity)
     * σε ένα αντικείμενο CollisionZoneDTO. Αυτό γίνεται για να αποστέλλονται στον client
     * μόνο τα απαραίτητα δεδομένα και όχι ολόκληρη η οντότητα της βάσης.
     *
     * @param zone Η οντότητα CollisionZone από τη βάση δεδομένων.
     * @return Το αντίστοιχο Data Transfer Object (DTO).
     */
    private CollisionZoneDTO convertToDto(CollisionZone zone) {
        CollisionZoneDTO dto = new CollisionZoneDTO();
        dto.setId(zone.getId());
        dto.setName(zone.getName());
        dto.setCenterLatitude(zone.getCenterLatitude());
        dto.setCenterLongitude(zone.getCenterLongitude());
        dto.setRadiusInMeters(zone.getRadiusInMeters());
        return dto;
    }
}