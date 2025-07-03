package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ZoneConstraintType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneConstraintDTO {
    private Long id; // Χρήσιμο για updates/deletes στο frontend
    private ZoneConstraintType type;
    private String value;
}