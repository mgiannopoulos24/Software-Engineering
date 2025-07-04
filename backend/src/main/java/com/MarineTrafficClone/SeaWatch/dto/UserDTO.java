package com.MarineTrafficClone.SeaWatch.dto;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) για την αναπαράσταση των πληροφοριών ενός χρήστη.
 * Χρησιμοποιείται για την αποστολή δεδομένων χρήστη από τον server στον client,
 * αποκρύπτοντας ευαίσθητες πληροφορίες όπως ο κωδικός πρόσβασης.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    /** Το μοναδικό αναγνωριστικό (ID) του χρήστη. */
    private Long id;

    /** Το email του χρήστη, που χρησιμοποιείται και ως username. */
    private String email;

    /** Ο ρόλος του χρήστη στο σύστημα (π.χ., ADMIN, REGISTERED). */
    private RoleType role;

    /** Ένα boolean flag που δείχνει αν ο χρήστης έχει ορίσει μια ενεργή ζώνη ενδιαφέροντος. */
    private boolean hasActiveInterestZone;

    /** Ένα boolean flag που δείχνει αν ο χρήστης έχει ορίσει μια ενεργή ζώνη παρακολούθησης συγκρούσεων. */
    private boolean hasActiveCollisionZone;
}