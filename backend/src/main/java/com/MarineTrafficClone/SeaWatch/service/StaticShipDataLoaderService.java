package com.MarineTrafficClone.SeaWatch.service; // Ensure this matches your package structure

import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
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

@Service
@Order(1) // Ensure this runs before your dynamic data loader (which should be @Order(2))
public class StaticShipDataLoaderService implements CommandLineRunner {

    private final ShipRepository shipRepository;

    @Autowired
    public StaticShipDataLoaderService(ShipRepository shipRepository) {
        this.shipRepository = shipRepository;
    }

    @Override
    @Transactional // Apply transaction to the entire data loading process
    public void run(String... args) throws Exception {
        System.out.println("STATIC DATA LOADER (CommandLineRunner): run() method called. Attempting to load static ship data.");
        String filePath = "AIS-Data/vessel_types.csv"; // Path within src/main/resources
        // Make sure this filename matches your actual static data CSV

        int linesProcessed = 0;
        int newShipsCreated = 0;
        int shipsUpdated = 0;
        int skippedLinesDueToErrorOrFormat = 0;

        try (InputStream is = new ClassPathResource(filePath).getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {

            String line;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                linesProcessed++;
                if (!headerSkipped) {
                    // Assuming the first line is a header like "mmsi,shiptype_value"
                    // If your CSV has NO header, remove this block or set headerSkipped = true before the loop.
                    headerSkipped = true;
                    System.out.println("STATIC DATA LOADER: Skipped header row: '" + line + "'");
                    continue;
                }

                if (line.trim().isEmpty()) {
                    System.out.println("STATIC DATA LOADER: Skipped empty line at line number: " + linesProcessed);
                    skippedLinesDueToErrorOrFormat++;
                    continue;
                }

                String[] values = line.split(",", -1); // Use -1 limit to include trailing empty strings if any
                if (values.length == 2) {
                    try {
                        String mmsiString = values[0].trim();
                        String shipTypeValueString = values[1].trim();

                        if (mmsiString.isEmpty()) {
                            System.err.println("STATIC DATA LOADER: Skipping line " + linesProcessed + " due to empty MMSI in line: '" + line + "'");
                            skippedLinesDueToErrorOrFormat++;
                            continue;
                        }
                        if (shipTypeValueString.isEmpty()) {
                            System.err.println("STATIC DATA LOADER: Skipping line " + linesProcessed + " due to empty ShipType value for MMSI " + mmsiString + " in line: '" + line + "'");
                            skippedLinesDueToErrorOrFormat++;
                            continue;
                        }

                        Long mmsi = Long.parseLong(mmsiString);
                        ShipType shipTypeEnum = ShipType.fromValue(shipTypeValueString); // Uses the static method from your Enum

                        if (shipTypeEnum == null) {
                            System.err.println("STATIC DATA LOADER: Unknown or unmappable ship type value '" + shipTypeValueString + "' for MMSI " + mmsi + " on line " + linesProcessed + ". Skipping record.");
                            skippedLinesDueToErrorOrFormat++;
                            continue;
                        }

                        Ship existingShip = shipRepository.findByMmsi(mmsi).orElse(null);

                        if (existingShip == null) {
                            Ship newShip = Ship.builder()
                                    .mmsi(mmsi)
                                    .shiptype(shipTypeEnum)
                                    .build();
                            shipRepository.save(newShip);
                            newShipsCreated++;
                        } else {
                            // Ship already exists, update its type only if it's different
                            if (existingShip.getShiptype() != shipTypeEnum) {
                                System.out.println("STATIC DATA LOADER: Updating ship type for MMSI " + mmsi + " from '" + existingShip.getShiptype() + "' to '" + shipTypeEnum + "'.");
                                existingShip.setShiptype(shipTypeEnum);
                                shipRepository.save(existingShip); // This will perform an UPDATE
                                shipsUpdated++;
                            }
                            // Optionally, log if ship exists and type is the same:
                            // else {
                            //    System.out.println("STATIC DATA LOADER: Ship with MMSI " + mmsi + " already exists with type " + shipTypeEnum + ". No update needed.");
                            // }
                        }
                    } catch (NumberFormatException e) {
                        System.err.println("STATIC DATA LOADER: Skipping line " + linesProcessed + " due to MMSI parsing error (NumberFormat): '" + values[0] + "' in line: '" + line + "'. Error: " + e.getMessage());
                        skippedLinesDueToErrorOrFormat++;
                    } catch (IllegalArgumentException e) { // Catches errors from ShipType.fromValue if it throws for unknown values
                        System.err.println("STATIC DATA LOADER: Skipping line " + linesProcessed + " due to invalid ShipType value: '" + values[1] + "' in line: '" + line + "'. Error: " + e.getMessage());
                        skippedLinesDueToErrorOrFormat++;
                    } catch (Exception e) { // Catch any other unexpected error for a specific line
                        System.err.println("STATIC DATA LOADER: Error processing line " + linesProcessed + ": '" + line + "'");
                        e.printStackTrace();
                        skippedLinesDueToErrorOrFormat++;
                    }
                } else {
                    System.err.println("STATIC DATA LOADER: Malformed CSV line " + linesProcessed + " (expected 2 columns, found " + values.length + "): '" + line + "'");
                    skippedLinesDueToErrorOrFormat++;
                }
            } // End while loop

            System.out.println("STATIC DATA LOADER: Finished processing static ship data CSV.");
            System.out.println("STATIC DATA LOADER: Total lines read (actual data lines after header): " + (linesProcessed - (headerSkipped ? 1 : 0) - skippedLinesDueToErrorOrFormat));
            System.out.println("STATIC DATA LOADER: New ships created: " + newShipsCreated);
            System.out.println("STATIC DATA LOADER: Existing ships updated: " + shipsUpdated);
            System.out.println("STATIC DATA LOADER: Lines skipped due to errors, empty values, or format issues: " + skippedLinesDueToErrorOrFormat);

        } catch (Exception e) { // Catch errors related to opening or reading the file itself
            System.err.println("STATIC DATA LOADER: CRITICAL error loading or processing static ship data CSV file '" + filePath + "'.");
            e.printStackTrace();
        }
    }
}