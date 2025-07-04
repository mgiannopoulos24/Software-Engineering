package com.MarineTrafficClone.SeaWatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) για την αναπαράσταση μιας ζώνης παρακολούθησης συγκρούσεων (Collision Zone).
 * Χρησιμοποιείται για την επικοινωνία μεταξύ του frontend και του backend
 * για τη δημιουργία, ενημέρωση και προβολή των ζωνών αυτών.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollisionZoneDTO {
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
}