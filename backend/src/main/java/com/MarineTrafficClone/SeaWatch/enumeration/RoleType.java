package com.MarineTrafficClone.SeaWatch.enumeration;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Enumeration που ορίζει τους διαθέσιμους ρόλους χρηστών στο σύστημα.
 * Οι ρόλοι χρησιμοποιούνται από το Spring Security για τον έλεγχο πρόσβασης (authorization).
 */
public enum RoleType {
    ADMIN("admin"),          // Διαχειριστής με πλήρη δικαιώματα.
    REGISTERED("registered");// Εγγεγραμμένος χρήστης με αυξημένα δικαιώματα σε σχέση με τον ανώνυμο.

    private final String value;

    RoleType(String value) {
        this.value = value;
    }

    /**
     * Το annotation @JsonValue υποδεικνύει στον Jackson (τη βιβλιοθήκη για JSON)
     * να χρησιμοποιεί την τιμή αυτής της μεθόδου (π.χ., "admin") κατά τη μετατροπή (serialization)
     * του enum σε JSON, αντί για το όνομα του enum (π.χ., "ADMIN").
     * @return Η string τιμή του ρόλου.
     */
    @JsonValue
    public String getValue() {
        return value;
    }
}