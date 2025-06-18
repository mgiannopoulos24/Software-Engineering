package com.MarineTrafficClone.SeaWatch.enumeration;

import com.fasterxml.jackson.annotation.JsonValue;

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

    @JsonValue
    public String getValue() {
        return value;
    }
}
