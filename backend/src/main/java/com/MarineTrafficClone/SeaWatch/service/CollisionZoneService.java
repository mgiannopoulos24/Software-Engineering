package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.CollisionZoneDTO;
import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.CollisionZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service που περιέχει την επιχειρησιακή λογική (business logic)
 * για τη διαχείριση των ζωνών παρακολούθησης συγκρούσεων (Collision Zones).
 */
@Service
public class CollisionZoneService {

    private final CollisionZoneRepository collisionZoneRepository;
    private final CollisionZoneCacheService collisionZoneCacheService; // Service για τη διαχείριση της cache.

    @Autowired
    public CollisionZoneService(CollisionZoneRepository collisionZoneRepository,  CollisionZoneCacheService collisionZoneCacheService) {
        this.collisionZoneRepository = collisionZoneRepository;
        this.collisionZoneCacheService = collisionZoneCacheService;
    }

    /**
     * Ανακτά τη ζώνη σύγκρουσης ενός χρήστη από τη βάση δεδομένων.
     * @param userId Το ID του χρήστη.
     * @return Ένα Optional που περιέχει τη ζώνη αν υπάρχει.
     */
    @Transactional(readOnly = true)
    public Optional<CollisionZone> getZoneForUser(Long userId) {
        return collisionZoneRepository.findByUserId(userId);
    }

    /**
     * Δημιουργεί μια νέα ζώνη σύγκρουσης ή ενημερώνει την υπάρχουσα για έναν χρήστη.
     * Η λειτουργία είναι transactional, εξασφαλίζοντας ότι η αποθήκευση στη βάση
     * και η ενημέρωση της cache θα γίνουν ατομικά.
     *
     * @param zoneDTO Τα δεδομένα της ζώνης από τον client.
     * @param currentUser Ο συνδεδεμένος χρήστης.
     * @return Η αποθηκευμένη/ενημερωμένη οντότητα CollisionZone.
     */
    @Transactional
    public CollisionZone createOrUpdateZone(CollisionZoneDTO zoneDTO, UserEntity currentUser) {
        // Προσπάθησε να βρεις την υπάρχουσα ζώνη του χρήστη.
        CollisionZone zone = collisionZoneRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    // Αν δεν υπάρχει, δημιούργησε μια νέα και σύνδεσέ την με τον χρήστη.
                    CollisionZone newZone = new CollisionZone();
                    newZone.setUser(currentUser);
                    return newZone;
                });

        // Ενημέρωση των πεδίων της ζώνης με τα νέα δεδομένα από το DTO.
        zone.setName(zoneDTO.getName());
        zone.setCenterLatitude(zoneDTO.getCenterLatitude());
        zone.setCenterLongitude(zoneDTO.getCenterLongitude());
        zone.setRadiusInMeters(zoneDTO.getRadiusInMeters());

        // Αποθήκευση της ζώνης στη βάση δεδομένων.
        CollisionZone savedZone = collisionZoneRepository.save(zone);
        // Ενημέρωση της cache με την νέα/ενημερωμένη ζώνη.
        collisionZoneCacheService.addOrUpdateZone(savedZone);
        return savedZone;
    }

    /**
     * Διαγράφει τη ζώνη σύγκρουσης ενός χρήστη.
     * @param userId Το ID του χρήστη του οποίου η ζώνη θα διαγραφεί.
     */
    @Transactional
    public void deleteZoneForUser(Long userId) {
        // Βρίσκουμε πρώτα τη ζώνη για να πάρουμε το ID της, ώστε να την αφαιρέσουμε από την cache.
        Optional<CollisionZone> zoneOpt = collisionZoneRepository.findByUserId(userId);
        if (zoneOpt.isPresent()) {
            CollisionZone zoneToDelete = zoneOpt.get();
            collisionZoneRepository.delete(zoneToDelete); // Διαγραφή από τη βάση.
            collisionZoneCacheService.removeZone(zoneToDelete.getId()); // Αφαίρεση από την cache.
            System.out.println("Deleted collision zone for user ID: " + userId);
        } else {
            System.out.println("User " + userId + " had no collision zone to delete.");
        }
    }
}