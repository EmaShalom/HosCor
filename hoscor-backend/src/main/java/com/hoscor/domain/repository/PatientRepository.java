package com.hoscor.domain.repository;

import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.enums.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByMrdNumber(String mrdNumber);

    List<Patient> findByStatus(PatientStatus status);

    List<Patient> findByUnitAndStatus(String unit, PatientStatus status);

    long countByStatus(PatientStatus status);
}
