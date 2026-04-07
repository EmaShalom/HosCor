package com.hoscor.service;

import com.hoscor.domain.entity.Bed;
import com.hoscor.domain.entity.Patient;
import com.hoscor.domain.entity.Stretcher;
import com.hoscor.domain.enums.BedState;
import com.hoscor.domain.enums.RiskLevel;
import com.hoscor.domain.enums.StretcherStatus;
import com.hoscor.domain.repository.BedRepository;
import com.hoscor.domain.repository.PatientRepository;
import com.hoscor.domain.repository.StretcherRepository;
import com.hoscor.dto.IntelligenceResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DecisionEngineService {

    @PersistenceContext
    private EntityManager entityManager;

    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;
    private final StretcherRepository stretcherRepository;

    private static final Map<String, String> DIAGNOSIS_UNIT_MAP = new LinkedHashMap<>();

    static {
        DIAGNOSIS_UNIT_MAP.put("cardiaque",       "2N");
        DIAGNOSIS_UNIT_MAP.put("cardiologie",     "2N");
        DIAGNOSIS_UNIT_MAP.put("fibrillation",    "2N");
        DIAGNOSIS_UNIT_MAP.put("embolie",         "2N");
        DIAGNOSIS_UNIT_MAP.put("aki",             "3N");
        DIAGNOSIS_UNIT_MAP.put("rénal",           "3N");
        DIAGNOSIS_UNIT_MAP.put("renal",           "3N");
        DIAGNOSIS_UNIT_MAP.put("néphro",          "3N");
        DIAGNOSIS_UNIT_MAP.put("nephro",          "3N");
        DIAGNOSIS_UNIT_MAP.put("insuffisance rénale", "3N");
        DIAGNOSIS_UNIT_MAP.put("sepsis",          "2S");
        DIAGNOSIS_UNIT_MAP.put("choc",            "2S");
        DIAGNOSIS_UNIT_MAP.put("soins intensifs", "2S");
        DIAGNOSIS_UNIT_MAP.put("critique",        "2S");
        DIAGNOSIS_UNIT_MAP.put("réanimation",     "2S");
        DIAGNOSIS_UNIT_MAP.put("avc",             "3S");
        DIAGNOSIS_UNIT_MAP.put("pneumonie",       "3S");
        DIAGNOSIS_UNIT_MAP.put("diabète",         "3S");
        DIAGNOSIS_UNIT_MAP.put("diabete",         "3S");
        DIAGNOSIS_UNIT_MAP.put("cellulite",       "3S");
        DIAGNOSIS_UNIT_MAP.put("médecine",        "3S");
        DIAGNOSIS_UNIT_MAP.put("fracture",        "CHIR");
        DIAGNOSIS_UNIT_MAP.put("chirurgie",       "CHIR");
        DIAGNOSIS_UNIT_MAP.put("post-op",         "CHIR");
    }

    // ================================================================
    // Match patient to unit based on diagnosis keywords
    // ================================================================
    public IntelligenceResult matchPatientToUnit(String message) {
        String lowerMsg = message.toLowerCase();
        String recommendedUnit = null;
        String matchedKeyword = null;

        for (Map.Entry<String, String> entry : DIAGNOSIS_UNIT_MAP.entrySet()) {
            if (lowerMsg.contains(entry.getKey())) {
                recommendedUnit = entry.getValue();
                matchedKeyword = entry.getKey();
                break;
            }
        }

        if (recommendedUnit == null) {
            return IntelligenceResult.text(
                "Je n'ai pas pu identifier l'unité recommandée. Précisez le diagnostic (ex: cardiaque, sepsis, AKI, pneumonie, fracture)."
            );
        }

        long available = bedRepository.countByUnitAndState(recommendedUnit, BedState.AVAILABLE)
                       + bedRepository.countByUnitAndState(recommendedUnit, BedState.READY);
        long occupied  = bedRepository.countByUnitAndState(recommendedUnit, BedState.OCCUPIED);
        long total     = bedRepository.findByUnit(recommendedUnit).size();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("recommendedUnit",     recommendedUnit);
        data.put("unitName",            unitName(recommendedUnit));
        data.put("matchedKeyword",      matchedKeyword);
        data.put("availableBeds",       available);
        data.put("occupiedBeds",        occupied);
        data.put("totalBeds",           total);
        data.put("occupancyRatePct",    total > 0 ? Math.round((double) occupied / total * 1000.0) / 10.0 : 0.0);

        String msg = String.format(
            "Pour un diagnostic lié à '%s', l'unité recommandée est **%s – %s**. " +
            "%d lit(s) disponible(s) sur %d (%d occupés).",
            matchedKeyword, recommendedUnit, unitName(recommendedUnit), available, total, occupied
        );
        if (available == 0) {
            msg += " ⚠️ Aucun lit disponible — vérifiez les nettoyages ou congés prévus.";
        }

        return IntelligenceResult.metric(msg, data);
    }

    // ================================================================
    // Critical alerts
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getCriticalAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();

        // 1. Patients ELEVE waiting > 30 min
        List<Stretcher> highRisk = stretcherRepository.findByStatusAndRiskLevel(StretcherStatus.WAITING, RiskLevel.ELEVE);
        for (Stretcher s : highRisk) {
            long minutes = ChronoUnit.MINUTES.between(s.getWaitSince(), LocalDateTime.now());
            if (minutes > 30 && s.getPatient() != null) {
                Map<String, Object> a = new LinkedHashMap<>();
                a.put("type",            "WAIT_CRITIQUE");
                a.put("severity",        "CRITICAL");
                a.put("stretcherNumber", s.getStretcherNumber());
                a.put("patientName",     s.getPatient().getFirstName() + " " + s.getPatient().getLastName());
                a.put("riskLevel",       s.getRiskLevel());
                a.put("waitMinutes",     minutes);
                a.put("targetUnit",      s.getTargetUnit());
                a.put("description",     String.format("Patient %s (CIV: %s) à risque ÉLEVÉ attend depuis %d min.",
                    s.getPatient().getLastName(), s.getStretcherNumber(), minutes));
                alerts.add(a);
            }
        }

        // 2. Units >= 95% saturation
        String satSql = """
            SELECT unit,
                ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0), 1) AS rate_pct
            FROM beds GROUP BY unit HAVING
                COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 1.0 / NULLIF(COUNT(*),0) >= 0.95
            """;
        List<Object[]> satRows = entityManager.createNativeQuery(satSql).getResultList();
        for (Object[] row : satRows) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type",        "SATURATION_CRITIQUE");
            a.put("severity",    "CRITICAL");
            a.put("unit",        row[0]);
            a.put("unitName",    unitName((String) row[0]));
            a.put("ratePct",     toDouble(row[1]));
            a.put("description", String.format("Unité %s (%s) à %.1f%% de saturation — CRITIQUE.",
                row[0], unitName((String) row[0]), toDouble(row[1])));
            alerts.add(a);
        }

        // 3. Beds in CLEANING > 30 min
        String cleanSql = """
            SELECT unit, bed_number,
                EXTRACT(EPOCH FROM (NOW() - last_updated))/60 AS minutes_cleaning
            FROM beds WHERE state = 'CLEANING'
                AND EXTRACT(EPOCH FROM (NOW() - last_updated))/60 > 30
            """;
        List<Object[]> cleanRows = entityManager.createNativeQuery(cleanSql).getResultList();
        for (Object[] row : cleanRows) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("type",        "CLEANING_LONG");
            a.put("severity",    "WARNING");
            a.put("unit",        row[0]);
            a.put("bedNumber",   row[1]);
            a.put("minutesCleaning", (long) toDouble(row[2]));
            a.put("description", String.format("Lit %s (%s) en nettoyage depuis %d min — dépasse 30 min.",
                row[1], row[0], (long) toDouble(row[2])));
            alerts.add(a);
        }

        String msg = alerts.isEmpty()
            ? "Aucune alerte critique en ce moment."
            : String.format("%d alerte(s) active(s): %d critique(s), %d avertissement(s).",
                alerts.size(),
                alerts.stream().filter(a -> "CRITICAL".equals(a.get("severity"))).count(),
                alerts.stream().filter(a -> "WARNING".equals(a.get("severity"))).count());

        return IntelligenceResult.alert(msg, alerts);
    }

    // ================================================================
    // Forecast today (next 24h window: 0-24h)
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult forecastToday() {
        return buildForecast("aujourd'hui (0-24h)", 0, 24);
    }

    // ================================================================
    // Forecast tomorrow (24-48h window)
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult forecastTomorrow() {
        return buildForecast("demain (24-48h)", 24, 48);
    }

    private IntelligenceResult buildForecast(String label, int startHours, int endHours) {
        // Pure JPA — no native SQL avoids PostgreSQL NUMERIC || text type errors entirely
        List<com.hoscor.domain.entity.Patient> admitted =
            patientRepository.findByStatus(com.hoscor.domain.enums.PatientStatus.ADMITTED);

        long totalWaiting   = stretcherRepository.countByStatus(StretcherStatus.WAITING);
        long totalAvailable = bedRepository.countByState(BedState.AVAILABLE)
                            + bedRepository.countByState(BedState.READY);

        LocalDateTime windowStart = LocalDateTime.now().plusHours(startHours);
        LocalDateTime windowEnd   = LocalDateTime.now().plusHours(endHours);

        // Estimate discharge for each admitted patient using diagnosis/unit-based avg LOS
        Map<String, Long> dischargesByUnit = new LinkedHashMap<>();
        for (com.hoscor.domain.entity.Patient p : admitted) {
            if (p.getUnit() == null || p.getAdmissionDate() == null) continue;
            double avgLosHours = estimateLosHours(p.getUnit(), p.getDiagnosis());
            LocalDateTime expectedDischarge = p.getAdmissionDate().plusHours((long) avgLosHours);
            if (!expectedDischarge.isBefore(windowStart) && !expectedDischarge.isAfter(windowEnd)) {
                dischargesByUnit.merge(p.getUnit(), 1L, Long::sum);
            }
        }

        List<Map<String, Object>> byUnit = new ArrayList<>();
        long totalDischarges = 0;

        for (Map.Entry<String, Long> e : dischargesByUnit.entrySet()) {
            String unit     = e.getKey();
            long discharges = e.getValue();
            long avail      = bedRepository.countByUnitAndState(unit, BedState.AVAILABLE)
                            + bedRepository.countByUnitAndState(unit, BedState.READY);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",               unit);
            entry.put("unitName",           unitName(unit));
            entry.put("expectedDischarges", discharges);
            entry.put("currentAvailable",   avail);
            entry.put("projectedAvailable", avail + discharges);
            byUnit.add(entry);
            totalDischarges += discharges;
        }

        long projectedNet = totalAvailable + totalDischarges - totalWaiting;
        String situation  = projectedNet > 5 ? "SUFFISANT"
                          : projectedNet >= 0 ? "TENSION" : "RISQUE DE SATURATION";

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("label",              label);
        data.put("expectedDischarges", totalDischarges);
        data.put("currentAvailable",   totalAvailable);
        data.put("waitingPatients",    totalWaiting);
        data.put("projectedNet",       projectedNet);
        data.put("situation",          situation);
        data.put("byUnit",             byUnit);

        String msg = String.format(
            "Prévision %s: %d congé(s) attendu(s), %d patient(s) en attente, %d lit(s) disponibles. Bilan net: %d — Situation: %s.",
            label, totalDischarges, totalWaiting, totalAvailable, projectedNet, situation
        );
        return IntelligenceResult.metric(msg, data);
    }

    // ================================================================
    // Saturation risk today (per unit)
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult saturationRiskToday() {
        String sql = """
            SELECT unit,
                COUNT(*) FILTER (WHERE state = 'OCCUPIED') AS occupied,
                COUNT(*) AS total,
                ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0), 1) AS rate_pct
            FROM beds GROUP BY unit ORDER BY rate_pct DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            double rate = toDouble(row[3]);
            String risk = rate >= 95 ? "CRITIQUE" : rate >= 85 ? "ÉLEVÉ" : rate >= 70 ? "MODÉRÉ" : "FAIBLE";
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",     row[0]);
            entry.put("occupied", toLong(row[1]));
            entry.put("total",    toLong(row[2]));
            entry.put("ratePct",  rate);
            entry.put("risk",     risk);
            data.add(entry);
        }

        long criticalCount = data.stream().filter(e -> "CRITIQUE".equals(e.get("risk"))).count();
        String msg = criticalCount > 0
            ? String.format("%d unité(s) en situation CRITIQUE. Intervention immédiate requise.", criticalCount)
            : "Aucune unité en situation critique actuellement.";

        return IntelligenceResult.table(msg, data);
    }

    // ================================================================
    // Find bottleneck units
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult findBottleneck() {
        String sql = """
            SELECT
                b.unit,
                ROUND(COUNT(*) FILTER (WHERE b.state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0), 1) AS occ_rate,
                COUNT(*) FILTER (WHERE b.state = 'CLEANING') AS cleaning_count,
                COALESCE(w.waiting_count, 0) AS waiting_count,
                ROUND((COUNT(*) FILTER (WHERE b.state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0))
                    + COALESCE(w.waiting_count,0)*10
                    + COUNT(*) FILTER (WHERE b.state = 'CLEANING')*5, 1) AS bottleneck_score
            FROM beds b
            LEFT JOIN (
                SELECT target_unit, COUNT(*) AS waiting_count
                FROM stretchers WHERE status = 'WAITING'
                GROUP BY target_unit
            ) w ON b.unit = w.target_unit
            GROUP BY b.unit, w.waiting_count
            ORDER BY bottleneck_score DESC
            LIMIT 3
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",           row[0]);
            entry.put("unitName",       unitName((String) row[0]));
            entry.put("occRatePct",     toDouble(row[1]));
            entry.put("cleaningCount",  toLong(row[2]));
            entry.put("waitingCount",   toLong(row[3]));
            entry.put("bottleneckScore", toDouble(row[4]));
            data.add(entry);
        }

        String msg = data.isEmpty()
            ? "Aucun goulot d'étranglement détecté."
            : String.format("Top %d unité(s) goulot: %s (score: %.0f).",
                data.size(),
                data.get(0).get("unit"),
                toDouble(data.get(0).get("bottleneckScore")));

        return IntelligenceResult.table(msg, data);
    }

    // ================================================================
    // Overdue waiting patients
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult getOverdueWaiting() {
        String sql = """
            SELECT s.stretcher_number, s.risk_level, s.target_unit, s.wait_since,
                p.first_name, p.last_name, p.diagnosis,
                ROUND(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60::numeric, 0) AS wait_min,
                CASE s.risk_level
                    WHEN 'ELEVE'  THEN 30
                    WHEN 'MOYEN'  THEN 120
                    WHEN 'FAIBLE' THEN 240
                END AS max_wait_min
            FROM stretchers s
            JOIN patients p ON s.patient_id = p.id
            WHERE s.status = 'WAITING'
              AND (
                (s.risk_level = 'ELEVE'  AND EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60 > 30)
             OR (s.risk_level = 'MOYEN'  AND EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60 > 120)
             OR (s.risk_level = 'FAIBLE' AND EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60 > 240)
              )
            ORDER BY s.risk_level ASC, s.wait_since ASC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("stretcherNumber", row[0]);
            entry.put("riskLevel",       row[1]);
            entry.put("targetUnit",      row[2]);
            entry.put("waitSince",       row[3] != null ? row[3].toString() : null);
            entry.put("firstName",       row[4]);
            entry.put("lastName",        row[5]);
            entry.put("diagnosis",       row[6]);
            entry.put("waitMinutes",     toDouble(row[7]));
            entry.put("maxWaitMinutes",  toLong(row[8]));
            data.add(entry);
        }

        String msg = data.isEmpty()
            ? "Aucun patient ne dépasse son délai d'attente maximal."
            : String.format("%d patient(s) ont dépassé leur délai d'attente maximum.", data.size());

        return IntelligenceResult.alert(msg, data);
    }

    // ================================================================
    // Explain blocker for a unit (from message or worst unit)
    // ================================================================
    public IntelligenceResult explainBlocker(String message) {
        String unit = extractUnit(message);
        if (unit == null) {
            // Find the worst unit
            IntelligenceResult bottleneck = findBottleneck();
            if (bottleneck.getData() instanceof List<?> list && !list.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> top = (Map<String, Object>) list.get(0);
                unit = (String) top.get("unit");
            }
        }
        if (unit == null) {
            return IntelligenceResult.text("Impossible de déterminer l'unité bloquante. Précisez l'unité (ex: 2N, 3S).");
        }

        long occupied  = bedRepository.countByUnitAndState(unit, BedState.OCCUPIED);
        long cleaning  = bedRepository.countByUnitAndState(unit, BedState.CLEANING);
        long available = bedRepository.countByUnitAndState(unit, BedState.AVAILABLE)
                       + bedRepository.countByUnitAndState(unit, BedState.READY);
        long total     = bedRepository.findByUnit(unit).size();
        final String finalUnit = unit;
        long waiting   = stretcherRepository.findByStatus(StretcherStatus.WAITING).stream()
                           .filter(s -> finalUnit.equals(s.getTargetUnit())).count();

        double occ = total > 0 ? (double) occupied / total * 100 : 0.0;

        List<String> blockers = new ArrayList<>();
        if (occ >= 90) blockers.add(String.format("Taux d'occupation de %.1f%% — très élevé", occ));
        if (cleaning > 0) blockers.add(cleaning + " lit(s) en cours de nettoyage bloquant(s)");
        if (waiting > 0) blockers.add(waiting + " patient(s) en attente d'un lit dans cette unité");
        if (available == 0) blockers.add("Aucun lit disponible ou prêt");

        List<String> suggestions = new ArrayList<>();
        if (cleaning > 0) suggestions.add("Accélérer le nettoyage des lits en cours");
        if (occ >= 90)    suggestions.add("Envisager des transferts vers des unités moins chargées");
        suggestions.add("Vérifier les congés prévus dans les 24 prochaines heures");
        suggestions.add("Prioriser les patients ÉLEVÉ en attente pour " + unit);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("unit",        unit);
        data.put("unitName",    unitName(unit));
        data.put("occupied",    occupied);
        data.put("cleaning",    cleaning);
        data.put("available",   available);
        data.put("total",       total);
        data.put("waiting",     waiting);
        data.put("occRatePct",  Math.round(occ * 10.0) / 10.0);
        data.put("blockers",    blockers);
        data.put("suggestions", suggestions);

        String msg = String.format(
            "Analyse de l'unité %s (%s): %.1f%% d'occupation, %d en nettoyage, %d en attente. Blockers: %s.",
            unit, unitName(unit), occ, cleaning, waiting, String.join("; ", blockers)
        );
        return IntelligenceResult.metric(msg, data);
    }

    // ================================================================
    // Generate strategy recommendations
    // ================================================================
    public IntelligenceResult generateStrategy() {
        long highRiskWaiting = stretcherRepository.countByStatusAndRiskLevel(StretcherStatus.WAITING, RiskLevel.ELEVE);
        long totalWaiting    = stretcherRepository.countByStatus(StretcherStatus.WAITING);
        long cleaning        = bedRepository.countByState(BedState.CLEANING);
        long available       = bedRepository.countByState(BedState.AVAILABLE)
                             + bedRepository.countByState(BedState.READY);

        List<Map<String, Object>> recommendations = new ArrayList<>();
        int priority = 1;

        if (highRiskWaiting > 0) {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("priority",    priority++);
            rec.put("level",       "CRITICAL");
            rec.put("action",      "Assigner immédiatement les patients à risque ÉLEVÉ");
            rec.put("detail",      highRiskWaiting + " patient(s) à risque ÉLEVÉ en attente. Chaque minute compte.");
            rec.put("impact",      "Réduction du risque de complications critiques");
            recommendations.add(rec);
        }

        if (cleaning > 3) {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("priority",    priority++);
            rec.put("level",       "HIGH");
            rec.put("action",      "Accélérer le nettoyage des " + cleaning + " lit(s) en attente");
            rec.put("detail",      "Contacter la salubrité pour prioriser les chambres des unités saturées.");
            rec.put("impact",      "+" + cleaning + " lit(s) disponibles dans < 30 min");
            recommendations.add(rec);
        }

        if (available == 0) {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("priority",    priority++);
            rec.put("level",       "CRITICAL");
            rec.put("action",      "Situation critique: 0 lit disponible");
            rec.put("detail",      "Activer le plan de contingence: vérifier les congés imminents, considérer réorganisation inter-unités.");
            rec.put("impact",      "Éviter le blocage total des admissions");
            recommendations.add(rec);
        } else if (available < 5) {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("priority",    priority++);
            rec.put("level",       "HIGH");
            rec.put("action",      "Tension sur les lits: seulement " + available + " disponible(s)");
            rec.put("detail",      "Prioriser les assignations aux patients les plus urgents et vérifier les prévisions de congés.");
            rec.put("impact",      "Maintenir la fluidité des admissions");
            recommendations.add(rec);
        }

        if (totalWaiting > 10) {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("priority",    priority++);
            rec.put("level",       "MEDIUM");
            rec.put("action",      "File d'attente longue: " + totalWaiting + " patient(s)");
            rec.put("detail",      "Envisager une redistribution entre unités ou des transferts vers des établissements partenaires.");
            rec.put("impact",      "Réduction de l'engorgement aux urgences");
            recommendations.add(rec);
        }

        if (recommendations.isEmpty()) {
            recommendations.add(Map.of(
                "priority", 1,
                "level",    "LOW",
                "action",   "Situation sous contrôle",
                "detail",   "Continuer la surveillance. Aucune action urgente requise.",
                "impact",   "Maintien de la qualité des soins"
            ));
        }

        String msg = String.format("Stratégie globale: %d recommandation(s) générée(s). Priorité 1: %s.",
            recommendations.size(), recommendations.get(0).get("action"));
        return IntelligenceResult.alert(msg, recommendations);
    }

    // ================================================================
    // Detect deterioration risk for admitted patients
    // ================================================================
    public IntelligenceResult detectDeteriorationRisk() {
        List<Patient> admitted = patientRepository.findByStatus(com.hoscor.domain.enums.PatientStatus.ADMITTED);
        List<Stretcher> waiting = stretcherRepository.findByStatus(StretcherStatus.WAITING);
        Map<Long, Stretcher> patientStretchers = new HashMap<>();
        for (Stretcher s : waiting) {
            if (s.getPatient() != null) patientStretchers.put(s.getPatient().getId(), s);
        }

        List<Map<String, Object>> scored = new ArrayList<>();

        for (Patient p : admitted) {
            int score = 0;
            List<String> reasons = new ArrayList<>();

            // Risk level from stretcher
            Stretcher s = patientStretchers.get(p.getId());
            if (s != null) {
                if (s.getRiskLevel() == RiskLevel.ELEVE) { score += 40; reasons.add("Risque ÉLEVÉ (+40)"); }
                else if (s.getRiskLevel() == RiskLevel.MOYEN) { score += 20; reasons.add("Risque MOYEN (+20)"); }
                // Wait time
                long waitHours = ChronoUnit.HOURS.between(s.getWaitSince(), LocalDateTime.now());
                if (waitHours > 4)      { score += 20; reasons.add("Attente > 4h (+20)"); }
                else if (waitHours > 2) { score += 10; reasons.add("Attente > 2h (+10)"); }
            }

            // Age
            if (p.getAge() > 75)      { score += 15; reasons.add("Âge > 75 (+15)"); }
            else if (p.getAge() > 65) { score += 8;  reasons.add("Âge > 65 (+8)"); }

            // Diagnosis severity
            String diag = p.getDiagnosis() != null ? p.getDiagnosis().toLowerCase() : "";
            if (diag.contains("cardiaque") || diag.contains("sepsis")) { score += 20; reasons.add("Diagnostic grave (+20)"); }
            else if (diag.contains("pulmonaire") || diag.contains("aki")) { score += 10; reasons.add("Diagnostic modéré (+10)"); }

            // Wrong unit
            String expectedUnit = getExpectedUnit(diag);
            if (expectedUnit != null && p.getUnit() != null && !expectedUnit.equals(p.getUnit())) {
                score += 15;
                reasons.add("Unité inadaptée: devrait être " + expectedUnit + " (+15)");
            }

            score = Math.min(score, 100);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("patientId",   p.getId());
            entry.put("mrdNumber",   p.getMrdNumber());
            entry.put("firstName",   p.getFirstName());
            entry.put("lastName",    p.getLastName());
            entry.put("age",         p.getAge());
            entry.put("diagnosis",   p.getDiagnosis());
            entry.put("unit",        p.getUnit());
            entry.put("riskScore",   score);
            entry.put("reasons",     reasons);
            scored.add(entry);
        }

        scored.sort((a, b) -> Integer.compare(
            (int) b.get("riskScore"), (int) a.get("riskScore")));
        List<Map<String, Object>> top5 = scored.subList(0, Math.min(5, scored.size()));

        String msg = top5.isEmpty()
            ? "Aucun patient à risque de détérioration identifié."
            : String.format("Top %d patients à risque de détérioration. Score le plus élevé: %d/100 (%s %s).",
                top5.size(),
                (int) top5.get(0).get("riskScore"),
                top5.get(0).get("firstName"), top5.get(0).get("lastName"));

        return IntelligenceResult.cards(msg, top5);
    }

    // ================================================================
    // Optimize bed assignment
    // ================================================================
    public IntelligenceResult optimizeBedAssignment() {
        List<Stretcher> waitingStretchers = stretcherRepository.findByStatus(StretcherStatus.WAITING);
        List<Bed> availableBeds = new ArrayList<>();
        availableBeds.addAll(bedRepository.findByState(BedState.AVAILABLE));
        availableBeds.addAll(bedRepository.findByState(BedState.READY));

        List<Map<String, Object>> assignments = new ArrayList<>();
        Set<Long> usedBeds = new HashSet<>();

        // Sort stretchers by priority (ELEVE first, then wait time)
        waitingStretchers.sort((a, b) -> {
            int riskCompare = riskOrder(a.getRiskLevel()) - riskOrder(b.getRiskLevel());
            if (riskCompare != 0) return riskCompare;
            return a.getWaitSince().compareTo(b.getWaitSince());
        });

        for (Stretcher stretcher : waitingStretchers) {
            // First try to find bed in target unit
            Bed matched = null;
            for (Bed bed : availableBeds) {
                if (!usedBeds.contains(bed.getId()) && bed.getUnit().equals(stretcher.getTargetUnit())) {
                    matched = bed;
                    break;
                }
            }
            // Fallback: any available bed
            if (matched == null) {
                for (Bed bed : availableBeds) {
                    if (!usedBeds.contains(bed.getId())) {
                        matched = bed;
                        break;
                    }
                }
            }

            if (matched != null) {
                usedBeds.add(matched.getId());
                Map<String, Object> assignment = new LinkedHashMap<>();
                assignment.put("stretcherNumber", stretcher.getStretcherNumber());
                assignment.put("riskLevel",       stretcher.getRiskLevel());
                assignment.put("targetUnit",      stretcher.getTargetUnit());
                assignment.put("patientName",     stretcher.getPatient() != null
                    ? stretcher.getPatient().getFirstName() + " " + stretcher.getPatient().getLastName() : "N/A");
                assignment.put("assignedBedId",   matched.getId());
                assignment.put("assignedBedUnit", matched.getUnit());
                assignment.put("assignedBedNumber", matched.getBedNumber());
                assignment.put("optimalMatch",    matched.getUnit().equals(stretcher.getTargetUnit()));
                assignments.add(assignment);
            }
        }

        long optimal = assignments.stream().filter(a -> Boolean.TRUE.equals(a.get("optimalMatch"))).count();
        String msg = String.format(
            "%d assignation(s) optimale(s) proposée(s). %d correspondent à l'unité cible. %d non assigné(s).",
            assignments.size(), optimal, waitingStretchers.size() - assignments.size()
        );
        return IntelligenceResult.table(msg, assignments);
    }

    // ================================================================
    // Simulate admissions
    // ================================================================
    public IntelligenceResult simulateAdmissions(String message) {
        int count = extractCount(message);
        if (count <= 0) count = 5;

        long totalBeds     = bedRepository.count();
        long totalOccupied = bedRepository.countByState(BedState.OCCUPIED);
        long totalAvailable = bedRepository.countByState(BedState.AVAILABLE)
                            + bedRepository.countByState(BedState.READY);

        List<String> units = List.of("2N", "3N", "2S", "3S", "URG", "CHIR");
        List<Map<String, Object>> byUnit = new ArrayList<>();

        for (String unit : units) {
            long unitTotal    = bedRepository.findByUnit(unit).size();
            long unitOccupied = bedRepository.countByUnitAndState(unit, BedState.OCCUPIED);
            long unitAvail    = bedRepository.countByUnitAndState(unit, BedState.AVAILABLE)
                              + bedRepository.countByUnitAndState(unit, BedState.READY);

            // Distribute proportionally
            long share = totalBeds > 0 ? Math.round((double) count * unitTotal / totalBeds) : 0;
            long afterOccupied  = Math.min(unitOccupied + share, unitTotal);
            long afterAvailable = Math.max(unitAvail - share, 0);
            double beforeRate = unitTotal > 0 ? Math.round((double) unitOccupied / unitTotal * 1000.0) / 10.0 : 0;
            double afterRate  = unitTotal > 0 ? Math.round((double) afterOccupied / unitTotal * 1000.0) / 10.0 : 0;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",              unit);
            entry.put("unitName",          unitName(unit));
            entry.put("total",             unitTotal);
            entry.put("beforeOccupied",    unitOccupied);
            entry.put("beforeAvailable",   unitAvail);
            entry.put("beforeRatePct",     beforeRate);
            entry.put("admissions",        share);
            entry.put("afterOccupied",     afterOccupied);
            entry.put("afterAvailable",    afterAvailable);
            entry.put("afterRatePct",      afterRate);
            entry.put("riskAfter",         afterRate >= 95 ? "CRITIQUE" : afterRate >= 85 ? "ÉLEVÉ" : "OK");
            byUnit.add(entry);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("simulatedAdmissions", count);
        data.put("currentOccupied",     totalOccupied);
        data.put("currentAvailable",    totalAvailable);
        data.put("projectedOccupied",   totalOccupied + count);
        data.put("projectedAvailable",  Math.max(totalAvailable - count, 0));
        data.put("byUnit",              byUnit);

        double afterGlobalRate = totalBeds > 0
            ? Math.round((double)(totalOccupied + count) / totalBeds * 1000.0) / 10.0 : 0;
        String msg = String.format(
            "Simulation: %d admission(s) supplémentaire(s). Occupation actuelle: %d/%d. Après: %d/%d (%.1f%%).",
            count, totalOccupied, totalBeds, totalOccupied + count, totalBeds, afterGlobalRate
        );
        return IntelligenceResult.metric(msg, data);
    }

    // ================================================================
    // Propose reorganization
    // ================================================================
    @SuppressWarnings("unchecked")
    public IntelligenceResult proposeReorganization() {
        String sql = """
            SELECT unit,
                COUNT(*) FILTER (WHERE state = 'OCCUPIED') AS occupied,
                COUNT(*) AS total,
                ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0), 1) AS rate_pct
            FROM beds GROUP BY unit ORDER BY rate_pct DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> overloaded   = new ArrayList<>();
        List<Map<String, Object>> underloaded  = new ArrayList<>();

        for (Object[] row : rows) {
            double rate = toDouble(row[3]);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",    row[0]);
            entry.put("occupied", toLong(row[1]));
            entry.put("total",   toLong(row[2]));
            entry.put("ratePct", rate);
            if (rate >= 85) overloaded.add(entry);
            else if (rate <= 60) underloaded.add(entry);
        }

        List<Map<String, Object>> proposals = new ArrayList<>();
        for (Map<String, Object> over : overloaded) {
            for (Map<String, Object> under : underloaded) {
                long available = toLong(under.get("total")) - toLong(under.get("occupied"));
                long transferable = Math.min(
                    (long)(toLong(over.get("occupied")) * 0.1),
                    available
                );
                if (transferable > 0) {
                    Map<String, Object> proposal = new LinkedHashMap<>();
                    proposal.put("fromUnit",      over.get("unit"));
                    proposal.put("fromUnitName",  unitName((String) over.get("unit")));
                    proposal.put("fromRatePct",   over.get("ratePct"));
                    proposal.put("toUnit",        under.get("unit"));
                    proposal.put("toUnitName",    unitName((String) under.get("unit")));
                    proposal.put("toRatePct",     under.get("ratePct"));
                    proposal.put("transferablePatients", transferable);
                    proposal.put("note",          String.format("Transférer ~%d patient(s) de %s (%.1f%%) vers %s (%.1f%%)",
                        transferable, over.get("unit"), toDouble(over.get("ratePct")),
                        under.get("unit"), toDouble(under.get("ratePct"))));
                    proposals.add(proposal);
                }
            }
        }

        String msg = proposals.isEmpty()
            ? "Aucune réorganisation nécessaire. La répartition est équilibrée."
            : String.format("%d proposition(s) de réorganisation identifiée(s).", proposals.size());

        return IntelligenceResult.table(msg, proposals);
    }

    // ================================================================
    // Helpers
    // ================================================================

    private String unitName(String unit) {
        return switch (unit) {
            case "2N"   -> "Cardiologie";
            case "3N"   -> "Néphrologie";
            case "2S"   -> "Soins Intensifs";
            case "3S"   -> "Médecine";
            case "URG"  -> "Urgence";
            case "CHIR" -> "Chirurgie";
            default     -> unit;
        };
    }

    private String getExpectedUnit(String diagnosis) {
        for (Map.Entry<String, String> e : DIAGNOSIS_UNIT_MAP.entrySet()) {
            if (diagnosis.contains(e.getKey())) return e.getValue();
        }
        return null;
    }

    /** Estimate average LOS in hours from diagnosis keywords, then fall back to unit default. */
    private double estimateLosHours(String unit, String diagnosis) {
        if (diagnosis != null) {
            String d = diagnosis.toLowerCase();
            if (d.contains("insuffisance cardiaque") || d.contains("cardiaque")) return 96.0;
            if (d.contains("aki") || d.contains("rénal") || d.contains("renal")
                    || d.contains("néphro") || d.contains("nephro"))           return 120.0;
            if (d.contains("sepsis") || d.contains("choc") || d.contains("réanimation")) return 168.0;
            if (d.contains("mpoc") || d.contains("pneumonie"))                 return 72.0;
            if (d.contains("avc"))                                             return 240.0;
            if (d.contains("fracture") || d.contains("chirurgie")
                    || d.contains("post-op") || d.contains("appendic"))        return 96.0;
            if (d.contains("diabète") || d.contains("diabete"))               return 84.0;
        }
        return switch (unit != null ? unit : "") {
            case "2N"   -> 96.0;
            case "3N"   -> 120.0;
            case "2S"   -> 72.0;
            case "3S"   -> 84.0;
            case "URG"  -> 24.0;
            case "CHIR" -> 96.0;
            default     -> 72.0;
        };
    }

    private String extractUnit(String message) {
        String upper = message.toUpperCase();
        for (String unit : new String[]{"2N", "3N", "2S", "3S", "URG", "CHIR"}) {
            if (upper.contains(unit)) return unit;
        }
        return null;
    }

    private int extractCount(String message) {
        Matcher m = Pattern.compile("(\\d+)\\s*(patient|admission|cas|personne)", Pattern.CASE_INSENSITIVE).matcher(message);
        if (m.find()) return Integer.parseInt(m.group(1));
        Matcher m2 = Pattern.compile("\\b(\\d+)\\b").matcher(message);
        if (m2.find()) return Integer.parseInt(m2.group(1));
        return 5;
    }

    private int riskOrder(RiskLevel level) {
        if (level == null) return 3;
        return switch (level) {
            case ELEVE  -> 0;
            case MOYEN  -> 1;
            case FAIBLE -> 2;
        };
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
