package com.hoscor.controller;

import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.entity.Stretcher;
import com.hoscor.domain.enums.PatientStatus;
import com.hoscor.domain.enums.RiskLevel;
import com.hoscor.domain.enums.StretcherStatus;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.StretcherRepository;
import com.hoscor.dto.ApiResponse;
import com.hoscor.dto.StretcherDto;
import com.hoscor.service.PatientDischargeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRepository patientRepository;
    private final StretcherRepository stretcherRepository;
    private final PatientDischargeService patientDischargeService;

    @GetMapping("/waiting")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','URGENCE','GESTIONNAIRE_LIT','CHEF_UNITE','COMMIS_ETAGE')")
    public ApiResponse<List<StretcherDto>> getWaitingPatients() {
        List<Stretcher> stretchers = stretcherRepository.findByStatus(StretcherStatus.WAITING);
        List<StretcherDto> result = stretchers.stream()
                .map(StretcherDto::from)
                .toList();
        return ApiResponse.ok(result);
    }

    @GetMapping("/admitted")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT','CHEF_UNITE','COMMIS_ETAGE')")
    public ApiResponse<List<Patient>> getAdmittedPatients() {
        return ApiResponse.ok(patientRepository.findByStatus(PatientStatus.ADMITTED));
    }

    @GetMapping("/{mrd}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','URGENCE','GESTIONNAIRE_LIT','CHEF_UNITE','COMMIS_ETAGE')")
    public ApiResponse<Patient> getPatient(@PathVariable String mrd) {
        Patient patient = patientRepository.findByMrdNumber(mrd)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable: " + mrd));
        return ApiResponse.ok(patient);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','URGENCE','GESTIONNAIRE_LIT')")
    public ApiResponse<Patient> createPatient(@RequestBody Patient patient) {
        if (patient.getAdmissionDate() == null) {
            patient.setAdmissionDate(LocalDateTime.now());
        }
        return ApiResponse.ok(patientRepository.save(patient));
    }

    @PutMapping("/{mrd}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT')")
    public ApiResponse<Patient> updatePatient(@PathVariable String mrd,
                                              @RequestBody Patient updates) {
        Patient patient = patientRepository.findByMrdNumber(mrd)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable: " + mrd));

        if (updates.getFirstName() != null) patient.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) patient.setLastName(updates.getLastName());
        if (updates.getDiagnosis() != null) patient.setDiagnosis(updates.getDiagnosis());
        if (updates.getBedNumber() != null) patient.setBedNumber(updates.getBedNumber());
        if (updates.getUnit() != null) patient.setUnit(updates.getUnit());
        if (updates.getStatus() != null) patient.setStatus(updates.getStatus());

        return ApiResponse.ok(patientRepository.save(patient));
    }

    /**
     * Place a patient on a stretcher for ER triage.
     * Body: { patientMrd, riskLevel, targetUnit }
     * If the patient has an existing WAITING stretcher, update it; otherwise create one.
     */
    @PostMapping("/stretcher")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','URGENCE')")
    public ApiResponse<StretcherDto> addToStretcher(@RequestBody Map<String, String> body) {
        String mrd = body.get("patientMrd");
        if (mrd == null || mrd.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MRD patient requis");
        }
        Patient patient = patientRepository.findByMrdNumber(mrd)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable: " + mrd));

        String riskStr = body.getOrDefault("riskLevel", "FAIBLE").toUpperCase();
        RiskLevel riskLevel;
        try {
            riskLevel = RiskLevel.valueOf(riskStr);
        } catch (IllegalArgumentException e) {
            riskLevel = RiskLevel.FAIBLE;
        }

        // Reuse existing WAITING stretcher for this patient, or create new
        Stretcher stretcher = stretcherRepository.findByStatus(StretcherStatus.WAITING)
                .stream()
                .filter(s -> s.getPatient() != null && s.getPatient().getMrdNumber().equals(mrd))
                .findFirst()
                .orElseGet(() -> {
                    long count = stretcherRepository.count();
                    String number = "CIV-" + String.format("%03d", count + 1);
                    return Stretcher.builder()
                            .stretcherNumber(number)
                            .waitSince(LocalDateTime.now())
                            .build();
                });

        stretcher.setPatient(patient);
        stretcher.setRiskLevel(riskLevel);
        stretcher.setStatus(StretcherStatus.WAITING);
        stretcher.setTargetUnit(body.get("targetUnit"));

        return ApiResponse.ok(StretcherDto.from(stretcherRepository.save(stretcher)));
    }

    @PatchMapping("/{mrd}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','GESTIONNAIRE_LIT')")
    public ApiResponse<Patient> dischargePatient(@PathVariable String mrd,
                                                 @RequestBody Map<String, String> body) {
        return ApiResponse.ok(patientDischargeService.discharge(mrd, body.get("dischargeReason")));
    }
}
