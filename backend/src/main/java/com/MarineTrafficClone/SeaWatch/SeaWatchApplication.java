package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Η κύρια κλάση εκκίνησης της εφαρμογής Spring Boot.
 * Το @SpringBootApplication είναι ένα βολικό annotation που συνδυάζει τα:
 * - @Configuration: Επισημαίνει την κλάση ως πηγή ορισμών bean.
 * - @EnableAutoConfiguration: Λέει στο Spring Boot να αρχίσει να προσθέτει beans βάσει των classpath settings.
 * - @ComponentScan: Λέει στο Spring να ψάξει για άλλα components, configurations, και services στο ίδιο package.
 * Το @EnableScheduling ενεργοποιεί την υποστήριξη για προγραμματισμένες εργασίες (scheduled tasks),
 * όπως αυτή στο DatabaseCleanupService.
 */
@SpringBootApplication
@EnableScheduling
public class SeaWatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeaWatchApplication.class, args);
    }

    /*
     Οι παρακάτω μέθοδοι για την ανακατεύθυνση από HTTP σε HTTPS είναι σε σχόλια.
     Μπορούν να ενεργοποιηθούν αν το SSL είναι ρυθμισμένο στο application.properties.
     Τα έχουμε κάνει comment επειδή υπάρχει πρόβλημα μεταξύ SSL και Websockets.
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory    tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };
        tomcat.addAdditionalTomcatConnectors(redirectConnector());
        return tomcat;
    }

    private Connector redirectConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
    */

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
