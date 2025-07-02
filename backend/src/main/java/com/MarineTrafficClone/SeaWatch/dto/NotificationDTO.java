package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Instant timestamp;
    private String message;
    private Long zoneId;
    private String zoneName;
}