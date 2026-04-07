package com.hoscor.controller;

import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.ShiftReportDto;
import com.hoscor.service.ShiftReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ShiftReportService shiftReportService;

    @GetMapping("/shift")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','CHEF_UNITE','COMMIS_ETAGE','URGENCE')")
    public ApiResponse<ShiftReportDto> getShiftReport(
            @RequestParam String date,
            @RequestParam String shift) {
        return ApiResponse.ok(shiftReportService.generateReport(date, shift));
    }
}
