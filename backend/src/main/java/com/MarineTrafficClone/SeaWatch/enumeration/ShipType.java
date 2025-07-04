package com.MarineTrafficClone.SeaWatch.enumeration;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.stream.Stream;

/**
 * Enumeration που ορίζει τους διάφορους τύπους πλοίων που υποστηρίζει το σύστημα.
 * Οι τιμές αντιστοιχούν σε αυτές που παρέχονται στο στατικό αρχείο δεδομένων.
 */
public enum ShipType {
    // Ορισμός όλων των πιθανών τύπων πλοίων με την αντίστοιχη string τιμή τους.
    ANTI_POLLUTION("anti-pollution"),
    CARGO("cargo"),
    CARGO_HAZARDAMAJOR("cargo-hazarda(major)"),
    CARGO_HAZARDB("cargo-hazardb"),
    CARGO_HAZARDCMINOR("cargo-hazardc(minor)"),
    CARGO_HAZARDDRECOGNIZABLE("cargo-hazardd(recognizable)"),
    DIVEVESSEL("divevessel"),
    DREDGER("dredger"),
    FISHING("fishing"),
    HIGH_SPEEDCRAFT("high-speedcraft"),
    LAWENFORCE("lawenforce"),
    LOCALVESSEL("localvessel"),
    MILITARYOPS("militaryops"),
    OTHER("other"),
    PASSENGER("passenger"),
    PILOTVESSEL("pilotvessel"),
    PLEASURECRAFT("pleasurecraft"),
    SAILINGVESSEL("sailingvessel"),
    SAR("sar"),
    SPECIALCRAFT("specialcraft"),
    TANKER("tanker"),
    TANKER_HAZARDAMAJOR("tanker-hazarda(major)"),
    TANKER_HAZARDB("tanker-hazardb"),
    TANKER_HAZARDCMINOR("tanker-hazardc(minor)"),
    TANKER_HAZARDDRECOGNIZABLE("tanker-hazardd(recognizable)"),
    TUG("tug"),
    UNKNOWN("unknown"),
    WINGINGRND("wingingrnd");

    private final String value;

    ShipType(String value) {
        this.value = value;
    }

    /**
     * Το @JsonValue λέει στον Jackson να χρησιμοποιεί αυτή την τιμή κατά τη μετατροπή σε JSON.
     * @return Η string τιμή του τύπου πλοίου.
     */
    @JsonValue
    public String getValue() {
        return value;
    }

    /**
     * Στατική μέθοδος (static method) που βρίσκει το αντίστοιχο enum ShipType από τη string τιμή του.
     * Είναι πολύ χρήσιμη κατά την ανάγνωση δεδομένων από αρχεία CSV ή από JSON αιτήματα,
     * όπου ο τύπος του πλοίου δίνεται ως string.
     *
     * @param value Η string τιμή προς αναζήτηση (π.χ., "cargo").
     * @return Το αντίστοιχο enum ShipType, ή null αν δεν βρεθεί.
     */
    public static ShipType fromValue(String value) {
        if (value == null) {
            return null;
        }
        // Ψάχνει σε όλα τα enums, αγνοώντας την πεζότητα (case-insensitive) και τα κενά στην αρχή/τέλος.
        return Stream.of(ShipType.values())
                .filter(st -> st.getValue().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElse(ShipType.UNKNOWN); // Επιστρέφει ShipType.UNKNOWN αν δεν βρεθεί.
    }
}