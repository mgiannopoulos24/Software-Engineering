package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) που αναπαριστά τις πλήρεις λεπτομέρειες ενός πλοίου.
 * Συνδυάζει τα στατικά δεδομένα του πλοίου (που αλλάζουν σπάνια) με
 * τα πιο πρόσφατα δυναμικά δεδομένα του από το σύστημα AIS.
 * Χρησιμοποιείται για την αρχική φόρτωση του χάρτη και για την προβολή λεπτομερειών κατ' απαίτηση.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShipDetailsDTO {
    // Στατικά δεδομένα (Static Data)
    /** Το MMSI του πλοίου, που είναι ο μοναδικός του αναγνωριστικός αριθμός. */
    private Long mmsi;
    /** Ο τύπος του πλοίου (π.χ., Cargo, Tanker, Passenger). */
    private ShipType shiptype;

    // Τελευταία δυναμικά δεδομένα (Latest Dynamic Data from AIS)
    /** Ο κωδικός της ναυτιλιακής κατάστασης (π.χ., under way, at anchor). */
    private Integer navigationalStatus;
    /** Ο ρυθμός στροφής (Rate of Turn). */
    private Double rateOfTurn;
    /** Η ταχύτητα πάνω από το έδαφος (Speed Over Ground). */
    private Double speedOverGround;
    /** Η πορεία πάνω από το έδαφος (Course Over Ground). */
    private Double courseOverGround;
    /** Η πραγματική κατεύθυνση της πλώρης (True Heading). */
    private Integer trueHeading;
    /** Το τελευταίο γνωστό γεωγραφικό μήκος (longitude). */
    private Double longitude;
    /** Το τελευταίο γνωστό γεωγραφικό πλάτος (latitude). */
    private Double latitude;
    /** Η χρονοσφραγίδα (Unix epoch) της τελευταίας ενημέρωσης των δυναμικών δεδομένων. */
    private Long lastUpdateTimestampEpoch;
}