package marinemap.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.format.annotation.DateTimeFormat;

@Setter
@Getter
@Entity
@Table(name = "ais_data")
public class AisData {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mmsi;
    private double latitude;
    private double longitude;
    private double speedOverGround;
    private double courseOverGround;

//    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
//    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private String timestamp;

    public AisData( String mmsi, double latitude, double longitude, double speedOverGround, double courseOverGround, String timestamp) {
        this.mmsi = mmsi;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speedOverGround = speedOverGround;
        this.courseOverGround = courseOverGround;
        this.timestamp = timestamp;
    }

    //
    public AisData() {
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

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        AisData aisData = (AisData) o;
        return Double.compare(latitude, aisData.latitude) == 0 && Double.compare(longitude, aisData.longitude) == 0 && Double.compare(speedOverGround, aisData.speedOverGround) == 0 && Double.compare(courseOverGround, aisData.courseOverGround) == 0 && Objects.equals(id, aisData.id) && Objects.equals(mmsi, aisData.mmsi) && Objects.equals(timestamp, aisData.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, mmsi, latitude, longitude, speedOverGround, courseOverGround, timestamp);
    }
}