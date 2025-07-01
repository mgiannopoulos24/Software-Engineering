package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.ShipDetailsDTO;
import com.MarineTrafficClone.SeaWatch.model.AisData;
import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.AisDataRepository;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserFleetService {

    private final UserEntityRepository userEntityRepository;
    private final ShipRepository shipRepository;
    private final AisDataRepository aisDataRepository;

    @Autowired
    public UserFleetService(UserEntityRepository userEntityRepository, ShipRepository shipRepository, AisDataRepository aisDataRepository) {
        this.userEntityRepository = userEntityRepository;
        this.shipRepository = shipRepository;
        this.aisDataRepository = aisDataRepository;
    }

    @Transactional(readOnly = true)
    public Set<ShipDetailsDTO> getWatchedShipsDetails(Long userId) {
        // 1. Βρες τον χρήστη και τον στόλο του (Set<Ship>)
        UserEntity userEntity = userEntityRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Set<Ship> fleetShips = userEntity.getFleet();
        if (fleetShips.isEmpty()) {
            return Collections.emptySet();
        }

        // 2. Μάζεψε όλα τα MMSI από τα πλοία του στόλου
        List<String> mmsiList = fleetShips.stream()
                .map(ship -> ship.getMmsi().toString())
                .collect(Collectors.toList());

        // 3. Κάνε ΕΝΑ query για να πάρεις τα τελευταία AIS data για ΟΛΑ τα πλοία
        List<AisData> latestAisDataList = aisDataRepository.findLatestAisDataForMmsiList(mmsiList);

        // 4. Μετέτρεψε τη λίστα σε Map για γρήγορη πρόσβαση (MMSI -> AisData)
        Map<String, AisData> latestAisDataMap = latestAisDataList.stream()
                .collect(Collectors.toMap(AisData::getMmsi, data -> data));

        // 5. Συνδύασε τα δεδομένα για να φτιάξεις το τελικό Set από DTOs
        return fleetShips.stream().map(ship -> {
            ShipDetailsDTO dto = new ShipDetailsDTO();
            // Γέμισε τα στατικά δεδομένα
            dto.setMmsi(ship.getMmsi());
            dto.setShiptype(ship.getShiptype());

            // Βρες τα τελευταία δυναμικά δεδομένα από το Map
            AisData latestData = latestAisDataMap.get(ship.getMmsi().toString());
            if (latestData != null) {
                dto.setNavigationalStatus(latestData.getNavigationalStatus());
                dto.setRateOfTurn(latestData.getRateOfTurn());
                dto.setSpeedOverGround(latestData.getSpeedOverGround());
                dto.setCourseOverGround(latestData.getCourseOverGround());
                dto.setTrueHeading(latestData.getTrueHeading());
                dto.setLongitude(latestData.getLongitude());
                dto.setLatitude(latestData.getLatitude());
                dto.setLastUpdateTimestampEpoch(latestData.getTimestampEpoch());
            }
            return dto;
        }).collect(Collectors.toSet());
    }

    @Transactional
    public void addShipToUserFleet(Long userId, Long shipMmsi) {
        UserEntity userEntity = userEntityRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Ship ship = shipRepository.findByMmsi(shipMmsi)
                .orElseThrow(() -> new RuntimeException("Ship not found with MMSI: " + shipMmsi));

        userEntity.addShipToFleet(ship);
        userEntityRepository.save(userEntity);
    }

    @Transactional
    public void removeShipFromUserFleet(Long userId, Long shipMmsi) {
        UserEntity userEntity = userEntityRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Ship ship = shipRepository.findByMmsi(shipMmsi)
                .orElseThrow(() -> new RuntimeException("Ship not found with MMSI: " + shipMmsi));

        userEntity.removeShipFromFleet(ship);
        userEntityRepository.save(userEntity);
    }
}