package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests για την κλάση AdminService.
 * Χρησιμοποιεί το Mockito για την απομόνωση των εξαρτήσεων (repositories).
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    // Κάνουμε mock τα repositories που χρησιμοποιεί το service.
    // Το Spring θα τα "εισάγει" αυτόματα στο service μας.
    @Mock
    private ShipRepository shipRepository;
    @Mock
    private AisDataRepository aisDataRepository;

    // Το @InjectMocks δημιουργεί μια πραγματική instance του AdminService
    // και εισάγει τα mocks που ορίσαμε παραπάνω μέσα σε αυτό.
    @InjectMocks
    private AdminService adminService;

    private Ship testShip;
    private AisData testAisData;

    // Η μέθοδος @BeforeEach εκτελείται πριν από κάθε test.
    // Είναι ιδανική για να αρχικοποιούμε κοινά αντικείμενα.
    @BeforeEach
    void setUp() {
        testShip = new Ship(1L, 123456789L, ShipType.CARGO);
        testAisData = new AisData();
        testAisData.setMmsi("123456789");
        testAisData.setLatitude(34.0);
        testAisData.setLongitude(25.0);
        testAisData.setSpeedOverGround(10.5);
    }

    /**
     * Test για την μέθοδο updateShipType.
     * Σενάριο: Το πλοίο υπάρχει στη βάση.
     * Αναμένουμε: Να ενημερωθεί ο τύπος του πλοίου και να επιστραφεί το σωστό DTO.
     */
    @Test
    void updateShipType_whenShipExists_shouldUpdateAndReturnDTO() {
        // 1. Ρύθμιση των mocks (Arrangement)
        // Όταν κληθεί το findByMmsi, να επιστρέψει το testShip μας.
        when(shipRepository.findByMmsi(anyLong())).thenReturn(Optional.of(testShip));
        // Όταν κληθεί το save, να επιστρέψει το ίδιο το πλοίο.
        when(shipRepository.save(any(Ship.class))).thenReturn(testShip);

        ShipType newShipType = ShipType.PASSENGER;

        // 2. Εκτέλεση της μεθόδου (Action)
        ShipDetailsDTO result = adminService.updateShipType(123456789L, newShipType);

        // 3. Έλεγχος των αποτελεσμάτων (Assertion)
        assertNotNull(result); // Το αποτέλεσμα δεν πρέπει να είναι null.
        assertEquals(newShipType, result.getShiptype()); // Ο τύπος πρέπει να έχει αλλάξει.
        assertEquals(testShip.getMmsi(), result.getMmsi()); // Το MMSI πρέπει να είναι το σωστό.

        // Έλεγχος ότι οι μέθοδοι των mocks κλήθηκαν σωστά.
        verify(shipRepository, times(1)).findByMmsi(123456789L);
        verify(shipRepository, times(1)).save(any(Ship.class));
    }

    /**
     * Test για την μέθοδο updateShipType.
     * Σενάριο: Το πλοίο ΔΕΝ υπάρχει στη βάση.
     * Αναμένουμε: Να πεταχτεί μια εξαίρεση ResourceNotFoundException.
     */
    @Test
    void updateShipType_whenShipNotFound_shouldThrowResourceNotFoundException() {
        // 1. Ρύθμιση του mock
        // Όταν κληθεί το findByMmsi, να επιστρέψει ένα κενό Optional.
        when(shipRepository.findByMmsi(anyLong())).thenReturn(Optional.empty());

        // 2. & 3. Εκτέλεση και Έλεγχος
        // Χρησιμοποιούμε το assertThrows για να επιβεβαιώσουμε ότι η αναμενόμενη εξαίρεση προκλήθηκε.
        assertThrows(ResourceNotFoundException.class, () -> {
            adminService.updateShipType(999L, ShipType.TUG);
        });

        // Επιβεβαιώνουμε ότι η μέθοδος save δεν κλήθηκε ποτέ.
        verify(shipRepository, never()).save(any(Ship.class));
    }
}