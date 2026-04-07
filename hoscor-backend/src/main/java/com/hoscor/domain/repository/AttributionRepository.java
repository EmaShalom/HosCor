package com.hoscor.domain.repository;

import com.hoscor.domain.entity.Attribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttributionRepository extends JpaRepository<Attribution, Long> {

    List<Attribution> findByBed_Id(Long bedId);

    Optional<Attribution> findTopByBed_IdOrderByAssignedAtDesc(Long bedId);
}
