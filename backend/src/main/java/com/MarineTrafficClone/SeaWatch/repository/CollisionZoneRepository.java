package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.model.CollisionZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CollisionZoneRepository extends JpaRepository<CollisionZone, Long> {

    Optional<CollisionZone> findByUserId(Long userId);
}