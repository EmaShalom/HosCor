package com.hoscor.service;

import com.hoscor.domain.repository.BedRepository;
import com.hoscor.dto.IntelligenceResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BedIntelligenceService {

    @PersistenceContext
    private EntityManager entityManager;

    private final BedRepository bedRepository;

    private static final double THRESHOLD_CRITIQUE  = 0.95;
    private static final double THRESHOLD_ELEVEE    = 0.85;
    private static final double THRESHOLD_MODEREE   = 0.70;
    private static final int    CLEANING_ALERT_MIN  = 30;
    private static final int    RESERVATION_ALERT_MIN = 60;

    @Cacheable(value = "bedStats", key = "#root.methodName")
    @SuppressWarnings("unchecked")
    public IntelligenceResult getAvailableBedCount() {
        String sql = """
            SELECT unit,
                COUNT(*) FILTER (WHERE state IN ('AVAILABLE','READY')) AS available,
                COUNT(*) FILTER (WHERE state = 'OCCUPIED') AS occupied,
                COUNT(*) FILTER (WHERE state = 'CLEANING') AS cleaning,
                COUNT(*) AS total
            FROM beds GROUP BY unit ORDER BY unit
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();
        long totalAvailable = 0;
        long totalBeds = 0;

        for (Object[] row : rows) {
            Map<String, Object> unit = new LinkedHashMap<>();
            unit.put("unit",      row[0]);
            unit.put("available", toInt(row[1]));
            unit.put("occupied",  toInt(row[2]));
            unit.put("cleaning",  toInt(row[3]));
            unit.put("total",     toInt(row[4]));
            totalAvailable += toInt(row[1]);
            totalBeds      += toInt(row[4]);
            data.add(unit);
        }

        String message = String.format(
            "Il y a %d lits disponibles (DISPONIBLE ou PRÊT) sur un total de %d lits, répartis sur %d unités.",
            totalAvailable, totalBeds, data.size()
        );
        return IntelligenceResult.table(message, data);
    }

    @Cacheable(value = "bedStats", key = "#root.methodName")
    @SuppressWarnings("unchecked")
    public IntelligenceResult getSaturationStatus() {
        String sql = """
            SELECT unit,
                COUNT(*) FILTER (WHERE state = 'OCCUPIED') AS occupied,
                COUNT(*) AS total,
                ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0), 1) AS rate_pct
            FROM beds GROUP BY unit ORDER BY rate_pct DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();
        long totalOccupied = 0;
        long totalBeds = 0;

        for (Object[] row : rows) {
            long occ   = toInt(row[1]);
            long total = toInt(row[2]);
            double rate = total > 0 ? (double) occ / total : 0.0;
            String level = saturationLevel(rate);

            Map<String, Object> unit = new LinkedHashMap<>();
            unit.put("unit",     row[0]);
            unit.put("occupied", occ);
            unit.put("total",    total);
            unit.put("ratePct",  toDouble(row[3]));
            unit.put("level",    level);
            data.add(unit);

            totalOccupied += occ;
            totalBeds     += total;
        }

        double globalRate = totalBeds > 0 ? (double) totalOccupied / totalBeds : 0.0;
        String globalLevel = saturationLevel(globalRate);
        double globalPct = Math.round(globalRate * 1000.0) / 10.0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("globalRatePct", globalPct);
        summary.put("globalLevel",   globalLevel);
        summary.put("byUnit",        data);

        String message = String.format(
            "Saturation globale : %.1f%% — Niveau %s. %d lits occupés sur %d au total.",
            globalPct, globalLevel, totalOccupied, totalBeds
        );
        return IntelligenceResult.metric(message, summary);
    }

    @SuppressWarnings("unchecked")
    public IntelligenceResult getReservedUnoccupied() {
        String sql = """
            SELECT b.unit, b.bed_number, a.stretcher_number, a.assigned_at,
                EXTRACT(EPOCH FROM (NOW() - a.assigned_at))/60 AS minutes_reserved
            FROM beds b
            JOIN attributions a ON a.bed_id = b.id
            LEFT JOIN patients p ON p.bed_number = b.bed_number AND p.unit = b.unit AND p.status = 'ADMITTED'
            WHERE p.id IS NULL AND b.state != 'OCCUPIED'
            ORDER BY a.assigned_at ASC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            long minutes = (long) toDouble(row[4]);
            boolean alert = minutes > RESERVATION_ALERT_MIN;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",            row[0]);
            entry.put("bedNumber",       row[1]);
            entry.put("stretcherNumber", row[2]);
            entry.put("assignedAt",      row[3] != null ? row[3].toString() : null);
            entry.put("minutesReserved", minutes);
            entry.put("alert",           alert);
            data.add(entry);
        }

        String message = data.isEmpty()
            ? "Aucune réservation de lit non occupée détectée."
            : String.format("%d lit(s) réservé(s) mais inoccupé(s). %d dépasse(nt) %d minutes.",
                data.size(),
                data.stream().filter(e -> Boolean.TRUE.equals(e.get("alert"))).count(),
                RESERVATION_ALERT_MIN);

        return IntelligenceResult.table(message, data);
    }

    @Cacheable(value = "bedStats", key = "#root.methodName")
    @SuppressWarnings("unchecked")
    public IntelligenceResult getCleaningBeds() {
        String sql = """
            SELECT unit, bed_number, last_updated,
                EXTRACT(EPOCH FROM (NOW() - last_updated))/60 AS minutes_cleaning
            FROM beds WHERE state = 'CLEANING' ORDER BY last_updated ASC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Object[] row : rows) {
            long minutes = (long) toDouble(row[3]);
            boolean alert = minutes > CLEANING_ALERT_MIN;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",           row[0]);
            entry.put("bedNumber",      row[1]);
            entry.put("lastUpdated",    row[2] != null ? row[2].toString() : null);
            entry.put("minutesCleaning", minutes);
            entry.put("alert",          alert);
            data.add(entry);
        }

        long alertCount = data.stream().filter(e -> Boolean.TRUE.equals(e.get("alert"))).count();
        String message = data.isEmpty()
            ? "Aucun lit en nettoyage actuellement."
            : String.format("%d lit(s) en cours de nettoyage. %d dépasse(nt) %d minutes.",
                data.size(), alertCount, CLEANING_ALERT_MIN);

        return IntelligenceResult.table(message, data);
    }

    @Cacheable(value = "bedStats", key = "#root.methodName")
    @SuppressWarnings("unchecked")
    public IntelligenceResult forecast24h() {
        // avg_los_hours is NUMERIC — explicit ::text cast required for PostgreSQL || operator
        String sql = """
            SELECT p.unit, COUNT(*) AS expected_discharges
            FROM patients p
            JOIN diagnosis_avg_los d
                ON LOWER(p.diagnosis) LIKE CONCAT('%', d.diagnosis_code, '%')
            WHERE p.status = 'ADMITTED'
              AND (p.admission_date + CAST(CAST(d.avg_los_hours AS text) || ' hours' AS interval)) <= NOW() + INTERVAL '24 hours'
            GROUP BY p.unit
            ORDER BY p.unit
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();
        long total = 0;

        for (Object[] row : rows) {
            long count = toInt(row[1]);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",              row[0]);
            entry.put("expectedDischarges", count);
            data.add(entry);
            total += count;
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%d congé(s) prévu(s) d'ici 24h", total));
        if (!data.isEmpty()) {
            sb.append(": ");
            List<String> parts = new ArrayList<>();
            for (Map<String, Object> e : data) {
                parts.add(e.get("expectedDischarges") + " en " + e.get("unit"));
            }
            sb.append(String.join(", ", parts)).append(".");
        } else {
            sb.append(".");
        }

        return IntelligenceResult.metric(sb.toString(), data);
    }

    @Cacheable(value = "bedStats", key = "#root.methodName")
    @SuppressWarnings("unchecked")
    public IntelligenceResult getOccupancyRate() {
        String sql = """
            SELECT unit,
                COUNT(*) FILTER (WHERE state = 'OCCUPIED') AS occupied,
                COUNT(*) AS total,
                ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / NULLIF(COUNT(*),0), 1) AS rate_pct
            FROM beds GROUP BY unit ORDER BY rate_pct DESC
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> data = new ArrayList<>();
        long totalOccupied = 0;
        long totalBeds = 0;

        for (Object[] row : rows) {
            long occ   = toInt(row[1]);
            long total = toInt(row[2]);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("unit",    row[0]);
            entry.put("occupied", occ);
            entry.put("total",   total);
            entry.put("ratePct", toDouble(row[3]));
            data.add(entry);
            totalOccupied += occ;
            totalBeds     += total;
        }

        double globalPct = totalBeds > 0 ? Math.round((double) totalOccupied / totalBeds * 1000.0) / 10.0 : 0.0;
        String message = String.format(
            "Taux d'occupation global : %.1f%% (%d/%d lits occupés).",
            globalPct, totalOccupied, totalBeds
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("globalRatePct",   globalPct);
        result.put("totalOccupied",   totalOccupied);
        result.put("totalBeds",       totalBeds);
        result.put("byUnit",          data);

        return IntelligenceResult.metric(message, result);
    }

    // ================================================================
    // Helpers
    // ================================================================

    private long toInt(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).longValue();
        return Long.parseLong(val.toString());
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }

    private String saturationLevel(double rate) {
        if (rate >= THRESHOLD_CRITIQUE) return "CRITIQUE";
        if (rate >= THRESHOLD_ELEVEE)   return "ÉLEVÉE";
        if (rate >= THRESHOLD_MODEREE)  return "MODÉRÉE";
        return "NORMALE";
    }
}
