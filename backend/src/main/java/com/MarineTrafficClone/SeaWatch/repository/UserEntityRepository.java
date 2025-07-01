package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserEntityRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);

    @Query("SELECT u FROM UserEntity u WHERE u.role = :type")
    List<UserEntity> findByRole(@PathVariable RoleType type);

    // To find users with a specific ship in their fleet
    @Query("SELECT u FROM UserEntity u JOIN u.fleet s WHERE s.mmsi = :mmsi")
    List<UserEntity> findUsersWatchingMmsi(Long mmsi);
}
