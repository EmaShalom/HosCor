# PROMPT MODULE 2 — PatientFlowService + DecisionEngineService
# (Patients, Matching, Transferts, Alertes, Anticipation, Opérationnel)

> Coller dans ChatGPT APRÈS le prompt Module 1.

---

## PARTIE A — PatientFlowService.java

### 1. getWaitingCount()
**Question :** "Combien de patients attendent un lit ?"

```sql
SELECT
    COUNT(*)                                              AS total_waiting,
    COUNT(*) FILTER (WHERE s.risk_level = 'ÉLEVÉ')       AS high_risk,
    COUNT(*) FILTER (WHERE s.risk_level = 'MOYEN')       AS medium_risk,
    COUNT(*) FILTER (WHERE s.risk_level = 'FAIBLE')      AS low_risk,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60)) AS avg_wait_min
FROM stretchers s
WHERE s.status = 'WAITING';
```

**Réponse :**
```
12 patients attendent actuellement un lit.

Par niveau de risque :
🔴 Risque élevé  : 3 patients (priorité absolue)
🟠 Risque moyen  : 5 patients
🟢 Risque faible : 4 patients

Temps d'attente moyen : 47 minutes
⚠️ 2 patients à risque élevé dépassent 30 minutes d'attente.
```

---

### 2. getMostUrgent()
**Question :** "Qui sont les patients les plus urgents ?" / "Quels patients sont critiques en attente ?"

```sql
SELECT
    s.stretcher_number,
    p.mrd_number,
    p.first_name || ' ' || p.last_name AS full_name,
    p.age, p.gender, p.diagnosis,
    s.risk_level,
    s.target_unit,
    EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60 AS wait_minutes,
    -- Score de priorité : risque + temps d'attente
    CASE s.risk_level
        WHEN 'ÉLEVÉ' THEN 100
        WHEN 'MOYEN' THEN 50
        ELSE 10
    END + LEAST(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60, 60) AS priority_score
FROM stretchers s
JOIN patients p ON p.id = s.patient_id
WHERE s.status = 'WAITING'
ORDER BY priority_score DESC
LIMIT 5;
```

**Type de retour :** `PATIENT_CARDS` avec score de priorité affiché

---

### 3. getPriorityPatient()
**Question :** "Quel patient doit être priorisé maintenant ?"

Utilise la même requête que getMostUrgent() mais retourne **1 seul patient**
avec une explication détaillée du score :

```
Le patient à prioriser en ce moment est :

🚨 MRD-1042 — Jean Tremblay, 67 ans (H)
   Diagnostic : Insuffisance cardiaque aiguë
   Risque : ÉLEVÉ
   Attente : 52 minutes (⚠️ dépasse le délai max de 30 min)
   Unité cible : 2e Nord (Cardiologie)
   Score de priorité : 152/160

ACTION RECOMMANDÉE : Assigner immédiatement au lit disponible en 2N.
Lits disponibles en 2N : Lit 4, Lit 11
```

---

### 4. getWaitingByDiagnosis()
**Question :** "Donne-moi les patients en attente par diagnostic"

```sql
SELECT
    p.diagnosis,
    COUNT(*) AS count,
    AVG(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60) AS avg_wait_min,
    MAX(EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60) AS max_wait_min,
    STRING_AGG(p.mrd_number, ', ' ORDER BY s.wait_since) AS mrd_numbers
FROM stretchers s
JOIN patients p ON p.id = s.patient_id
WHERE s.status = 'WAITING'
GROUP BY p.diagnosis
ORDER BY count DESC;
```

---

### 5. getTransferStatus(String message)
**Question :** "Quel est le statut du patient MRD-EXT-002 ?"

Extrait le numéro MRD-EXT du message, puis :
```sql
SELECT p.*, t.origin_hospital, t.destination_hospital,
       t.scheduled_at, t.status AS transfer_status,
       t.transport_type, t.notes
FROM patients p
JOIN transfers t ON t.patient_id = p.id
WHERE p.mrd_number = :mrdNumber
ORDER BY t.scheduled_at DESC
LIMIT 1;
```

