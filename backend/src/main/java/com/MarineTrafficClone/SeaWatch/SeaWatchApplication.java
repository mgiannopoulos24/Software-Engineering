package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import org.apache.catalina.Context;
import org.apache.catalina.connector.Connector;
import org.apache.tomcat.util.descriptor.web.SecurityCollection;
import org.apache.tomcat.util.descriptor.web.SecurityConstraint;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableScheduling
public class SeaWatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(SeaWatchApplication.class, args);
	}

//    @Bean
//    public ServletWebServerFactory servletContainer() {
//        TomcatServletWebServerFactory    tomcat = new TomcatServletWebServerFactory() {
//            @Override
//            protected void postProcessContext(Context context) {
//                SecurityConstraint securityConstraint = new SecurityConstraint();
//                securityConstraint.setUserConstraint("CONFIDENTIAL");
//                SecurityCollection collection = new SecurityCollection();
//                collection.addPattern("/*");
//                securityConstraint.addCollection(collection);
//                context.addConstraint(securityConstraint);
//            }
//        };
//        tomcat.addAdditionalTomcatConnectors(redirectConnector());
//        return tomcat;
//    }
//
//    private Connector redirectConnector() {
//        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
//        connector.setScheme("http");
//        connector.setPort(8080);
//        connector.setSecure(false);
//        connector.setRedirectPort(8443);
//        return connector;
//    }

    @Bean
    CommandLineRunner initDatabase(UserEntityRepository userEntityRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userEntityRepository.findByRole(RoleType.ADMIN).isEmpty()) {
                UserEntity userEntity = new UserEntity(
                        "admin@ais.com",
                        passwordEncoder.encode("12345")
                );
                userEntity.setRole(RoleType.ADMIN);
                userEntityRepository.save(userEntity);
            }
        };
    }
}
