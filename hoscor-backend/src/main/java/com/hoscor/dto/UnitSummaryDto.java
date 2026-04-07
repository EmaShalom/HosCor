package com.hoscor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitSummaryDto {

    private String unit;
    private String name;
    private long available;
    private long occupied;
    private long cleaning;
    private long total;
    private double rate;
    private String saturationLevel;

    public static String computeSaturationLevel(double rate) {
        if (rate >= 95) return "CRITIQUE";
        if (rate >= 85) return "ELEVEE";
        if (rate >= 70) return "MODEREE";
        return "NORMALE";
    }
}
