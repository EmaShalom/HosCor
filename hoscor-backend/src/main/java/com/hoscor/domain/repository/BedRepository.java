package com.hoscor.domain.repository;

import com.hoscor.domain.entity.Bed;
import com.hoscor.domain.enums.BedState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByUnit(String unit);

    List<Bed> findByState(BedState state);

    List<Bed> findByUnitAndState(String unit, BedState state);

    long countByState(BedState state);

    long countByUnitAndState(String unit, BedState state);
}
