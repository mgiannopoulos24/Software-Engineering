package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.ShipType;
import com.MarineTrafficClone.SeaWatch.exception.ResourceNotFoundException;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final ShipRepository shipRepository;
    private final AisDataRepository aisDataRepository;

    @Autowired
    public AdminService(ShipRepository shipRepository, AisDataRepository aisDataRepository) {
        this.shipRepository = shipRepository;
        this.aisDataRepository = aisDataRepository;
    }

    /**
     * Updates the type of a specific ship and returns its full, updated details.
     *
     * @param mmsi The MMSI of the ship to update.
     * @param newShipType The new type to assign to the ship.
     * @return A complete ShipDetailsDTO with the updated information.
     * @throws ResourceNotFoundException if no ship with the given MMSI is found.
     */
    @Transactional
    public ShipDetailsDTO updateShipType(Long mmsi, ShipType newShipType) {
        // 1. Find the ship entity or throw an exception if it doesn't exist.
        Ship ship = shipRepository.findByMmsi(mmsi)
                .orElseThrow(() -> new ResourceNotFoundException("Ship not found with mmsi: " + mmsi));

        // 2. Update the ship's type.
        ship.setShiptype(newShipType);

        // 3. Save the updated entity back to the database.
        Ship updatedShip = shipRepository.save(ship);

        // 4. Convert the updated ship entity to a full DTO for the response.
        // This step is crucial and was likely the cause of the error.
        return convertToShipDetailsDTO(updatedShip);
    }

    /**
     * Retrieves all ships for the admin view.
     *
     * @return A list of all ships as ShipDetailsDTOs.
     */
    public List<ShipDetailsDTO> getAllShipsForAdmin() {
        return shipRepository.findAll().stream()
                .map(this::convertToShipDetailsDTO)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to convert a Ship entity to a complete ShipDetailsDTO.
     * It fetches the latest AIS data to provide a full picture of the ship.
     *
     * @param ship The Ship entity to convert.
     * @return The fully populated ShipDetailsDTO.
     */
    private ShipDetailsDTO convertToShipDetailsDTO(Ship ship) {
        ShipDetailsDTO dto = new ShipDetailsDTO();
        dto.setMmsi(ship.getMmsi());
        dto.setShiptype(ship.getShiptype());
        // Set other static ship details if they exist on the Ship entity
        // dto.setShipName(ship.getShipName()); // example
        // dto.setFlag(ship.getFlag());       // example

        // Find the latest AIS data for this ship to populate dynamic details.
        Optional<AisData> latestAisData = aisDataRepository.findTopByMmsiOrderByTimestampEpochDesc(String.valueOf(ship.getMmsi()));

        // If AIS data is present, populate the DTO with it.
        latestAisData.ifPresent(ais -> {
            dto.setLatitude(ais.getLatitude());
            dto.setLongitude(ais.getLongitude());
            dto.setSpeedOverGround(ais.getSpeedOverGround());
            dto.setCourseOverGround(ais.getCourseOverGround());
            dto.setHeading(ais.getHeading());
            dto.setNavigationStatus(ais.getNavigationStatus());
            dto.setTimestamp(ais.getTimestamp());
        });

        return dto;
    }
}