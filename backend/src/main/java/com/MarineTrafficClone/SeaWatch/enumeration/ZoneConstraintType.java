package com.MarineTrafficClone.SeaWatch.enumeration;

public enum ZoneConstraintType {
    SPEED_LIMIT_ABOVE,   // Alert if speed > value
    SPEED_LIMIT_BELOW,   // Alert if speed < value
    ZONE_ENTRY,          // Alert when a ship enters the zone
    ZONE_EXIT            // Alert when a ship that was inside, leaves
}