package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.ZoneConstraintDTO;
import com.MarineTrafficClone.SeaWatch.dto.ZoneOfInterestDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.service.ZoneOfInterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

/**
 * REST Controller για τη διαχείριση της μοναδικής ζώνης ενδιαφέροντος (Zone of Interest)
 * που μπορεί να ορίσει ένας εγγεγραμμένος χρήστης.
 */
@RestController
@RequestMapping("/api/zone")
public class ZoneOfInterestController {

    private final ZoneOfInterestService zoneService;

    @Autowired
    public ZoneOfInterestController(ZoneOfInterestService zoneService) {
        this.zoneService = zoneService;
    }

    /**
     * Endpoint για την ανάκτηση της ζώνης ενδιαφέροντος του τρέχοντος συνδεδεμένου χρήστη.
     *
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity που περιέχει τα δεδομένα της ζώνης (ZoneOfInterestDTO) και status 200 OK,
     *         ή status 404 Not Found αν ο χρήστης δεν έχει ορίσει ζώνη.
     */
    @GetMapping("/mine")
    public ResponseEntity<ZoneOfInterestDTO> getMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        return zoneService.getZoneForUser(currentUser.getId())
                .map(this::convertToDto) // Μετατροπή της οντότητας (Entity) σε DTO.
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Endpoint για τη δημιουργία ή ενημέρωση της ζώνης ενδιαφέροντος του τρέχοντος χρήστη.
     * Η μέθοδος PUT χρησιμοποιείται επειδή η λειτουργία είναι idempotent.
     *
     * @param zoneDetailsDTO Τα δεδομένα της ζώνης (γεωμετρία και περιορισμοί) που αποστέλλονται από τον client.
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity που περιέχει τα δεδομένα της αποθηκευμένης/ενημερωμένης ζώνης και status 200 OK.
     */
    @PutMapping("/mine")
    public ResponseEntity<ZoneOfInterestDTO> createOrUpdateMyZone(@RequestBody ZoneOfInterestDTO zoneDetailsDTO, @AuthenticationPrincipal UserEntity currentUser) {
        ZoneOfInterest updatedZone = zoneService.createOrUpdateZone(zoneDetailsDTO, currentUser);
        return ResponseEntity.ok(convertToDto(updatedZone));
    }

    /**
     * Endpoint για τη διαγραφή της ζώνης ενδιαφέροντος του τρέχοντος χρήστη.
     *
     * @param currentUser Ο τρέχων αυθεντικοποιημένος χρήστης.
     * @return Ένα ResponseEntity χωρίς περιεχόμενο (noContent) και status 204.
     */
    @DeleteMapping("/mine")
    public ResponseEntity<Void> deleteMyZone(@AuthenticationPrincipal UserEntity currentUser) {
        zoneService.deleteZoneForUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Βοηθητική μέθοδος για τη μετατροπή ενός αντικειμένου ZoneOfInterest (Entity)
     * σε ένα αντικείμενο ZoneOfInterestDTO.
     *
     * @param zone Η οντότητα ZoneOfInterest από τη βάση δεδομένων.
     * @return Το αντίστοιχο Data Transfer Object (DTO).
     */
    private ZoneOfInterestDTO convertToDto(ZoneOfInterest zone) {
        ZoneOfInterestDTO dto = new ZoneOfInterestDTO();
        dto.setId(zone.getId());
        dto.setName(zone.getName());
        dto.setCenterLatitude(zone.getCenterLatitude());
        dto.setCenterLongitude(zone.getCenterLongitude());
        dto.setRadiusInMeters(zone.getRadiusInMeters());
        // Μετατροπή και της λίστας των περιορισμών (ZoneConstraint) σε λίστα από DTOs.
        dto.setConstraints(zone.getConstraints().stream().map(c -> {
            ZoneConstraintDTO cDto = new ZoneConstraintDTO();
            cDto.setId(c.getId());
            cDto.setConstraintType(c.getConstraintType());
            cDto.setConstraintValue(c.getConstraintValue());
            return cDto;
        }).collect(Collectors.toList()));
        return dto;
    }
}