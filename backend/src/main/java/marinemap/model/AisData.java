package marinemap.model; 

import jakarta.persistence.*;

@Entity
@Table(name = "ais_data")
public class AisData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mmsi;             // Maritime Mobile Service Identity
    private double latitude; 
    private double longitude;
    private double speedOverGround;
    private double courseOverGround;
    private String timestamp;        // Should change to proper Timestamp type

    // Getters and setters, constructors, etc.
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMmsi() {
        return mmsi;
    }

    public void setMmsi(String mmsi) {
        this.mmsi = mmsi;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getSpeedOverGround() {
        return speedOverGround;
    }

    public void setSpeedOverGround(double speedOverGround) {
        this.speedOverGround = speedOverGround;
    }

    public double getCourseOverGround() {
        return courseOverGround;
    }

    public void setCourseOverGround(double courseOverGround) {
        this.courseOverGround = courseOverGround;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "AisData{" +
               "id=" + id +
               ", mmsi='" + mmsi + '\'' +
               ", latitude=" + latitude +
               ", longitude=" + longitude +
               ", speedOverGround=" + speedOverGround +
               ", courseOverGround=" + courseOverGround +
               ", timestamp='" + timestamp + '\'' +
               '}';
    }
}