package com.hoscor.dto;

import com.hoscor.domain.entity.Bed;
import com.hoscor.domain.enums.BedState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedDto {

    private Long id;
    private String unit;
    private String bedNumber;
    private BedState state;
    private LocalDateTime lastUpdated;
    private String patientName;
    private LocalDateTime reservedUntil;

    public static BedDto from(Bed bed, String patientName) {
        return BedDto.builder()
                .id(bed.getId())
                .unit(bed.getUnit())
                .bedNumber(bed.getBedNumber())
                .state(bed.getState())
                .lastUpdated(bed.getLastUpdated())
                .patientName(patientName)
                .reservedUntil(bed.getReservedUntil())
                .build();
    }
}
