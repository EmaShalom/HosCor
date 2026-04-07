package com.hoscor.controller;

import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.DashboardOverviewDto;
import com.hoscor.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','HYGIENE','CHEF_UNITE','URGENCE','COMMIS_ETAGE')")
    public ApiResponse<DashboardOverviewDto> getOverview() {
        return ApiResponse.ok(dashboardService.getDashboardOverview());
    }
}
