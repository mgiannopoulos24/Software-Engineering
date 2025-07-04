package com.MarineTrafficClone.SeaWatch.configuration;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Κλάση διαμόρφωσης που είναι υπεύθυνη μόνο για την αρχικοποίηση της βάσης δεδομένων.
 * Με το @Profile("!test"), ολόκληρη αυτή η κλάση (και το bean που περιέχει)
 * θα αγνοηθεί εντελώς όταν το Spring τρέχει με το profile 'test' ενεργό.
 */
@Configuration
@Profile("!test")
public class DatabaseInitializationConfig {

    /**
     * Ένα bean τύπου {@link CommandLineRunner} εκτελείται αυτόματα μία φορά
     * κατά την εκκίνηση της εφαρμογής.
     * Το χρησιμοποιούμε εδώ για να αρχικοποιήσουμε τη βάση δεδομένων,
     * δημιουργώντας έναν προεπιλεγμένο χρήστη-διαχειριστή (admin) αν δεν υπάρχει ήδη.
     *
     * @param userEntityRepository Το repository για την πρόσβαση στους χρήστες.
     * @param passwordEncoder Ο κωδικοποιητής για την κρυπτογράφηση του κωδικού.
     * @return Ένα αντικείμενο CommandLineRunner.
     */
    @Bean
    CommandLineRunner initDatabase(UserEntityRepository userEntityRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Έλεγχος αν υπάρχει ήδη χρήστης με ρόλο ADMIN.
            if (userEntityRepository.findByRole(RoleType.ADMIN).isEmpty()) {
                System.out.println("Creating default ADMIN user...");
                UserEntity userEntity = new UserEntity(
                        "admin@ais.com", // email
                        passwordEncoder.encode("12345") // κωδικός (κρυπτογραφημένος)
                );
                userEntity.setRole(RoleType.ADMIN);
                userEntityRepository.save(userEntity);
                System.out.println("Default ADMIN user created.");
            }
        };
    }
}