package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO για την αποστολή εμπλουτισμένων δεδομένων
 * πλοίων σε πραγματικό χρόνο μέσω WebSocket.
 * Συνδυάζει δυναμικά δεδομένα από το AIS και στατικά δεδομένα του πλοίου.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RealTimeShipUpdateDTO {

    private String mmsi;
    private Double speedOverGround;
    private Double courseOverGround;
    private Double longitude;
    private Double latitude;
    private Long timestampEpoch;
    private Integer navigationalStatus;
    // Πρόσθεσα και το trueHeading γιατί μπορεί να φανεί χρήσιμο για τον προσανατολισμό του εικονιδίου
    private Integer trueHeading;

    private ShipType shiptype;
}