---

### 6. getTransferList()
**Questions :** "Combien de rapatriements prévus aujourd'hui ?" / "Liste les transferts sortants"

```sql
SELECT t.id, p.mrd_number, p.first_name || ' ' || p.last_name AS name,
       t.transfer_type,   -- 'ENTRANT' ou 'SORTANT'
       t.origin_hospital, t.destination_hospital,
       t.scheduled_at, t.status, p.diagnosis, p.risk_level
FROM transfers t
JOIN patients p ON p.id = t.patient_id
WHERE DATE(t.scheduled_at) = CURRENT_DATE
   OR t.status = 'EN_ATTENTE'
ORDER BY t.scheduled_at;
```

---

### 7. getAdmissionStats(), getAverageLOS(), getDamaRate(), getAdmissionTrends()

```sql
-- Admissions cette semaine
SELECT COUNT(*), DATE(admission_date) AS day
FROM patients
WHERE admission_date >= NOW() - INTERVAL '7 days'
GROUP BY day ORDER BY day;

-- Durée moyenne de séjour (patients congédiés)
SELECT unit,
       AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date))/3600) AS avg_los_hours
FROM patients
WHERE status = 'CONGÉDIÉ' AND discharge_date IS NOT NULL
GROUP BY unit;

-- Taux DAMA (Discharged Against Medical Advice)
SELECT COUNT(*) FILTER (WHERE discharge_reason = 'DAMA') * 100.0 / COUNT(*) AS dama_rate
FROM patients WHERE status = 'CONGÉDIÉ';

-- Tendance 30 jours
SELECT DATE(admission_date) AS day, COUNT(*) AS admissions
FROM patients
WHERE admission_date >= NOW() - INTERVAL '30 days'
GROUP BY day ORDER BY day;
```

---

## PARTIE B — DecisionEngineService.java

C'est le cœur de l'intelligence du système.

### 1. matchPatientToUnit(String message)
**Question :** "Dans quelle unité envoyer un patient avec AKI ?" / "Meilleure unité pour insuffisance cardiaque ?"

**Algorithme de matching :**

```java
@Service
public class DecisionEngineService {

    // Mapping diagnostic → unité recommandée
    private static final Map<String, String> DIAGNOSIS_UNIT_MAP = Map.of(
        "cardiaque",       "2N",  // 2e Nord — Cardiologie
        "cardiologie",     "2N",
        "aki",             "3N",  // 3e Nord — Néphrologie
        "rénal",           "3N",
        "néphrolog",       "3N",
        "soins intensifs", "2S",  // 2e Sud — Soins intensifs
        "critique",        "2S",
        "médecine",        "3S"   // 3e Sud — Médecine générale
    );

    public IntelligenceResult matchPatientToUnit(String message) {
        // 1. Extraire le diagnostic du message
        String diagnosis = extractDiagnosis(message);

        // 2. Trouver l'unité recommandée
        String recommendedUnit = DIAGNOSIS_UNIT_MAP.entrySet().stream()
            .filter(e -> diagnosis.toLowerCase().contains(e.getKey()))
            .map(Map.Entry::getValue)
            .findFirst()
            .orElse(null);

        // 3. Vérifier la disponibilité dans cette unité
        BedAvailability availability = bedRepository.getUnitAvailability(recommendedUnit);

        // 4. Si unité pleine → trouver alternative
        if (availability.getAvailable() == 0) {
            return buildAlternativeRecommendation(diagnosis, recommendedUnit);
        }

        return buildMatchResult(diagnosis, recommendedUnit, availability);
    }
}
```

