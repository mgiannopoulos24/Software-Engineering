package com.MarineTrafficClone.SeaWatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.MarineTrafficClone.SeaWatch.model.AisData;

@Repository
public interface AisDataRepository extends JpaRepository<AisData, Long> {
}