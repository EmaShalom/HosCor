package com.hoscor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDto {

    private long totalBeds;
    private long availableBeds;
    private long occupiedBeds;
    private long cleaningBeds;
    private double occupancyRate;
    private long waitingPatients;
    private long highRiskWaiting;
    private long activeTransfers;
    private int criticalAlerts;
    private List<UnitSummaryDto> perUnit;
    private int forecastDischarges24h;
    private List<Map<String, Object>> weeklyAdmissions;
    private List<Map<String, Object>> diagnosisMix;
}
