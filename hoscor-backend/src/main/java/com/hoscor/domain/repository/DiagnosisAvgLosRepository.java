package com.hoscor.domain.repository;

import com.hoscor.domain.entity.DiagnosisAvgLos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiagnosisAvgLosRepository extends JpaRepository<DiagnosisAvgLos, String> {

    Optional<DiagnosisAvgLos> findByDiagnosisCodeContainingIgnoreCase(String keyword);
}
