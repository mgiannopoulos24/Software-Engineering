package com.MarineTrafficClone.SeaWatch.enumeration;

public enum ZoneConstraintType {
    SPEED_LIMIT_ABOVE,   // Alert if speed > value
    SPEED_LIMIT_BELOW,   // Alert if speed < value
    ZONE_ENTRY,          // Alert when a ship enters the zone
    ZONE_EXIT,           // Alert when a ship that was inside, leaves

    FORBIDDEN_SHIP_TYPE, // Alert if a specific ship type is present
    UNWANTED_NAV_STATUS  // Alert if a ship has a specific navigational status
}