package com.hoscor.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "diagnosis_avg_los")
@Data
@NoArgsConstructor
public class DiagnosisAvgLos {

    @Id
    @Column(name = "diagnosis_code", length = 50)
    private String diagnosisCode;

    @Column(name = "avg_los_hours", nullable = false, precision = 6, scale = 2)
    private BigDecimal avgLosHours;
}
