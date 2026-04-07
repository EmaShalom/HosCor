package com.hoscor.controller;

import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.IntelligenceResult;
import com.hoscor.service.DecisionEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final DecisionEngineService decisionEngineService;

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','CHEF_UNITE')")
    public ApiResponse<List<Map<String, Object>>> getActiveAlerts() {
        IntelligenceResult result = decisionEngineService.getCriticalAlerts();
        List<Map<String, Object>> alerts = new ArrayList<>();

        if (result.getData() instanceof List<?> rawList) {
            for (Object item : rawList) {
                if (item instanceof Map<?, ?> rawMap) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> sourceMap = (Map<String, Object>) rawMap;
                    Map<String, Object> alert = new HashMap<>();
                    String type = String.valueOf(sourceMap.get("type"));
                    String severity = mapSeverity(type);
                    alert.put("severity", severity);
                    alert.put("title", buildTitle(type, sourceMap));
                    alert.put("details", String.valueOf(sourceMap.getOrDefault("description", "")));
                    Object unit = sourceMap.get("unit");
                    if (unit != null) alert.put("unit", unit);
                    alerts.add(alert);
                }
            }
        }

        return ApiResponse.ok(alerts);
    }

    private String mapSeverity(String type) {
        return switch (type) {
            case "WAIT_CRITIQUE", "SATURATION_CRITIQUE" -> "CRITICAL";
            case "CLEANING_LONG" -> "WARNING";
            default -> "INFO";
        };
    }

    private String buildTitle(String type, Map<String, Object> map) {
        return switch (type) {
            case "WAIT_CRITIQUE" -> "Patient critique en attente prolongée";
            case "SATURATION_CRITIQUE" -> "Saturation critique — unité " + map.getOrDefault("unit", "");
            case "CLEANING_LONG" -> "Lit en nettoyage prolongé";
            default -> "Alerte système";
        };
    }
}
