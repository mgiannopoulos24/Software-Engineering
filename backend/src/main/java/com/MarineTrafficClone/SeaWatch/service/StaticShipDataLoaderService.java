package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Service που υλοποιεί την {@link CommandLineRunner} για να εκτελεστεί αυτόματα
 * κατά την εκκίνηση της εφαρμογής. Ο σκοπός του είναι να διαβάσει το αρχείο CSV
 * με τα στατικά δεδομένα των πλοίων (MMSI και τύπος) και να τα φορτώσει στον πίνακα
 * `ships` της βάσης δεδομένων.
 * Το `@Order(1)` εξασφαλίζει ότι αυτό το service θα εκτελεστεί ΠΡΙΝ από οποιοδήποτε
 * άλλο CommandLineRunner με μεγαλύτερο αριθμό (π.χ., το CsvDataLoaderService που έχει @Order(2)).
 * Αυτό είναι σημαντικό ώστε να υπάρχουν τα στατικά δεδομένα στη βάση πριν αρχίσει η ροή των δυναμικών.
 */
@Service
@Order(1)
public class StaticShipDataLoaderService implements CommandLineRunner {

    private final ShipRepository shipRepository;
    private static final Logger log = LoggerFactory.getLogger(StaticShipDataLoaderService.class);

    @Autowired
    public StaticShipDataLoaderService(ShipRepository shipRepository) {
        this.shipRepository = shipRepository;
    }

    /**
     * Η μέθοδος run() καλείται αυτόματα από το Spring Boot.
     * Η εκτέλεση γίνεται μέσα σε μια συναλλαγή (transaction) για να διασφαλιστεί
     * ότι είτε θα φορτωθούν όλα τα δεδομένα επιτυχώς, είτε κανένα.
     */
    @Override
    @Transactional
    public void run(String... args) {
        log.info("STATIC DATA LOADER: Starting to load static ship data...");
        String filePath = "AIS-Data/vessel_types.csv";

        // Μετρητές για στατιστικά.
        int linesProcessed = 0;
        int newShipsCreated = 0;
        int shipsUpdated = 0;
        int skippedLinesDueToErrorOrFormat = 0;

        try (InputStream is = new ClassPathResource(filePath).getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {

            String line;

            while ((line = reader.readLine()) != null) {

                linesProcessed++;

                if (line.trim().isEmpty()) {
                    log.info("STATIC DATA LOADER: Skipped empty line at line number: {}", linesProcessed);
                    skippedLinesDueToErrorOrFormat++;
                    continue;
                }

                String[] values = line.split(",", -1);
                if (values.length == 2) {
                    try {
                        String mmsiString = values[0].trim();
                        String shipTypeValueString = values[1].trim();

                        if (mmsiString.isEmpty()) {
                            log.warn("STATIC DATA LOADER: Skipping line {} due to empty MMSI in line: '{}'", linesProcessed, line);
                            skippedLinesDueToErrorOrFormat++;
                            continue;
                        }
                        if (shipTypeValueString.isEmpty()) {
                            log.warn("STATIC DATA LOADER: Skipping line {} due to empty ShipType value for MMSI {} in line: '{}'",  linesProcessed, mmsiString, line);
                            skippedLinesDueToErrorOrFormat++;
                            continue;
                        }

                        Long mmsi = Long.parseLong(mmsiString);
                        // Χρήση της βοηθητικής μεθόδου fromValue για να μετατρέψουμε το string σε enum.
                        ShipType shipTypeEnum = ShipType.fromValue(shipTypeValueString);

                        if (shipTypeEnum == null) {
                            log.warn("STATIC DATA LOADER: Unknown or unmappable ship type value '{}' for MMSI {} on line {}. Skipping record.", shipTypeValueString, mmsi, linesProcessed);
                            skippedLinesDueToErrorOrFormat++;
                            continue;
                        }

                        // Έλεγχος αν το πλοίο υπάρχει ήδη στη βάση.
                        Ship existingShip = shipRepository.findByMmsi(mmsi).orElse(null);

                        if (existingShip == null) {
                            // Αν δεν υπάρχει, δημιουργούμε ένα νέο.
                            Ship newShip = Ship.builder()
                                    .mmsi(mmsi)
                                    .shiptype(shipTypeEnum)
                                    .build();
                            shipRepository.save(newShip);
                            newShipsCreated++;
                        } else {
                            // Αν υπάρχει, ελέγχουμε αν ο τύπος έχει αλλάξει και το ενημερώνουμε μόνο αν χρειάζεται.
                            if (existingShip.getShiptype() != shipTypeEnum) {
                                log.info("STATIC DATA LOADER: Updating ship type for MMSI {} from '{}' to '{}'.", mmsi, existingShip.getShiptype(), shipTypeEnum);
                                existingShip.setShiptype(shipTypeEnum);
                                shipRepository.save(existingShip);
                                shipsUpdated++;
                            }
                        }
                    } catch (NumberFormatException e) {
                        log.error("STATIC DATA LOADER: Skipping line {} due to MMSI parsing error (NumberFormat): '{}' in line: '{}'", linesProcessed, values[0], line, e);
                        skippedLinesDueToErrorOrFormat++;
                    } catch (IllegalArgumentException e) {
                        log.error("STATIC DATA LOADER: Skipping line {} due to invalid ShipType value: '{}' in line: '{}'", linesProcessed, values[1], line, e);
                        skippedLinesDueToErrorOrFormat++;
                    } catch (Exception e) {
                        log.error("STATIC DATA LOADER: Error processing line: '{}'", line, e);
                        skippedLinesDueToErrorOrFormat++;
                    }
                } else {
                    log.error("STATIC DATA LOADER: Malformed CSV line {} (expected 2 columns). Found: '{}'", linesProcessed, values.length);
                }
            }
            log.info("STATIC DATA LOADER: Finished processing static ship data CSV.");
            log.info("STATIC DATA LOADER: Total lines read : {}", (linesProcessed - skippedLinesDueToErrorOrFormat));
            log.info("STATIC DATA LOADER: New ships created: {}", newShipsCreated);
            log.info("STATIC DATA LOADER: Existing ships updated: {}", shipsUpdated);
            log.info("STATIC DATA LOADER: Lines skipped due to errors, empty values, or format issues: {}", skippedLinesDueToErrorOrFormat);


        } catch (Exception e) {
            log.error("STATIC DATA LOADER: CRITICAL error loading or processing static ship data CSV file '{}'", filePath, e);
        }
    }
}