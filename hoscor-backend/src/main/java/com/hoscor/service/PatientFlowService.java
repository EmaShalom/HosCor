package com.hoscor.service;

import com.hoscor.domain.entity.Transfer;
import com.hoscor.domain.enums.TransferStatus;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.TransferRepository;
import com.hoscor.dto.IntelligenceResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PatientFlowService {

    @PersistenceContext
    private EntityManager entityManager;

    private final PatientRepository patientRepository;
    private final TransferRepository transferRepository;

    // ================================================================
    // Waiting patients summary
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getWaitingCount() {
        String sql = """
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE s.risk_level = 'ELEVE')  AS high_risk,
                COUNT(*) FILTER (WHERE s.risk_level = 'MOYEN')  AS medium_risk,
                COUNT(*) FILTER (WHERE s.risk_level = 'FAIBLE') AS low_risk,
                ROUND(CAST(AVG(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60) AS numeric), 1) AS avg_wait_min
            FROM stretchers s
            WHERE s.status = 'WAITING'
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        if (rows.isEmpty()) {
            return IntelligenceResult.metric("Aucun patient en attente sur civière.", Collections.emptyMap());
        }
        Object[] row = rows.get(0);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total",      toLong(row[0]));
        data.put("highRisk",   toLong(row[1]));
        data.put("mediumRisk", toLong(row[2]));
        data.put("lowRisk",    toLong(row[3]));
        data.put("avgWaitMin", toDouble(row[4]));

        String message = String.format(
            "Il y a %d patient(s) en attente: %d à risque ÉLEVÉ, %d MOYEN, %d FAIBLE. Attente moyenne: %.0f min.",
            toLong(row[0]), toLong(row[1]), toLong(row[2]), toLong(row[3]), toDouble(row[4])
        );
        return IntelligenceResult.metric(message, data);
    }

    // ================================================================
    // Most urgent waiting patients (top 5)
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getMostUrgent() {
        String sql = buildPriorityQuery(5);
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = mapStretcherRows(rows);

        String message = data.isEmpty()
            ? "Aucun patient en attente urgente."
            : String.format("Top %d patients les plus urgents en attente.", data.size());
        return IntelligenceResult.cards(message, data);
    }

    // ================================================================
    // Top 1 priority patient
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getPriorityPatient() {
        String sql = buildPriorityQuery(1);
        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = mapStretcherRows(rows);

        String message = data.isEmpty()
            ? "Aucun patient en attente."
            : String.format("Patient prioritaire: %s %s (CIV: %s) — Risque %s, attente: %s min.",
                data.get(0).get("firstName"), data.get(0).get("lastName"),
                data.get(0).get("stretcherNumber"), data.get(0).get("riskLevel"),
                data.get(0).get("waitMinutes"));
        return IntelligenceResult.cards(message, data);
    }

    // ================================================================
    // Waiting patients grouped by diagnosis
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getWaitingByDiagnosis() {
        String sql = """
            SELECT p.diagnosis, COUNT(*) AS count,
                COUNT(*) FILTER (WHERE s.risk_level = 'ELEVE') AS high,
                ROUND(CAST(AVG(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60) AS numeric), 1) AS avg_wait
            FROM stretchers s
            JOIN patients p ON s.patient_id = p.id
            WHERE s.status = 'WAITING'
            GROUP BY p.diagnosis
            ORDER BY count DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("diagnosis", row[0]);
            entry.put("count",     toLong(row[1]));
            entry.put("highRisk",  toLong(row[2]));
            entry.put("avgWait",   toDouble(row[3]));
            data.add(entry);
        }

        String message = data.isEmpty()
            ? "Aucun patient en attente."
            : String.format("Patients en attente répartis par diagnostic (%d groupes).", data.size());
        return IntelligenceResult.table(message, data);
    }

    // ================================================================
    // Transfer status for a specific patient (extract MRD from message)
    // ================================================================
    public IntelligenceResult getTransferStatus(String message) {
        String mrd = extractMrd(message);
        if (mrd == null) {
            return IntelligenceResult.text("Veuillez préciser le numéro MRD du patient (ex: MRD-2024-001).");
        }

        Optional<com.hoscor.domain.entity.Patient> patientOpt =
            patientRepository.findByMrdNumber(mrd.toUpperCase());
        if (patientOpt.isEmpty()) {
            return IntelligenceResult.text("Patient " + mrd + " introuvable.");
        }

        List<Transfer> transfers = transferRepository.findByPatient_Id(patientOpt.get().getId());
        if (transfers.isEmpty()) {
            return IntelligenceResult.text("Aucun transfert trouvé pour " + mrd + ".");
        }

        List<Map<String, Object>> data = new ArrayList<>();
        for (Transfer t : transfers) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("transferId",           t.getId());
            entry.put("type",                 t.getTransferType());
            entry.put("status",               t.getStatus());
            entry.put("originHospital",       t.getOriginHospital());
            entry.put("destinationHospital",  t.getDestinationHospital());
            entry.put("scheduledAt",          t.getScheduledAt() != null ? t.getScheduledAt().toString() : null);
            entry.put("transportType",        t.getTransportType());
            data.add(entry);
        }

        Transfer latest = transfers.get(transfers.size() - 1);
        String msg = String.format("Transfert pour %s — Statut: %s, Prévu: %s.",
            mrd, latest.getStatus(), latest.getScheduledAt() != null ? latest.getScheduledAt().toString() : "N/A");
        return IntelligenceResult.table(msg, data);
    }

    // ================================================================
    // Today's and pending transfers
    // ================================================================
    public IntelligenceResult getTransferList() {
        List<Transfer> transfers = transferRepository.findTodayAndPending(com.hoscor.domain.enums.TransferStatus.EN_ATTENTE);
        List<Map<String, Object>> data = new ArrayList<>();

        for (Transfer t : transfers) {
            com.hoscor.domain.entity.Patient p = t.getPatient();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id",                  t.getId());
            entry.put("patientName",         p != null ? p.getFirstName() + " " + p.getLastName() : "Patient inconnu");
            entry.put("mrdNumber",           p != null ? p.getMrdNumber() : "N/A");
            entry.put("type",                t.getTransferType());
            entry.put("status",              t.getStatus());
            entry.put("originHospital",      t.getOriginHospital());
            entry.put("destinationHospital", t.getDestinationHospital());
            entry.put("scheduledAt",         t.getScheduledAt() != null ? t.getScheduledAt().toString() : null);
            entry.put("transportType",       t.getTransportType());
            data.add(entry);
        }

        String msg = String.format("%d transfert(s) actif(s) ou prévu(s) aujourd'hui.", data.size());
        return IntelligenceResult.table(msg, data);
    }

    // ================================================================
    // Admission stats — last 7 days
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getAdmissionStats() {
        String sql = """
            SELECT DATE(admission_date) AS day, COUNT(*) AS admissions
            FROM patients
            WHERE admission_date >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(admission_date)
            ORDER BY day DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();
        long total = 0;

        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("day",        row[0] != null ? row[0].toString() : null);
            entry.put("admissions", toLong(row[1]));
            data.add(entry);
            total += toLong(row[1]);
        }

        String msg = String.format("%d admission(s) au cours des 7 derniers jours.", total);
        return IntelligenceResult.chart(msg, data);
    }

    // ================================================================
    // Average LOS by unit (discharged patients)
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getAverageLOS() {
        String sql = """
            SELECT unit,
                ROUND(CAST(AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date))/3600) AS numeric), 1) AS avg_los_hours,
                COUNT(*) AS discharged_count
            FROM patients
            WHERE status = 'CONGEDIE' AND discharge_date IS NOT NULL AND unit IS NOT NULL
            GROUP BY unit
            ORDER BY avg_los_hours DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",           row[0]);
            entry.put("avgLosHours",    toDouble(row[1]));
            entry.put("dischargedCount", toLong(row[2]));
            data.add(entry);
        }

        String msg = data.isEmpty()
            ? "Aucune donnée de séjour disponible."
            : String.format("Durée de séjour moyenne par unité (%d unités analysées).", data.size());
        return IntelligenceResult.table(msg, data);
    }

    // ================================================================
    // DAMA rate
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getDamaRate() {
        String sql = """
            SELECT
                COUNT(*) FILTER (WHERE discharge_reason = 'DAMA') AS dama_count,
                COUNT(*) AS total_discharged,
                ROUND(COUNT(*) FILTER (WHERE discharge_reason = 'DAMA') * 100.0 / NULLIF(COUNT(*),0), 2) AS dama_rate_pct
            FROM patients
            WHERE status = 'CONGEDIE'
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        if (rows.isEmpty()) {
            return IntelligenceResult.metric("Aucune donnée DAMA disponible.", Collections.emptyMap());
        }
        Object[] row = rows.get(0);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("damaCount",      toLong(row[0]));
        data.put("totalDischarged", toLong(row[1]));
        data.put("damaRatePct",    toDouble(row[2]));

        String msg = String.format("Taux DAMA: %.2f%% (%d sur %d patients congédiés).",
            toDouble(row[2]), toLong(row[0]), toLong(row[1]));
        return IntelligenceResult.metric(msg, data);
    }

    // ================================================================
    // Admission trends — last 30 days
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getAdmissionTrends() {
        String sql = """
            SELECT DATE(admission_date) AS day, COUNT(*) AS admissions
            FROM patients
            WHERE admission_date >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(admission_date)
            ORDER BY day ASC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();
        long total = 0;

        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("day",        row[0] != null ? row[0].toString() : null);
            entry.put("admissions", toLong(row[1]));
            data.add(entry);
            total += toLong(row[1]);
        }

        String msg = String.format("Tendance sur 30 jours: %d admissions totales sur %d jours.", total, data.size());
        return IntelligenceResult.chart(msg, data);
    }

    // ================================================================
    // Helpers
    // ================================================================

    private String buildPriorityQuery(int limit) {
        return """
            SELECT s.stretcher_number, s.risk_level, s.wait_since, s.target_unit,
                p.first_name, p.last_name, p.age, p.diagnosis, p.mrd_number,
                ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - s.wait_since)) AS numeric)/60, 0) AS wait_min,
                CASE s.risk_level
                    WHEN 'ELEVE'  THEN 100
                    WHEN 'MOYEN'  THEN 50
                    WHEN 'FAIBLE' THEN 10
                END + LEAST(ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - s.wait_since)) AS numeric)/60, 0), 60) AS priority_score
            FROM stretchers s
            JOIN patients p ON s.patient_id = p.id
            WHERE s.status = 'WAITING'
            ORDER BY priority_score DESC, s.wait_since ASC
            LIMIT """ + limit;
    }

    private List<Map<String, Object>> mapStretcherRows(List<Object[]> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("stretcherNumber", row[0]);
            entry.put("riskLevel",       row[1]);
            entry.put("waitSince",       row[2] != null ? row[2].toString() : null);
            entry.put("targetUnit",      row[3]);
            entry.put("firstName",       row[4]);
            entry.put("lastName",        row[5]);
            entry.put("age",             toLong(row[6]));
            entry.put("diagnosis",       row[7]);
            entry.put("mrdNumber",       row[8]);
            entry.put("waitMinutes",     toDouble(row[9]));
            entry.put("priorityScore",   toDouble(row[10]));
            data.add(entry);
        }
        return data;
    }

    private String extractMrd(String message) {
        Pattern p = Pattern.compile("(MRD-\\d{4}-\\d{3})", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(message);
        if (m.find()) return m.group(1).toUpperCase();
        return null;
    }

    private long toLong(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }
}
