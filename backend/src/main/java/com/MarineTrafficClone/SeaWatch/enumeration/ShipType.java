package com.MarineTrafficClone.SeaWatch.enumeration;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.stream.Stream; // Import Stream

public enum ShipType {
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

    @JsonValue // This is for Jackson serialization/deserialization
    public String getValue() {
        return value;
    }

    // Static method to find Enum by its string value
    public static ShipType fromValue(String value) {
        if (value == null) {
            return null; // Or throw IllegalArgumentException, or return UNKNOWN
        }
        return Stream.of(ShipType.values())
                .filter(st -> st.getValue().equalsIgnoreCase(value.trim())) // Case-insensitive match
                .findFirst()
                .orElse(null); // Return null if not found, or throw new IllegalArgumentException("Unknown ShipType value: " + value)
        // Returning UNKNOWN might be a good default if you prefer: .orElse(ShipType.UNKNOWN);
    }
}