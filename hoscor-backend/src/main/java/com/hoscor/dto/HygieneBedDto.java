package com.hoscor.dto;

import com.hoscor.domain.enums.BedState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HygieneBedDto {
    private Long id;
    private String unit;
    private String bedNumber;
    private BedState state;
    private String mrdNumber;
    private Integer patientAge;
    private String dischargeDate;
    private String diagnosis;
}
