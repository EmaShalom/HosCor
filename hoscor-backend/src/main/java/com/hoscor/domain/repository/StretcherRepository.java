package com.hoscor.domain.repository;

import com.hoscor.domain.entity.Stretcher;
import com.hoscor.domain.enums.RiskLevel;
import com.hoscor.domain.enums.StretcherStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StretcherRepository extends JpaRepository<Stretcher, Long> {

    List<Stretcher> findByStatus(StretcherStatus status);

    List<Stretcher> findByStatusAndRiskLevel(StretcherStatus status, RiskLevel riskLevel);

    long countByStatus(StretcherStatus status);

    long countByStatusAndRiskLevel(StretcherStatus status, RiskLevel riskLevel);
}
