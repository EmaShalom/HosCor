# PROMPT MODULE 1 — BedIntelligenceService (Lits + Statistiques)

> Coller dans ChatGPT APRÈS le prompt orchestrateur.

---

## CONTEXTE

Tu dois implémenter `BedIntelligenceService.java` — le module qui répond à
toutes les questions sur les lits, la saturation, les statistiques et les prévisions de base.

---

## MÉTHODES À IMPLÉMENTER (toutes retournent `IntelligenceResult`)

### 1. getAvailableBedCount()
**Question déclencheur :** "Combien de lits sont disponibles actuellement ?"

```sql
SELECT
    unit,
    COUNT(*) FILTER (WHERE state = 'AVAILABLE' OR state = 'READY') AS available,
    COUNT(*) FILTER (WHERE state = 'OCCUPIED')                     AS occupied,
    COUNT(*) FILTER (WHERE state = 'CLEANING')                     AS cleaning,
    COUNT(*)                                                        AS total
FROM beds
GROUP BY unit
ORDER BY unit;
```

**Réponse formatée :**
```
Il y a actuellement X lits disponibles sur Y lits au total (taux d'occupation : Z%).

Par unité :
• 2e Nord (Cardiologie)   : 4 disponibles / 15
• 2e Sud (Soins intensifs): 2 disponibles / 15
• 3e Nord (Néphrologie)   : 6 disponibles / 15
• 3e Sud (Médecine gén.)  : 3 disponibles / 15

L'unité avec le plus de disponibilités est 3e Nord.
```

**Type de retour :** `METRIC` + tableau par unité

---

### 2. getSaturationStatus()
**Questions déclencheurs :**
- "Quelle unité a le plus de lits disponibles ?"
- "Y a-t-il des unités en surcharge ?"
- "Donne-moi les unités proches de saturation"

**Algorithme de scoring :**
```java
double saturationScore = (double) occupiedBeds / totalBeds;

SaturationLevel level = saturationScore >= 0.95 ? CRITIQUE    // ≥ 95%
                      : saturationScore >= 0.85 ? ELEVEE      // 85-94%
                      : saturationScore >= 0.70 ? MODEREE     // 70-84%
                      : NORMALE;                               // < 70%
```

**Réponse formatée :**
```
⚠️ ALERTE — 2e Sud est en surcharge critique (96% occupé, 1 lit libre)

Statut des unités :
🔴 2e Sud (Soins intensifs) : 96% — CRITIQUE    (14/15 occupés)
🟠 2e Nord (Cardiologie)   : 87% — ÉLEVÉE      (13/15 occupés)
🟡 3e Sud (Médecine gén.)  : 73% — MODÉRÉE     (11/15 occupés)
🟢 3e Nord (Néphrologie)   : 60% — NORMALE      (9/15 occupés)

Recommandation : Rediriger les nouvelles admissions vers 3e Nord.
```

**Type de retour :** `ALERT` si score ≥ 85%, sinon `METRIC`

---

### 3. getReservedUnoccupied()
**Question déclencheur :** "Quels lits sont réservés mais non occupés ?"

```sql
SELECT b.unit, b.bed_number, a.stretcher_number, a.assigned_at,
       EXTRACT(EPOCH FROM (NOW() - a.assigned_at))/60 AS minutes_reserved
FROM beds b
JOIN attributions a ON a.bed_id = b.id
LEFT JOIN patients p ON p.bed_number = b.bed_number AND p.unit = b.unit AND p.status = 'ADMITTED'
WHERE p.id IS NULL
  AND b.state != 'OCCUPIED'
ORDER BY a.assigned_at ASC;
```

**Réponse formatée :**
```
3 lits sont réservés mais pas encore occupés :

• Lit 7 — Unité 2N | Civière #12 | Réservé depuis 23 min
• Lit 3 — Unité 3S | Civière #8  | Réservé depuis 41 min ⚠️
• Lit 11 — Unité 2S | Civière #5  | Réservé depuis 67 min 🚨

Note : Le lit 11 (2S) dépasse le délai de 60 min — vérification recommandée.
```

**Type de retour :** `TABLE`

---

### 4. getCleaningBeds()
**Question déclencheur :** "Quels lits sont en nettoyage ?"

