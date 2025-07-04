package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ZoneOfInterestDTO;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.model.ZoneConstraint;
import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import com.MarineTrafficClone.SeaWatch.repository.ZoneOfInterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service που περιέχει την επιχειρησιακή λογική (business logic)
 * για τη διαχείριση των ζωνών ενδιαφέροντος (Zones of Interest).
 */
@Service
public class ZoneOfInterestService {

    private final ZoneOfInterestRepository zoneRepository;
    private final ZoneOfInterestCacheService zoneCacheService;

    @Autowired
    public ZoneOfInterestService(ZoneOfInterestRepository zoneRepository,  ZoneOfInterestCacheService zoneCacheService) {
        this.zoneRepository = zoneRepository;
        this.zoneCacheService = zoneCacheService;
    }

    /**
     * Ανακτά τη ζώνη ενδιαφέροντος ενός χρήστη από τη βάση δεδομένων.
     * @param userId Το ID του χρήστη.
     * @return Ένα Optional που περιέχει τη ζώνη αν υπάρχει.
     */
    @Transactional(readOnly = true)
    public Optional<ZoneOfInterest> getZoneForUser(Long userId) {
        return zoneRepository.findByUserId(userId);
    }

    /**
     * Δημιουργεί μια νέα ζώνη ενδιαφέροντος ή ενημερώνει την υπάρχουσα για έναν χρήστη.
     * @param zoneDTO Τα δεδομένα της ζώνης (γεωμετρία και περιορισμοί) από τον client.
     * @param currentUser Ο συνδεδεμένος χρήστης.
     * @return Η αποθηκευμένη/ενημερωμένη οντότητα ZoneOfInterest.
     */
    @Transactional
    public ZoneOfInterest createOrUpdateZone(ZoneOfInterestDTO zoneDTO, UserEntity currentUser) {
        // Προσπάθησε να βρεις την υπάρχουσα ζώνη του χρήστη.
        ZoneOfInterest zone = zoneRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    // Αν δεν υπάρχει, δημιούργησε μια νέα και σύνδεσέ την με τον χρήστη.
                    ZoneOfInterest newZone = new ZoneOfInterest();
                    newZone.setUser(currentUser);
                    return newZone;
                });

        // Ενημέρωση των βασικών πεδίων της ζώνης.
        zone.setName(zoneDTO.getName());
        zone.setCenterLatitude(zoneDTO.getCenterLatitude());
        zone.setCenterLongitude(zoneDTO.getCenterLongitude());
        zone.setRadiusInMeters(zoneDTO.getRadiusInMeters());

        // Ενημέρωση της λίστας των περιορισμών.
        // Μετατρέπουμε τα DTOs των περιορισμών σε οντότητες ZoneConstraint.
        List<ZoneConstraint> newConstraints = zoneDTO.getConstraints().stream()
                .map(dto -> {
                    ZoneConstraint constraint = new ZoneConstraint();
                    constraint.setConstraintType(dto.getConstraintType());
                    constraint.setConstraintValue(dto.getConstraintValue());
                    // Η σύνδεση με τη ζώνη (constraint.setZoneOfInterest(zone)) θα γίνει
                    // μέσα στη βοηθητική μέθοδο zone.setConstraints().
                    return constraint;
                }).collect(Collectors.toList());

        // Χρησιμοποιούμε τη βοηθητική μέθοδο για να διαχειριστούμε σωστά τη σχέση OneToMany.
        zone.setConstraints(newConstraints);

        // Αποθήκευση της ζώνης (και των περιορισμών της, λόγω του CascadeType.ALL).
        ZoneOfInterest savedZone = zoneRepository.save(zone);
        // Ενημέρωση της cache.
        zoneCacheService.addOrUpdateZone(savedZone);
        return savedZone;
    }

    /**
     * Διαγράφει τη ζώνη ενδιαφέροντος ενός χρήστη.
     * @param userId Το ID του χρήστη του οποίου η ζώνη θα διαγραφεί.
     */
    @Transactional
    public void deleteZoneForUser(Long userId) {
        Optional<ZoneOfInterest> zoneOpt = zoneRepository.findByUserId(userId);
        if (zoneOpt.isPresent()) {
            ZoneOfInterest zoneToDelete = zoneOpt.get();
            zoneRepository.delete(zoneToDelete); // Διαγραφή από τη βάση.
            zoneCacheService.removeZone(zoneToDelete.getId()); // Αφαίρεση από την cache.
            System.out.println("Deleted zone of interest for user ID: " + userId);
        } else {
            System.out.println("User " + userId + " had no zone of interest to delete.");
        }
    }
}