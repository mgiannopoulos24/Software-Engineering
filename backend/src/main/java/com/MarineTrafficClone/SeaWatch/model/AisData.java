package com.MarineTrafficClone.SeaWatch.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Objects;

@Setter
@Getter
@Entity
@Table(name = "ais_data")
public class AisData {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String mmsi; // from sourcemmsi
    private Integer navigationalStatus;
    private Double rateOfTurn;
    private Double speedOverGround;
    private Double courseOverGround;
    private Integer trueHeading; // 511 for "not available"
    private Double longitude; // from lon
    private Double latitude;  // from lat
    private Long timestampEpoch; // from t (the epoch timestamp from CSV)

    public AisData( String mmsi, int navigationalStatus, Double rateOfTurn, double speedOverGround, double courseOverGround, int trueHeading, double latitude, double longitude, Long timestampEpoch) {
        this.mmsi = mmsi;
        this.navigationalStatus = navigationalStatus;
        this.rateOfTurn = rateOfTurn;
        this.speedOverGround = speedOverGround;
        this.courseOverGround = courseOverGround;
        this.trueHeading = trueHeading;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestampEpoch = timestampEpoch;
    }

    // Default constructor
    public AisData() {
    }

    @Override
    public String toString() { // Helpful for logging
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

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        AisData aisData = (AisData) o;
        return Objects.equals(id, aisData.id) && Objects.equals(mmsi, aisData.mmsi) && Objects.equals(navigationalStatus, aisData.navigationalStatus) && Objects.equals(rateOfTurn, aisData.rateOfTurn) && Objects.equals(speedOverGround, aisData.speedOverGround) && Objects.equals(courseOverGround, aisData.courseOverGround) && Objects.equals(trueHeading, aisData.trueHeading) && Objects.equals(longitude, aisData.longitude) && Objects.equals(latitude, aisData.latitude) && Objects.equals(timestampEpoch, aisData.timestampEpoch);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, mmsi, navigationalStatus, rateOfTurn, speedOverGround, courseOverGround, trueHeading, longitude, latitude, timestampEpoch);
    }
}