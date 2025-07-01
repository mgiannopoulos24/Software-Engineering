package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.ZoneOfInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional; // Use Optional for safety

@Repository
public interface ZoneOfInterestRepository extends JpaRepository<ZoneOfInterest, Long> {
    // Find the single zone belonging to a specific user
    Optional<ZoneOfInterest> findByUserId(Long userId);

    // This allows for easy deletion without fetching the entity first
    void deleteByUserId(Long userId);
}