```sql
SELECT unit, bed_number, last_updated,
       EXTRACT(EPOCH FROM (NOW() - last_updated))/60 AS minutes_cleaning
FROM beds
WHERE state = 'CLEANING'
ORDER BY last_updated ASC;
```

**Réponse formatée :**
```
5 lits sont actuellement en nettoyage (non disponibles) :

Unité 2N : Lit 4 (depuis 12 min), Lit 9 (depuis 28 min)
Unité 2S : Lit 2 (depuis 8 min)
Unité 3S : Lit 6 (depuis 45 min ⚠️), Lit 13 (depuis 52 min ⚠️)

⚠️ 2 lits dépassent 30 min de nettoyage — relance recommandée.
```

**Type de retour :** `TABLE`

---

### 5. forecast24h()
**Question déclencheur :** "Combien de lits seront libérés dans les prochaines 24h ?"

**Algorithme de prévision :**
```sql
-- Patients avec séjour prévu de se terminer dans 24h
-- (basé sur durée moyenne de séjour par diagnostic)
SELECT p.unit, COUNT(*) AS expected_discharges
FROM patients p
JOIN diagnosis_avg_los d ON d.diagnosis_code = p.diagnosis_code
WHERE p.status = 'ADMITTED'
  AND (p.admission_date + (d.avg_los_hours || ' hours')::interval) <= NOW() + INTERVAL '24 hours'
GROUP BY p.unit;
```

**Réponse formatée :**
```
Prévision sur 24h :

Congés probables :
• 2e Nord : ~3 patients (lits 2, 8, 14)
• 3e Nord : ~2 patients (lits 5, 11)
• 2e Sud  : ~1 patient  (lit 7)
• 3e Sud  : ~4 patients (lits 1, 3, 9, 12)

Total estimé : 10 lits devraient se libérer.
⚠️ Note : Ces prévisions sont basées sur la durée moyenne de séjour par diagnostic.
```

**Type de retour :** `METRIC` + tableau

---

### 6. getOccupancyRate()
**Question déclencheur :** "Quel est le taux d'occupation actuel ?"

```sql
SELECT
    ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / COUNT(*), 1) AS global_rate,
    unit,
    ROUND(COUNT(*) FILTER (WHERE state = 'OCCUPIED') * 100.0 / COUNT(*), 1) AS unit_rate
FROM beds
GROUP BY ROLLUP(unit)
ORDER BY unit NULLS LAST;
```

**Type de retour :** `CHART_DATA` (bar chart par unité) + taux global en gros

---

## CLASSE COMPLÈTE À GÉNÉRER

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class BedIntelligenceService {

    private final BedRepository bedRepository;
    private final AttributionRepository attributionRepository;
    private final PatientRepository patientRepository;
    private final EntityManager entityManager;  // pour les requêtes natives complexes

    // Seuils de saturation
    private static final double THRESHOLD_CRITIQUE = 0.95;
    private static final double THRESHOLD_ELEVEE   = 0.85;
    private static final double THRESHOLD_MODEREE  = 0.70;
    private static final int    CLEANING_ALERT_MIN = 30;
    private static final int    RESERVATION_ALERT_MIN = 60;

    public IntelligenceResult getAvailableBedCount() { ... }
    public IntelligenceResult getSaturationStatus()  { ... }
    public IntelligenceResult getReservedUnoccupied() { ... }
    public IntelligenceResult getCleaningBeds()      { ... }
    public IntelligenceResult forecast24h()          { ... }
    public IntelligenceResult getOccupancyRate()     { ... }
}
```

---

## RÈGLES IMPORTANTES

- Toutes les méthodes doivent utiliser des **requêtes natives SQL** via `EntityManager` ou `@Query(nativeQuery=true)` — pas de JPQL pour les agrégats complexes
- Les seuils de saturation sont des **constantes configurables** (pas hardcodées dans la logique métier)
- Chaque méthode inclut un **message en français** clair et actionnable
- Les alertes (CRITIQUE, ÉLEVÉE) déclenchent un type `ALERT` dans `IntelligenceResult`
- Toutes les durées sont calculées en **minutes** et affichées de façon lisible (ex: "2h 15min")
- Ajouter `@Cacheable(value = "bedStats", key = "#root.methodName")` sur les méthodes stats avec TTL de 30 secondes
