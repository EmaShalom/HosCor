package com.hoscor.domain.entity;

import com.hoscor.domain.enums.RiskLevel;
import com.hoscor.domain.enums.StretcherStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stretchers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stretcher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stretcher_number", unique = true, nullable = false, length = 20)
    private String stretcherNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StretcherStatus status = StretcherStatus.WAITING;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 10)
    private RiskLevel riskLevel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "wait_since", nullable = false)
    private LocalDateTime waitSince;

    @Column(name = "target_unit", length = 10)
    private String targetUnit;
}