**Réponse pour "Dans quelle unité envoyer un patient avec AKI ?" :**
```
Recommandation d'admission pour : AKI (Acute Kidney Injury)

✅ Unité recommandée : 3e Nord — Néphrologie
   Disponibilité : 6 lits disponibles / 15
   Taux d'occupation : 60% (NORMALE)
   Lits disponibles : 2, 5, 7, 9, 11, 14

Si 3e Nord est saturée, alternative : 3e Sud (Médecine générale) — 4 lits disponibles.
```

---

### 2. getCriticalAlerts()
**Question :** "Y a-t-il des situations critiques actuellement ?"

```java
public IntelligenceResult getCriticalAlerts() {
    List<Alert> alerts = new ArrayList<>();

    // Alerte 1 : Unités saturées
    bedRepository.getUnitSaturation().stream()
        .filter(u -> u.getSaturationRate() >= 0.95)
        .forEach(u -> alerts.add(Alert.critical(
            "Saturation critique — " + u.getUnitName(),
            u.getAvailable() + " lit(s) restant(s)"
        )));

    // Alerte 2 : Patients à risque élevé attendant > 30 min
    stretcherRepository.getOverdueHighRisk(30).forEach(s ->
        alerts.add(Alert.critical(
            "Patient critique en attente — " + s.getMrdNumber(),
            s.getWaitMinutes() + " min d'attente (max: 30 min)"
        )));

    // Alerte 3 : Lits réservés non occupés > 60 min
    attributionRepository.getOverdueReservations(60).forEach(a ->
        alerts.add(Alert.warning(
            "Réservation expirée — Lit " + a.getBedNumber() + " (" + a.getUnit() + ")",
            "Réservé depuis " + a.getMinutesReserved() + " min sans arrivée"
        )));

    // Alerte 4 : Transferts en retard
    transferRepository.getDelayedTransfers().forEach(t ->
        alerts.add(Alert.warning(
            "Transfert en retard — " + t.getMrdNumber(),
            "Prévu à " + t.getScheduledAt() + " — statut: " + t.getStatus()
        )));

    if (alerts.isEmpty()) {
        return IntelligenceResult.text("✅ Aucune situation critique en ce moment. Tous les indicateurs sont normaux.");
    }

    return IntelligenceResult.alerts(alerts);
}
```

---

### 3. forecastToday() / forecastTomorrow() / saturationRiskToday()
**Questions :** "Aura-t-on assez de lits aujourd'hui ?" / "Y a-t-il un risque de saturation ?"

**Algorithme de prévision :**
```java
public IntelligenceResult forecastToday() {

    int currentAvailable   = bedRepository.countAvailable();
    int waitingPatients    = stretcherRepository.countWaiting();
    int expectedDischarges = patientRepository.countExpectedDischarges(24);
    int expectedAdmissions = admissionForecastRepository.getTodayForecast();

    int projectedAvailable = currentAvailable + expectedDischarges - expectedAdmissions - waitingPatients;

    String assessment = projectedAvailable > 5  ? "✅ Capacité suffisante"
                      : projectedAvailable > 0  ? "⚠️ Capacité tendue"
                      : "🚨 Risque de saturation";

    return IntelligenceResult.metric(
        assessment,
        Map.of(
            "Lits disponibles maintenant", currentAvailable,
            "Patients en attente",         waitingPatients,
            "Congés prévus (24h)",         expectedDischarges,
            "Admissions prévues",          expectedAdmissions,
            "Projection fin de journée",   projectedAvailable
        )
    );
}
```

---

### 4. findBottleneck()
**Question :** "Où est le goulot d'étranglement ?" / "Quel service est le plus en difficulté ?"

