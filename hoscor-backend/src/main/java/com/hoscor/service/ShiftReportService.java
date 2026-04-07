package com.hoscor.service;

import com.hoscor.dto.ShiftReportDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftReportService {

    @PersistenceContext
    private EntityManager entityManager;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DT_FMT   = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public ShiftReportDto generateReport(String dateStr, String shift) {
        LocalDate date;
        try {
            date = LocalDate.parse(dateStr, DATE_FMT);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date invalide. Format attendu: yyyy-MM-dd");
        }

        LocalDateTime start;
        LocalDateTime end;
        String shiftLabel;

        switch (shift.toUpperCase()) {
            case "DAY" -> {
                start = date.atTime(LocalTime.of(8, 0));
                end   = date.atTime(LocalTime.of(16, 0));
                shiftLabel = "Quart de jour (08:00–16:00)";
            }
            case "EVENING" -> {
                start = date.atTime(LocalTime.of(16, 0));
                end   = date.plusDays(1).atTime(LocalTime.MIDNIGHT);
                shiftLabel = "Quart de soir (16:00–00:00)";
            }
            case "NIGHT" -> {
                start = date.atTime(LocalTime.MIDNIGHT);
                end   = date.atTime(LocalTime.of(8, 0));
                shiftLabel = "Quart de nuit (00:00–08:00)";
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quart invalide. Valeurs acceptées: DAY, EVENING, NIGHT");
        }

        try {
            List<Map<String, Object>> admissions  = queryAdmissions(start, end);
            List<Map<String, Object>> discharges  = queryDischarges(start, end);
            List<Map<String, Object>> transfers   = queryTransfers(start, end);
            List<Map<String, Object>> waiting     = queryWaiting();

            return ShiftReportDto.builder()
                    .date(dateStr)
                    .shift(shift.toUpperCase())
                    .shiftLabel(shiftLabel)
                    .startTime(start.format(DT_FMT))
                    .endTime(end.format(DT_FMT))
                    .admissions(admissions)
                    .discharges(discharges)
                    .transfers(transfers)
                    .waitingPatients(waiting)
                    .admissionCount(admissions.size())
                    .dischargeCount(discharges.size())
                    .transferCount(transfers.size())
                    .waitingCount(waiting.size())
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur lors de la génération du rapport: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> queryAdmissions(LocalDateTime start, LocalDateTime end) {
        String sql = """
            SELECT p.mrd_number, p.first_name, p.last_name, p.age, p.gender,
                   p.diagnosis, p.unit, p.bed_number, p.admission_date
            FROM patients p
            WHERE p.admission_date >= :start AND p.admission_date < :end
              AND p.status = 'ADMITTED'
            ORDER BY p.admission_date
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end",   Timestamp.valueOf(end))
                .getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("mrdNumber",     row[0]);
            entry.put("firstName",     row[1]);
            entry.put("lastName",      row[2]);
            entry.put("age",           row[3]);
            entry.put("gender",        row[4]);
            entry.put("diagnosis",     row[5]);
            entry.put("unit",          row[6]);
            entry.put("bedNumber",     row[7]);
            entry.put("admissionDate", row[8] != null ? row[8].toString() : null);
            result.add(entry);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> queryDischarges(LocalDateTime start, LocalDateTime end) {
        String sql = """
            SELECT p.mrd_number, p.first_name, p.last_name, p.age,
                   p.diagnosis, p.unit, p.discharge_date, p.discharge_reason
            FROM patients p
            WHERE p.discharge_date >= :start AND p.discharge_date < :end
              AND p.status = 'CONGEDIE'
            ORDER BY p.discharge_date
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end",   Timestamp.valueOf(end))
                .getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("mrdNumber",      row[0]);
            entry.put("firstName",      row[1]);
            entry.put("lastName",       row[2]);
            entry.put("age",            row[3]);
            entry.put("diagnosis",      row[4]);
            entry.put("unit",           row[5]);
            entry.put("dischargeDate",  row[6] != null ? row[6].toString() : null);
            entry.put("dischargeReason", row[7]);
            result.add(entry);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> queryTransfers(LocalDateTime start, LocalDateTime end) {
        String sql = """
            SELECT t.id, t.transfer_type, t.status, t.scheduled_at,
                   t.origin_hospital, t.destination_hospital, t.transport_type,
                   p.first_name, p.last_name, p.mrd_number, p.diagnosis
            FROM transfers t
            JOIN patients p ON t.patient_id = p.id
            WHERE t.scheduled_at >= :start AND t.scheduled_at < :end
            ORDER BY t.scheduled_at
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter("start", Timestamp.valueOf(start))
                .setParameter("end",   Timestamp.valueOf(end))
                .getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id",                  row[0]);
            entry.put("transferType",        row[1]);
            entry.put("status",              row[2]);
            entry.put("scheduledAt",         row[3] != null ? row[3].toString() : null);
            entry.put("originHospital",      row[4]);
            entry.put("destinationHospital", row[5]);
            entry.put("transportType",       row[6]);
            entry.put("firstName",           row[7]);
            entry.put("lastName",            row[8]);
            entry.put("mrdNumber",           row[9]);
            entry.put("diagnosis",           row[10]);
            result.add(entry);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> queryWaiting() {
        String sql = """
            SELECT s.stretcher_number, s.risk_level, s.wait_since, s.target_unit,
                   p.first_name, p.last_name, p.age, p.diagnosis, p.mrd_number,
                   ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - s.wait_since)) AS numeric)/60, 0) AS wait_min
            FROM stretchers s
            JOIN patients p ON s.patient_id = p.id
            WHERE s.status = 'WAITING'
            ORDER BY
                CASE s.risk_level WHEN 'ELEVE' THEN 1 WHEN 'MOYEN' THEN 2 ELSE 3 END,
                s.wait_since ASC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("stretcherNumber", row[0]);
            entry.put("riskLevel",       row[1]);
            entry.put("waitSince",       row[2] != null ? row[2].toString() : null);
            entry.put("targetUnit",      row[3]);
            entry.put("firstName",       row[4]);
            entry.put("lastName",        row[5]);
            entry.put("age",             row[6]);
            entry.put("diagnosis",       row[7]);
            entry.put("mrdNumber",       row[8]);
            entry.put("waitMinutes",     row[9]);
            result.add(entry);
        }
        return result;
    }
}
