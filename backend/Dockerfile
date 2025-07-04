# --- Στάδιο 1: Build ---
# Χρησιμοποιούμε ένα image που περιέχει και το Maven και το JDK 17 για να χτίσουμε την εφαρμογή.
# Ονομάζουμε αυτό το στάδιο "build" για να μπορούμε να αναφερθούμε σε αυτό αργότερα.
FROM maven:3.9.4-eclipse-temurin-17 AS build

# Ορίζουμε τον φάκελο εργασίας μέσα στο container.
WORKDIR /app

# Αντιγράφουμε πρώτα μόνο το pom.xml.
COPY pom.xml .

# Κατεβάζουμε όλες τις εξαρτήσεις (dependencies). Αυτό το βήμα εκμεταλλεύεται το layer caching του Docker.
# Αν οι εξαρτήσεις δεν έχουν αλλάξει, το Docker θα επαναχρησιμοποιήσει το cached layer, κάνοντας το build πολύ πιο γρήγορο.
RUN mvn dependency:go-offline

# Αντιγράφουμε τον υπόλοιπο κώδικα του project.
COPY . .
COPY src ./src

# Εκτελούμε την εντολή του Maven για να χτίσουμε το project και να δημιουργήσουμε το εκτελέσιμο .jar αρχείο.
# Το -DskipTests παρακάμπτει την εκτέλεση των tests, κάνοντας το build πιο γρήγορο.
RUN mvn clean package -DskipTests

# --- Στάδιο 2: Run ---
# Χρησιμοποιούμε ένα πολύ μικρότερο image που περιέχει μόνο το Java Runtime Environment (JRE) για να τρέξουμε την εφαρμογή.
# Αυτό κάνει το τελικό image πολύ πιο ελαφρύ και ασφαλές (multi-stage build).
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Αντιγράφουμε το .jar αρχείο που δημιουργήθηκε στο στάδιο "build" στο τελικό image.
# Το --from=build αναφέρεται στο προηγούμενο στάδιο.
COPY --from=build /app/target/*.jar marinemap.jar

# Ορίζουμε την εντολή που θα εκτελεστεί όταν ξεκινήσει το container.
# Αυτή η εντολή τρέχει την εφαρμογή Spring Boot.
ENTRYPOINT ["java", "-jar", "marinemap.jar"]