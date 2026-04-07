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
public class ShiftReportDto {

    private String date;
    private String shift;
    private String shiftLabel;
    private String startTime;
    private String endTime;

    private List<Map<String, Object>> admissions;
    private List<Map<String, Object>> discharges;
    private List<Map<String, Object>> transfers;
    private List<Map<String, Object>> waitingPatients;

    private int admissionCount;
    private int dischargeCount;
    private int transferCount;
    private int waitingCount;
}
