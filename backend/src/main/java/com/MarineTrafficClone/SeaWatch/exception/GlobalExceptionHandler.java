package com.MarineTrafficClone.SeaWatch.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Κεντρικός διαχειριστής εξαιρέσεων (Global Exception Handler) για ολόκληρη την εφαρμογή.
 * Το @ControllerAdvice επιτρέπει σε αυτή την κλάση να "παρακολουθεί" για εξαιρέσεις
 * που συμβαίνουν σε οποιονδήποτε Controller.
 * Αυτό μας επιτρέπει να έχουμε ένα συνεπές και καθαρό format για τις απαντήσεις σφάλματος (error responses).
 */
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /**
     * Διαχειρίζεται την εξαίρεση {@link ResourceNotFoundException}.
     * Αυτή η εξαίρεση προκαλείται όταν ένας πόρος (π.χ., χρήστης, πλοίο) δεν βρεθεί στη βάση δεδομένων.
     *
     * @param ex Η εξαίρεση που συνέβη.
     * @param request Το web request κατά το οποίο συνέβη η εξαίρεση.
     * @return Ένα ResponseEntity με status 404 NOT_FOUND και ένα σώμα JSON που περιγράφει το σφάλμα.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());
        body.put("path", request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Διαχειρίζεται την εξαίρεση {@link DataIntegrityViolationException}.
     * Αυτή συνήθως προκαλείται από παραβιάσεις περιορισμών της βάσης δεδομένων,
     * όπως η προσπάθεια εγγραφής ενός χρήστη με email που υπάρχει ήδη (unique constraint violation).
     *
     * @param ex Η εξαίρεση που συνέβη.
     * @param request Το web request.
     * @return Ένα ResponseEntity με status 409 CONFLICT και ένα φιλικό μήνυμα σφάλματος.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Conflict");
        // Ένα πιο φιλικό μήνυμα αντί για το τεχνικό σφάλμα της βάσης.
        body.put("message", "A resource with the same unique identifier already exists. (e.g., email already registered)");
        body.put("path", request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(body, HttpStatus.CONFLICT); // 409 Conflict
    }

    /**
     * Κάνει override την προεπιλεγμένη διαχείριση για τα σφάλματα επικύρωσης (validation errors).
     * Αυτή η μέθοδος καλείται όταν ένα DTO με annotations επικύρωσης (π.χ., @NotNull, @Valid)
     * αποτυγχάνει στην επικύρωση.
     *
     * @return Ένα ResponseEntity με status 400 BAD_REQUEST και ένα σώμα JSON που περιέχει
     *         λεπτομερή σφάλματα για κάθε πεδίο που απέτυχε.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());

        // Συγκεντρώνει όλα τα σφάλματα επικύρωσης σε ένα πιο ευανάγνωστο format (πεδίο -> μήνυμα σφάλματος).
        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));

        body.put("errors", errors);

        return new ResponseEntity<>(body, headers, status); // 400 Bad Request
    }
}