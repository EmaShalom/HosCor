package com.hoscor.dto;

import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.entity.Stretcher;
import com.hoscor.domain.enums.RiskLevel;
import com.hoscor.domain.enums.StretcherStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StretcherDto {

    private Long id;
    private String stretcherNumber;
    private StretcherStatus status;
    private RiskLevel riskLevel;
    private Patient patient;
    private LocalDateTime waitSince;
    private String targetUnit;
    private long waitMinutes;
    private int priorityScore;

    public static StretcherDto from(Stretcher s) {
        long waitMinutes = ChronoUnit.MINUTES.between(s.getWaitSince(), LocalDateTime.now());
        int riskScore = switch (s.getRiskLevel()) {
            case ELEVE -> 3;
            case MOYEN -> 2;
            case FAIBLE -> 1;
        };
        int priorityScore = riskScore * 1000 - (int) Math.min(waitMinutes, Integer.MAX_VALUE);
        return StretcherDto.builder()
                .id(s.getId())
                .stretcherNumber(s.getStretcherNumber())
                .status(s.getStatus())
                .riskLevel(s.getRiskLevel())
                .patient(s.getPatient())
                .waitSince(s.getWaitSince())
                .targetUnit(s.getTargetUnit())
                .waitMinutes(waitMinutes)
                .priorityScore(priorityScore)
                .build();
    }
}
