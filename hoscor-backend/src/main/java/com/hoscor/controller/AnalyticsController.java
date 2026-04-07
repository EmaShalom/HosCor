package com.hoscor.controller;

import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.IntelligenceResult;
import com.hoscor.service.DecisionEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DecisionEngineService decisionEngineService;

    @GetMapping("/deterioration-risk")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','CHEF_UNITE')")
    public ApiResponse<Object> getDeteriorationRisk() {
        IntelligenceResult r = decisionEngineService.detectDeteriorationRisk();
        return ApiResponse.ok(r.getData());
    }
}
