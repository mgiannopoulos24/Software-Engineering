package com.MarineTrafficClone.SeaWatch.enumeration;

import com.fasterxml.jackson.annotation.JsonValue;

public enum RoleType {
    ADMIN("admin"),
    REGISTERED("registered"),
    ANONYMOUS("anonymous");

    private final String value;

    RoleType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
