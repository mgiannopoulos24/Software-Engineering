package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.Ship;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipRepository extends JpaRepository<Ship, Long> {
}
