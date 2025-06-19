package com.MarineTrafficClone.SeaWatch;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.User;
import com.MarineTrafficClone.SeaWatch.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class SeaWatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(SeaWatchApplication.class, args);
	}


    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByRole(RoleType.ADMIN).isEmpty()) {
                User user = new User(
                        "admin@mail.com",
                        passwordEncoder.encode("12345")
                );
                user.setRole(RoleType.ADMIN);
                userRepository.save(user);
            }
        };
    }
}
