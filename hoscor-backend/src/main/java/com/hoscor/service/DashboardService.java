package com.hoscor.service;

import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.enums.BedState;
import com.hoscor.domain.enums.PatientStatus;
import com.hoscor.domain.enums.RiskLevel;
import com.hoscor.domain.enums.StretcherStatus;
import com.hoscor.domain.enums.TransferStatus;
import com.hoscor.domain.repository.BedRepository;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.StretcherRepository;
import com.hoscor.domain.repository.TransferRepository;
import com.hoscor.dto.DashboardOverviewDto;
import com.hoscor.dto.IntelligenceResult;
import com.hoscor.dto.UnitSummaryDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardService {

    private static final List<String> UNITS = List.of("2N", "3N", "2S", "3S", "URG", "CHIR");
    private static final Map<String, String> UNIT_NAMES = Map.of(
            "2N", "Cardiologie",
            "3N", "Néphrologie",
            "2S", "Soins Intensifs",
            "3S", "Médecine Générale",
            "URG", "Urgence",
            "CHIR", "Chirurgie"
    );

    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;
    private final StretcherRepository stretcherRepository;
    private final TransferRepository transferRepository;
    private final DecisionEngineService decisionEngineService;
    private final BedIntelligenceService bedIntelligenceService;
    private final PatientFlowService patientFlowService;

    @Transactional(readOnly = true, propagation = Propagation.SUPPORTS)
    public DashboardOverviewDto getDashboardOverview() {
        try {
            long totalBeds = bedRepository.count();
            long availableBeds = bedRepository.countByState(BedState.AVAILABLE);
            long occupiedBeds = bedRepository.countByState(BedState.OCCUPIED);
            long cleaningBeds = bedRepository.countByState(BedState.CLEANING);
            double occupancyRate = totalBeds > 0 ? (double) occupiedBeds / totalBeds * 100 : 0;

            long waitingPatients = stretcherRepository.countByStatus(StretcherStatus.WAITING);
            long highRiskWaiting = stretcherRepository.countByStatusAndRiskLevel(StretcherStatus.WAITING, RiskLevel.ELEVE);

            long activeTransfers = transferRepository.countByStatusIn(
                    List.of(TransferStatus.EN_ATTENTE, TransferStatus.EN_COURS));

            int criticalAlerts = countCriticalAlerts();
            List<UnitSummaryDto> perUnit = getUnitSummaries();

            return DashboardOverviewDto.builder()
                    .totalBeds(totalBeds)
                    .availableBeds(availableBeds)
                    .occupiedBeds(occupiedBeds)
                    .cleaningBeds(cleaningBeds)
                    .occupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                    .waitingPatients(waitingPatients)
                    .highRiskWaiting(highRiskWaiting)
                    .activeTransfers(activeTransfers)
                    .criticalAlerts(criticalAlerts)
                    .perUnit(perUnit)
                    .forecastDischarges24h(computeForecastDischarges())
                    .weeklyAdmissions(extractWeeklyAdmissions())
                    .diagnosisMix(computeDiagnosisMix())
                    .build();
        } catch (Exception e) {
            log.error("Dashboard overview failed — {}: {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return buildEmptyOverview();
        }
    }

    private DashboardOverviewDto buildEmptyOverview() {
        List<UnitSummaryDto> emptyUnits = UNITS.stream().map(unit ->
            UnitSummaryDto.builder()
                .unit(unit)
                .name(UNIT_NAMES.getOrDefault(unit, unit))
                .available(0).occupied(0).cleaning(0).total(0)
                .rate(0.0).saturationLevel("NORMALE")
                .build()
        ).toList();
        return DashboardOverviewDto.builder()
            .totalBeds(0).availableBeds(0).occupiedBeds(0).cleaningBeds(0)
            .occupancyRate(0.0).waitingPatients(0).highRiskWaiting(0)
            .activeTransfers(0).criticalAlerts(0)
            .perUnit(emptyUnits)
            .forecastDischarges24h(0)
            .weeklyAdmissions(List.of())
            .diagnosisMix(List.of())
            .build();
    }

    public List<UnitSummaryDto> getUnitSummaries() {
        return UNITS.stream().map(unit -> {
            long available = bedRepository.countByUnitAndState(unit, BedState.AVAILABLE);
            long occupied = bedRepository.countByUnitAndState(unit, BedState.OCCUPIED);
            long cleaning = bedRepository.countByUnitAndState(unit, BedState.CLEANING);
            long ready = bedRepository.countByUnitAndState(unit, BedState.READY);
            long total = available + occupied + cleaning + ready;
            double rate = total > 0 ? (double) occupied / total * 100 : 0;
            double roundedRate = Math.round(rate * 10.0) / 10.0;
            return UnitSummaryDto.builder()
                    .unit(unit)
                    .name(UNIT_NAMES.getOrDefault(unit, unit))
                    .available(available)
                    .occupied(occupied)
                    .cleaning(cleaning)
                    .total(total)
                    .rate(roundedRate)
                    .saturationLevel(UnitSummaryDto.computeSaturationLevel(rate))
                    .build();
        }).toList();
    }

    @SuppressWarnings("unchecked")
    private int countCriticalAlerts() {
        try {
            IntelligenceResult alerts = decisionEngineService.getCriticalAlerts();
            if (alerts.getData() instanceof List<?> list) {
                return list.size();
            }
        } catch (Exception ignored) {
        }
        return 0;
    }

    private int computeForecastDischarges() {
        try {
            IntelligenceResult r = bedIntelligenceService.forecast24h();
            if (r.getData() instanceof List<?> list) {
                int total = 0;
                for (Object item : list) {
                    if (item instanceof Map<?, ?> m && m.get("expectedDischarges") instanceof Number n) {
                        total += n.intValue();
                    }
                }
                return total;
            }
        } catch (Exception ignored) {}
        return 0;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractWeeklyAdmissions() {
        try {
            IntelligenceResult r = patientFlowService.getAdmissionStats();
            if (r.getData() instanceof List<?> list) {
                return (List<Map<String, Object>>) list;
            }
        } catch (Exception ignored) {}
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> computeDiagnosisMix() {
        try {
            List<Patient> admitted = patientRepository.findByStatus(PatientStatus.ADMITTED);
            Map<String, Long> counts = admitted.stream()
                    .filter(p -> p.getDiagnosis() != null)
                    .collect(Collectors.groupingBy(
                            p -> p.getDiagnosis().toUpperCase().trim(),
                            Collectors.counting()
                    ));
            long total = counts.values().stream().mapToLong(Long::longValue).sum();
            if (total == 0) return List.of();

            List<String> colors = List.of("#2563EB", "#EF4444", "#7C3AED", "#9CA3AF");
            List<Map.Entry<String, Long>> sorted = counts.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(4)
                    .toList();

            List<Map<String, Object>> result = new ArrayList<>();
            for (int i = 0; i < sorted.size(); i++) {
                Map.Entry<String, Long> e = sorted.get(i);
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("label", e.getKey());
                entry.put("count", e.getValue());
                entry.put("pct", (int) Math.round(e.getValue() * 100.0 / total));
                entry.put("color", colors.get(i));
                result.add(entry);
            }
            if (counts.size() > 4) {
                long topSum = sorted.stream().mapToLong(Map.Entry::getValue).sum();
                long othersCount = total - topSum;
                Map<String, Object> others = new LinkedHashMap<>();
                others.put("label", "Autres");
                others.put("count", othersCount);
                others.put("pct", (int) Math.round(othersCount * 100.0 / total));
                others.put("color", colors.get(colors.size() - 1));
                result.add(others);
            }
            return result;
        } catch (Exception ignored) {}
        return List.of();
    }
}
