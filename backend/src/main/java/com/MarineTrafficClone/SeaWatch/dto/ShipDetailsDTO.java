package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShipDetailsDTO {
    // Στατικά δεδομένα
    private Long mmsi;
    private ShipType shiptype;

    // Τελευταία δυναμικά δεδομένα
    private Integer navigationalStatus;
    private Double rateOfTurn;
    private Double speedOverGround;
    private Double courseOverGround;
    private Integer trueHeading;
    private Double longitude;
    private Double latitude;
    private Long lastUpdateTimestampEpoch; // Πότε ενημερώθηκε τελευταία φορά
}
