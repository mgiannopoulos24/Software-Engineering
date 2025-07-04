package com.MarineTrafficClone.SeaWatch.exception;

/**
 * Μια προσαρμοσμένη (custom) RuntimeException που χρησιμοποιείται σε όλη την εφαρμογή
 * για να σηματοδοτήσει ότι ένας συγκεκριμένος πόρος (resource) δεν βρέθηκε.
 * Για παράδειγμα, μπορεί να προκληθεί (thrown) όταν γίνεται αναζήτηση ενός χρήστη
 * με ένα ID που δεν υπάρχει στη βάση δεδομένων.
 * Η διαχείρισή της γίνεται κεντρικά από το {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

  /**
   * Constructor που δέχεται ένα μήνυμα σφάλματος.
   * @param message Το μήνυμα που περιγράφει το σφάλμα (π.χ., "User not found with id: 123").
   */
  public ResourceNotFoundException(String message) {
    super(message);
  }
}