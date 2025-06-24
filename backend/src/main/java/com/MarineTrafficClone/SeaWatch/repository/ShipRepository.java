package com.MarineTrafficClone.SeaWatch.repository; // Adjust to your package

import com.MarineTrafficClone.SeaWatch.model.Ship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShipRepository extends JpaRepository<Ship, Long> {
    Optional<Ship> findByMmsi(Long mmsi); // To check if a ship already exists
}