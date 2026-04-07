package com.hoscor.service;

import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.enums.BedState;
import com.hoscor.domain.enums.DischargeReason;
import com.hoscor.domain.enums.PatientStatus;
import com.hoscor.domain.repository.BedRepository;
import com.hoscor.domain.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PatientDischargeService {

    private final PatientRepository patientRepository;
    private final BedRepository bedRepository;

    @Transactional
    public Patient discharge(String mrd, String dischargeReasonStr) {
        Patient patient = patientRepository.findByMrdNumber(mrd)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable: " + mrd));

        patient.setStatus(PatientStatus.CONGEDIE);
        patient.setDischargeDate(LocalDateTime.now());

        if (dischargeReasonStr != null) {
            try {
                patient.setDischargeReason(DischargeReason.valueOf(dischargeReasonStr));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Raison invalide: " + dischargeReasonStr);
            }
        } else {
            patient.setDischargeReason(DischargeReason.REGULAR);
        }

        if (patient.getBedNumber() != null && patient.getUnit() != null) {
            bedRepository.findByUnitAndState(patient.getUnit(), BedState.OCCUPIED)
                    .stream()
                    .filter(b -> patient.getBedNumber().equals(b.getBedNumber()))
                    .findFirst()
                    .ifPresent(bed -> {
                        bed.setState(BedState.CLEANING);
                        bedRepository.save(bed);
                    });
        }

        patient.setBedNumber(null);
        patient.setUnit(null);

        return patientRepository.save(patient);
    }
}
