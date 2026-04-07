package com.hoscor.controller;

import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.entity.Transfer;
import com.hoscor.domain.enums.TransferStatus;
import com.hoscor.domain.enums.TransferType;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.TransferRepository;
import com.hoscor.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferRepository transferRepository;
    private final PatientRepository patientRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR','CHEF_UNITE')")
    public ApiResponse<List<Transfer>> getAllTransfers() {
        return ApiResponse.ok(transferRepository.findAllByOrderByScheduledAtDesc());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR')")
    public ApiResponse<Transfer> createTransfer(@RequestBody Map<String, Object> body) {
        String patientMrd = (String) body.get("patientMrd");
        if (patientMrd == null || patientMrd.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MRD patient requis");
        }

        Patient patient = patientRepository.findByMrdNumber(patientMrd)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable: " + patientMrd));

        String typeStr = (String) body.getOrDefault("transferType", "ENTRANT");
        TransferType transferType;
        try {
            transferType = TransferType.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type invalide: " + typeStr);
        }

        String statusStr = (String) body.getOrDefault("status", "EN_ATTENTE");
        TransferStatus status;
        try {
            status = TransferStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            status = TransferStatus.EN_ATTENTE;
        }

        LocalDateTime scheduledAt;
        Object scheduledAtRaw = body.get("scheduledAt");
        if (scheduledAtRaw != null && !scheduledAtRaw.toString().isBlank()) {
            try {
                scheduledAt = LocalDateTime.parse(scheduledAtRaw.toString());
            } catch (Exception e) {
                scheduledAt = LocalDateTime.now();
            }
        } else {
            scheduledAt = LocalDateTime.now();
        }

        Transfer transfer = Transfer.builder()
                .patient(patient)
                .transferType(transferType)
                .originHospital((String) body.get("originHospital"))
                .destinationHospital((String) body.get("destinationHospital"))
                .scheduledAt(scheduledAt)
                .status(status)
                .transportType((String) body.get("transportType"))
                .notes((String) body.get("notes"))
                .createdAt(LocalDateTime.now())
                .build();

        return ApiResponse.ok(transferRepository.save(transfer));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','COORDONNATEUR')")
    public ApiResponse<Transfer> updateStatus(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfert introuvable"));

        String statusStr = body.get("status");
        try {
            transfer.setStatus(TransferStatus.valueOf(statusStr));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide: " + statusStr);
        }

        return ApiResponse.ok(transferRepository.save(transfer));
    }
}
