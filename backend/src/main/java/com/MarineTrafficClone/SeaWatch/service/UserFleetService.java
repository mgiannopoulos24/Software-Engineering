package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.model.Ship;
import com.MarineTrafficClone.SeaWatch.model.User;
import com.MarineTrafficClone.SeaWatch.repository.ShipRepository;
import com.MarineTrafficClone.SeaWatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;

@Service
public class UserFleetService {

    private final UserRepository userRepository;
    private final ShipRepository shipRepository;

    @Autowired
    public UserFleetService(UserRepository userRepository, ShipRepository shipRepository) {
        this.userRepository = userRepository;
        this.shipRepository = shipRepository;
    }

    @Transactional(readOnly = true)
    public Set<Ship> getWatchedShipsDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        // Eagerly fetch the collection to avoid LazyInitializationException in the controller
        user.getFleet().size(); // This forces initialization
        return user.getFleet();
    }

    @Transactional
    public void addShipToUserFleet(Long userId, Long shipMmsi) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Ship ship = shipRepository.findByMmsi(shipMmsi)
                .orElseThrow(() -> new RuntimeException("Ship not found with MMSI: " + shipMmsi));

        user.addShipToFleet(ship);
        userRepository.save(user);
    }

    @Transactional
    public void removeShipFromUserFleet(Long userId, Long shipMmsi) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Ship ship = shipRepository.findByMmsi(shipMmsi)
                .orElseThrow(() -> new RuntimeException("Ship not found with MMSI: " + shipMmsi));

        user.removeShipFromFleet(ship);
        userRepository.save(user);
    }
}