package com.MarineTrafficClone.SeaWatch.repository; // Adjust to your package

import com.MarineTrafficClone.SeaWatch.model.Ship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

//import java.util.List;
import java.util.Optional;

@Repository
public interface ShipRepository extends JpaRepository<Ship, Long> {

    Optional<Ship> findByMmsi(Long mmsi);      // To check if a ship exists (for adding or removing from fleet)

    // Το βάζω σε comments για να μην πετάει warnings
//    List<Ship> findByMmsiIn(List<Long> mmsis); // Useful for getting multiple ships
}