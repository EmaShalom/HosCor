package com.hoscor.controller;

import com.hoscor.domain.entity.Bed;
import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.enums.BedState;
import com.hoscor.domain.enums.PatientStatus;
import com.hoscor.domain.repository.BedRepository;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.BedDto;
import com.hoscor.dto.HygieneBedDto;
import com.hoscor.dto.UnitSummaryDto;
import com.hoscor.service.BedAssignmentService;
import com.hoscor.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/beds")
@RequiredArgsConstructor
public class BedController {

    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;
    private final DashboardService dashboardService;
    private final BedAssignmentService bedAssignmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','CHEF_UNITE','COMMIS_ETAGE','HYGIENE')")
    public ApiResponse<List<UnitSummaryDto>> getBedsSummary() {
        return ApiResponse.ok(dashboardService.getUnitSummaries());
    }

    @GetMapping("/{unit}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','CHEF_UNITE','COMMIS_ETAGE','HYGIENE')")
    public ApiResponse<List<BedDto>> getUnitBeds(@PathVariable String unit) {
        List<Bed> beds = bedRepository.findByUnit(unit);

        Map<String, String> patientNames = patientRepository
                .findByUnitAndStatus(unit, PatientStatus.ADMITTED)
                .stream()
                .filter(p -> p.getBedNumber() != null)
                .collect(Collectors.toMap(
                        Patient::getBedNumber,
                        p -> p.getFirstName() + " " + p.getLastName(),
                        (a, b) -> a
                ));

        List<BedDto> result = beds.stream()
                .map(bed -> BedDto.from(bed, patientNames.get(bed.getBedNumber())))
                .toList();

        return ApiResponse.ok(result);
    }

    @GetMapping("/hygiene")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','HYGIENE')")
    public ApiResponse<List<HygieneBedDto>> getHygieneBeds() {
        // Beds waiting for or undergoing cleaning (CLEANING, READY, or OCCUPIED without an admitted patient)
        Map<String, String> admittedByBed = patientRepository.findByStatus(PatientStatus.ADMITTED)
                .stream()
                .filter(p -> p.getBedNumber() != null && p.getUnit() != null)
                .collect(Collectors.toMap(
                        p -> p.getUnit() + ":" + p.getBedNumber(),
                        p -> p.getFirstName() + " " + p.getLastName(),
                        (a, b) -> a
                ));

        List<Bed> hygieneBeds = bedRepository.findAll().stream()
                .filter(b -> switch (b.getState()) {
                    case CLEANING, READY -> true;
                    case OCCUPIED -> !admittedByBed.containsKey(b.getUnit() + ":" + b.getBedNumber());
                    default -> false;
                })
                .toList();

        // Most recently discharged patient per bed position
        Map<String, Patient> dischargedByBed = patientRepository.findByStatus(PatientStatus.CONGEDIE)
                .stream()
                .filter(p -> p.getBedNumber() != null && p.getUnit() != null)
                .collect(Collectors.toMap(
                        p -> p.getUnit() + ":" + p.getBedNumber(),
                        p -> p,
                        (a, b) -> {
                            if (a.getDischargeDate() == null) return b;
                            if (b.getDischargeDate() == null) return a;
                            return a.getDischargeDate().isAfter(b.getDischargeDate()) ? a : b;
                        }
                ));

        List<HygieneBedDto> result = hygieneBeds.stream()
                .map(bed -> {
                    Patient p = dischargedByBed.get(bed.getUnit() + ":" + bed.getBedNumber());
                    return HygieneBedDto.builder()
                            .id(bed.getId())
                            .unit(bed.getUnit())
                            .bedNumber(bed.getBedNumber())
                            .state(bed.getState())
                            .mrdNumber(p != null ? p.getMrdNumber() : null)
                            .patientAge(p != null ? p.getAge() : null)
                            .dischargeDate(p != null && p.getDischargeDate() != null
                                    ? p.getDischargeDate().toLocalDate().toString() : null)
                            .diagnosis(p != null ? p.getDiagnosis() : null)
                            .build();
                })
                .toList();

        return ApiResponse.ok(result);
    }

    @PatchMapping("/{id}/state")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','HYGIENE')")
    public ApiResponse<BedDto> updateBedState(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lit introuvable"));

        String stateStr = body.get("state");
        try {
            bed.setState(BedState.valueOf(stateStr));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "État invalide: " + stateStr);
        }

        Bed saved = bedRepository.save(bed);
        return ApiResponse.ok(BedDto.from(saved, null));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT')")
    public ApiResponse<BedDto> assignBed(@PathVariable Long id,
                                         @RequestBody Map<String, Object> body) {
        String patientMrd = (String) body.get("patientMrd");
        if (patientMrd == null || patientMrd.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MRD patient requis");
        }
        Long stretcherId = null;
        Object stretcherIdRaw = body.get("stretcherId");
        if (stretcherIdRaw != null) {
            try { stretcherId = Long.valueOf(stretcherIdRaw.toString()); } catch (NumberFormatException ignored) {}
        }

        BedAssignmentService.AssignmentResult result = bedAssignmentService.assignBed(id, patientMrd, stretcherId);
        return ApiResponse.ok(BedDto.from(result.bed(), result.patientName()));
    }
}
