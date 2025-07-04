package com.MarineTrafficClone.SeaWatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

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
}
