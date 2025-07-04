package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) για την αποστολή εμπλουτισμένων δεδομένων
 * πλοίων σε πραγματικό χρόνο μέσω WebSocket.
 * Αυτό το DTO συνδυάζει δυναμικά δεδομένα από το AIS (όπως θέση, ταχύτητα)
 * με στατικά δεδομένα του πλοίου (όπως ο τύπος του).
 * Στέλνεται σε όλους τους clients (broadcast) και στους χρήστες για τον στόλο τους.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RealTimeShipUpdateDTO {

    /** Το MMSI του πλοίου. */
    private String mmsi;
    /** Η ταχύτητα του πλοίου πάνω από το έδαφος (Speed Over Ground - SOG), σε κόμβους. */
    private Double speedOverGround;
    /** Η πορεία του πλοίου πάνω από το έδαφος (Course Over Ground - COG), σε μοίρες. */
    private Double courseOverGround;
    /** Το γεωγραφικό μήκος (longitude). */
    private Double longitude;
    /** Το γεωγραφικό πλάτος (latitude). */
    private Double latitude;
    /** Η χρονοσφραγίδα της μέτρησης σε μορφή Unix epoch (δευτερόλεπτα). */
    private Long timestampEpoch;
    /** Ο κωδικός της ναυτιλιακής κατάστασης (Navigational Status). */
    private Integer navigationalStatus;
    /** Η πραγματική κατεύθυνση (True Heading), σε μοίρες. Χρήσιμο για τον προσανατολισμό του εικονιδίου στον χάρτη. */
    private Integer trueHeading;

    /** Ο τύπος του πλοίου (π.χ., Cargo, Tanker). */
    private ShipType shiptype;
}