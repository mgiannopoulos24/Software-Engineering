package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Data Transfer Object (DTO) για την αναπαράσταση μιας ζώνης ενδιαφέροντος (Zone of Interest).
 * Χρησιμοποιείται για την επικοινωνία μεταξύ frontend και backend, μεταφέροντας τόσο
 * τα γεωμετρικά χαρακτηριστικά της ζώνης όσο και τους περιορισμούς που ισχύουν σε αυτήν.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneOfInterestDTO {
    /** Το μοναδικό αναγνωριστικό (ID) της ζώνης. */
    private Long id;

    /** Το όνομα που δίνει ο χρήστης στη ζώνη. */
    private String name;

    /** Το γεωγραφικό πλάτος (latitude) του κέντρου της ζώνης. */
    private Double centerLatitude;

    /** Το γεωγραφικό μήκος (longitude) του κέντρου της ζώνης. */
    private Double centerLongitude;

    /** Η ακτίνα της ζώνης σε μέτρα. */
    private Double radiusInMeters;

    /** Μια λίστα με τους περιορισμούς (constraints) που ισχύουν για αυτή τη ζώνη. */
    private List<ZoneConstraintDTO> constraints;
}