```java
public IntelligenceResult findBottleneck() {
    // Calculer un score de "difficulté" par unité
    // Score = saturation% + (patients_en_attente * 10) + (lits_nettoyage * 5)
    List<UnitBottleneckScore> scores = entityManager.createNativeQuery("""
        SELECT
            b.unit,
            ROUND(COUNT(*) FILTER (WHERE b.state='OCCUPIED') * 100.0 / COUNT(*)) AS occ_rate,
            COUNT(*) FILTER (WHERE b.state='CLEANING')                           AS cleaning,
            COALESCE(w.waiting, 0)                                               AS waiting,
            ROUND(COUNT(*) FILTER (WHERE b.state='OCCUPIED') * 100.0 / COUNT(*)
                + COALESCE(w.waiting, 0) * 10
                + COUNT(*) FILTER (WHERE b.state='CLEANING') * 5)                AS bottleneck_score
        FROM beds b
        LEFT JOIN (
            SELECT target_unit, COUNT(*) AS waiting
            FROM stretchers WHERE status='WAITING'
            GROUP BY target_unit
        ) w ON w.target_unit = b.unit
        GROUP BY b.unit, w.waiting
        ORDER BY bottleneck_score DESC
        """, UnitBottleneckScore.class).getResultList();

    UnitBottleneckScore worst = scores.get(0);
    return IntelligenceResult.bottleneck(worst, scores);
}
```

---

### 5. getOverdueWaiting()
**Question :** "Y a-t-il des patients en attente trop longtemps ?"

```sql
SELECT p.mrd_number, p.first_name || ' ' || p.last_name AS name,
       p.diagnosis, s.risk_level, s.target_unit,
       EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60 AS wait_minutes,
       CASE s.risk_level
           WHEN 'ÉLEVÉ' THEN 30
           WHEN 'MOYEN' THEN 120
           ELSE 240
       END AS max_allowed_minutes
FROM stretchers s
JOIN patients p ON p.id = s.patient_id
WHERE s.status = 'WAITING'
  AND EXTRACT(EPOCH FROM (NOW() - s.wait_since))/60 > CASE s.risk_level
      WHEN 'ÉLEVÉ' THEN 30
      WHEN 'MOYEN' THEN 120
      ELSE 240
  END
ORDER BY wait_minutes DESC;
```

---

### 6. explainBlocker(String message) — Pourquoi ce patient n'a pas de lit ?

```java
public IntelligenceResult explainBlocker(String message) {
    // Extraire MRD du message
    String mrdNumber = extractMrd(message);
    Patient patient = patientRepository.findByMrdNumber(mrdNumber)
        .orElseThrow(() -> new PatientNotFoundException(mrdNumber));

    List<String> reasons = new ArrayList<>();

    // Vérifier disponibilité dans l'unité cible
    int available = bedRepository.countAvailableInUnit(patient.getTargetUnit());
    if (available == 0) {
        reasons.add("L'unité cible " + patient.getTargetUnit() + " est complète (0 lit disponible)");
    }

    // Vérifier si un lit lui est déjà réservé
    Optional<Attribution> attr = attributionRepository.findActiveForPatient(patient.getId());
    if (attr.isPresent()) {
        reasons.add("Un lit lui est réservé (Lit " + attr.get().getBedNumber() + ") mais le patient n'est pas encore arrivé");
    }

    // Vérifier si des lits sont bloqués en nettoyage
    int cleaning = bedRepository.countCleaningInUnit(patient.getTargetUnit());
    if (cleaning > 0) {
        reasons.add(cleaning + " lit(s) en nettoyage dans l'unité cible");
    }

    return IntelligenceResult.explanation(patient, reasons);
}
```

---

## RÈGLES IMPORTANTES

- Les seuils de délai (30 min ÉLEVÉ, 120 min MOYEN, 240 min FAIBLE) sont des **constantes dans application.yml**
- Le matching diagnostic → unité est **configurable en base de données** (table `diagnosis_unit_mapping`)
- Toutes les prévisions incluent une **mention d'incertitude** ("estimation basée sur les données historiques")
- Les alertes sont **horodatées** et **dédupliquées** (pas 2 alertes identiques en 5 minutes)
- `DecisionEngineService` utilise `@Transactional(readOnly = true)` sur toutes ses méthodes de lecture
