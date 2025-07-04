package com.MarineTrafficClone.SeaWatch;

import org.apache.catalina.Context;
import org.apache.catalina.connector.Connector;
import org.apache.tomcat.util.descriptor.web.SecurityCollection;
import org.apache.tomcat.util.descriptor.web.SecurityConstraint;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
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

    /*
     Οι παρακάτω μέθοδοι για την ανακατεύθυνση από HTTP σε HTTPS είναι σε σχόλια.
     Μπορούν να ενεργοποιηθούν αν το SSL είναι ρυθμισμένο στο application.properties.
     Τα έχουμε κάνει comment επειδή υπάρχει πρόβλημα μεταξύ SSL και Websockets.
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
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
}
