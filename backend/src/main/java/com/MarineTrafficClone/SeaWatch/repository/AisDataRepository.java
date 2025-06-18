package marinemap.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import marinemap.model.AisData;

@Repository
public interface AisDataRepository extends JpaRepository<AisData, Long> {
}