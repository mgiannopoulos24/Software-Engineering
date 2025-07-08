package com.MarineTrafficClone.SeaWatch.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

/**
 * Οντότητα (Entity) που αναπαριστά μια μεμονωμένη εγγραφή δυναμικών δεδομένων AIS (Automatic Identification System).
 * Κάθε αντικείμενο αυτής της κλάσης αντιστοιχεί σε μια γραμμή στον πίνακα `ais_data` της βάσης δεδομένων
 * και περιέχει πληροφορίες για τη θέση, την ταχύτητα και την πορεία ενός πλοίου σε μια συγκεκριμένη χρονική στιγμή.
 */
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ais_data", indexes = {
        @Index(name = "idx_aisdata_mmsi_timestamp", columnList = "mmsi, timestampEpoch DESC")
})
public class AisData {

    @Id // Ορίζει αυτό το πεδίο ως το πρωτεύον κλειδί (primary key).
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Η τιμή του θα δημιουργείται αυτόματα από τη βάση.
    private Long id;

    private String mmsi; // Το MMSI του πλοίου.
    private Integer navigationalStatus; // Η ναυτιλιακή κατάσταση.
    private Double rateOfTurn; // Ο ρυθμός στροφής.
    private Double speedOverGround; // Η ταχύτητα πάνω από το έδαφος.
    private Double courseOverGround; // Η πορεία πάνω από το έδαφος.
    private Integer trueHeading; // Η πραγματική κατεύθυνση (511 σημαίνει "not available").
    private Double longitude; // Το γεωγραφικό μήκος.
    private Double latitude;  // Το γεωγραφικό πλάτος.
    private Long timestampEpoch; // Η χρονοσφραγίδα της μέτρησης (σε epoch seconds).


    /**
     * Μέθοδος toString για εύκολη εκτύπωση και logging των αντικειμένων.
     */
    @Override
    public String toString() {
        return "AisData{" +
                "id=" + id +
                ", mmsi='" + mmsi + '\'' +
                ", navigationalStatus=" + navigationalStatus +
                ", rateOfTurn=" + rateOfTurn +
                ", speedOverGround=" + speedOverGround +
                ", courseOverGround=" + courseOverGround +
                ", trueHeading=" + trueHeading +
                ", longitude=" + longitude +
                ", latitude=" + latitude +
                ", timestampEpoch=" + timestampEpoch +
                '}';
    }

    /**
     * Override της μεθόδου equals για σωστή σύγκριση αντικειμένων.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true; // Βελτιστοποίηση: αν είναι το ίδιο αντικείμενο στη μνήμη.
        if (o == null || getClass() != o.getClass()) return false;
        AisData aisData = (AisData) o;
        return Objects.equals(id, aisData.id) && Objects.equals(mmsi, aisData.mmsi) && Objects.equals(navigationalStatus, aisData.navigationalStatus) && Objects.equals(rateOfTurn, aisData.rateOfTurn) && Objects.equals(speedOverGround, aisData.speedOverGround) && Objects.equals(courseOverGround, aisData.courseOverGround) && Objects.equals(trueHeading, aisData.trueHeading) && Objects.equals(longitude, aisData.longitude) && Objects.equals(latitude, aisData.latitude) && Objects.equals(timestampEpoch, aisData.timestampEpoch);
    }

    /**
     * Override της μεθόδου hashCode. Πρέπει πάντα να γίνεται override μαζί με την equals.
     */
    @Override
    public int hashCode() {
        return Objects.hash(id, mmsi, navigationalStatus, rateOfTurn, speedOverGround, courseOverGround, trueHeading, longitude, latitude, timestampEpoch);
    }
}