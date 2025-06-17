package marinemap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class MarineMapApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarineMapApplication.class, args);
        System.out.println("MarineMapApplication started");
    }
    @GetMapping
    public String helloWorld() {
        return "Hello World Spring Boot !";
    }
}
