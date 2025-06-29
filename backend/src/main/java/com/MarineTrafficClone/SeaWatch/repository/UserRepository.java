package com.MarineTrafficClone.SeaWatch.repository;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = :type")
    List<User> findByRole(@PathVariable RoleType type);

    // To find users with a specific ship in their fleet
    @Query("SELECT u FROM User u JOIN u.fleet s WHERE s.mmsi = :mmsi")
    List<User> findUsersWatchingMmsi(Long mmsi);
}
