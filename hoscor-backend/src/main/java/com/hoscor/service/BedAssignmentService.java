package com.hoscor.service;

import com.hoscor.domain.entity.Bed;
import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.enums.BedState;
import com.hoscor.domain.enums.PatientStatus;
import com.hoscor.domain.enums.StretcherStatus;
import com.hoscor.domain.repository.BedRepository;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.StretcherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BedAssignmentService {

    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;
    private final StretcherRepository stretcherRepository;

    public record AssignmentResult(Bed bed, String patientName) {}

    @Transactional
    public AssignmentResult assignBed(Long bedId, String patientMrd, Long stretcherId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lit introuvable"));

        if (bed.getState() == BedState.OCCUPIED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce lit est déjà occupé");
        }

        Patient patient = patientRepository.findByMrdNumber(patientMrd)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient introuvable: " + patientMrd));

        bed.setState(BedState.OCCUPIED);
        bed.setLastUpdated(LocalDateTime.now());
        bedRepository.save(bed);

        patient.setBedNumber(bed.getBedNumber());
        patient.setUnit(bed.getUnit());
        patient.setStatus(PatientStatus.ADMITTED);
        patientRepository.save(patient);

        if (stretcherId != null) {
            stretcherRepository.findById(stretcherId).ifPresent(s -> {
                s.setStatus(StretcherStatus.ASSIGNED);
                stretcherRepository.save(s);
            });
        }

        return new AssignmentResult(bed, patient.getFirstName() + " " + patient.getLastName());
    }
}
