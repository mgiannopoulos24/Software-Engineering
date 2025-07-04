package com.MarineTrafficClone.SeaWatch.configuration;

import org.apache.catalina.Context;
import org.apache.catalina.connector.Connector;
import org.apache.tomcat.util.descriptor.web.SecurityCollection;
import org.apache.tomcat.util.descriptor.web.SecurityConstraint;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Κλάση διαμόρφωσης που ενεργοποιεί την ανακατεύθυνση από HTTP σε HTTPS.
 * Χάρη στο annotation @Profile("!test"), ολόκληρη αυτή η διαμόρφωση (και το bean που δημιουργεί)
 * θα είναι ενεργή σε ΟΛΑ τα περιβάλλοντα ΕΚΤΟΣ από το περιβάλλον 'test'.
 * Έτσι, η ανακατεύθυνση θα λειτουργεί κανονικά στην παραγωγή, αλλά δε θα
 * επηρεάζει τα integration tests μας.
 */
@Configuration
@Profile("!test")
public class HttpsRedirectConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        // Δημιουργία ενός Tomcat factory που θα επιβάλει τη χρήση HTTPS.
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL"); // CONFIDENTIAL σημαίνει ότι απαιτείται SSL.
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*"); // Εφαρμογή του κανόνα σε όλα τα URL paths.
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };

        // Προσθήκη του connector που ακούει στο HTTP port και κάνει την ανακατεύθυνση.
        tomcat.addAdditionalTomcatConnectors(redirectConnector());
        return tomcat;
    }

    private Connector redirectConnector() {
        // Αυτός ο connector ακούει στο port 8080 (HTTP).
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(8080); // Το HTTP port.
        connector.setSecure(false);
        connector.setRedirectPort(8443); // Το port στο οποίο θα γίνει η ανακατεύθυνση (το HTTPS port).
        return connector;
    }
}
