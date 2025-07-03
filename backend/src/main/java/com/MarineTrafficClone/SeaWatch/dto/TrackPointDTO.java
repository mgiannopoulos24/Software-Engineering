package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO που αναπαριστά ένα και μόνο σημείο στην ιστορική πορεία ενός πλοίου.
 * Περιέχει μόνο τις απολύτως απαραίτητες πληροφορίες.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackPointDTO {
    private double latitude;
    private double longitude;
    private long timestampEpoch;
}