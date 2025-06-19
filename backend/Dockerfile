# Use a Maven+JDK image to build
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy project
COPY . .
COPY src ./src

# Run the Maven build command.
RUN mvn clean package -DskipTests

# Use a smaller base image to run the jar
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copy the JAR built in the 'build' stage into the final image
COPY --from=build /app/target/*.jar marinemap.jar

ENTRYPOINT ["java", "-jar", "marinemap.jar"]