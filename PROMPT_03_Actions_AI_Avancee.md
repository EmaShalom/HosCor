# PROMPT MODULE 3 — ActionExecutorService + IA Avancée (Scoring, Simulation, Optimisation)

> Coller dans ChatGPT APRÈS le prompt Module 2.

---

## PARTIE A — ActionExecutorService.java (Catégorie 8 : Commandes actives)

Le chatbot peut **exécuter des actions réelles** — pas seulement répondre.
Ces actions sont réservées aux rôles **COORDINATEUR** et **ADMIN**.
Toutes les actions déclenchent une **confirmation frontend** avant exécution.

### Pattern : Toutes les actions suivent ce flux

```
1. Parse le message → extraire paramètres
2. Valider les paramètres (patient existe ? lit disponible ? etc.)
3. Retourner un ChatbotResponseDto de type ACTION_CONFIRM avec résumé
4. L'utilisateur clique "Confirmer" → appel POST /api/chatbot/action/confirm
5. Exécuter l'action réelle
6. Notifier via WebSocket
7. Retourner confirmation
```

---

### 1. assignBed(String message, AppUserDetails user)
**Commande :** "Assigne un lit au patient MRD-EXT-001"

```java
public ChatbotResponseDto assignBed(String message, AppUserDetails user) {
    requireRole(user, "ROLE_COORDINATOR", "ROLE_ADMIN");

    // 1. Extraire MRD
    String mrdNumber = extractMrd(message);
    Patient patient = patientRepository.findByMrdNumber(mrdNumber)
        .orElseThrow(() -> new PatientNotFoundException(mrdNumber));

    // 2. Trouver la meilleure civière pour ce patient
    Stretcher stretcher = stretcherRepository
        .findFirstByPatientIdAndStatus(patient.getId(), "WAITING")
        .orElseThrow(() -> new BusinessException("Ce patient n'a pas de civière en attente."));

    // 3. Trouver le meilleur lit disponible dans l'unité cible
    Bed bestBed = bedRepository
        .findFirstByUnitAndStateOrderByBedNumber(stretcher.getTargetUnit(), "AVAILABLE")
        .orElseThrow(() -> new BusinessException(
            "Aucun lit disponible dans l'unité " + stretcher.getTargetUnit() + "."
        ));

    // 4. Retourner demande de confirmation (pas encore exécuté)
    return ChatbotResponseDto.actionConfirm(
        "ASSIGN_BED",
        Map.of(
            "patientId",   patient.getId(),
            "stretcherId", stretcher.getId(),
            "bedId",       bestBed.getId()
        ),
        "Confirmer l'assignation ?\n\n" +
        "Patient : " + patient.getFullName() + " (" + mrdNumber + ")\n" +
        "Civière : #" + stretcher.getStretcherNumber() + "\n" +
        "Lit attribué : Lit " + bestBed.getBedNumber() + " — " + stretcher.getTargetUnit()
    );
}
```

---

### 2. reserveBed(String message, AppUserDetails user)
**Commande :** "Réserve un lit en cardiologie pour 14h"

```java
public ChatbotResponseDto reserveBed(String message, AppUserDetails user) {
    requireRole(user, "ROLE_COORDINATOR", "ROLE_ADMIN");

    // Extraire unité et heure du message
    String unit = extractUnit(message);          // "2N" pour "cardiologie"
    LocalTime time = extractTime(message);       // "14:00"

    // Trouver un lit disponible
    Bed bed = bedRepository.findFirstByUnitAndState(unit, "AVAILABLE")
        .orElseThrow(() -> new BusinessException("Aucun lit disponible en " + unit));

    LocalDateTime scheduledAt = LocalDate.now().atTime(time);

    return ChatbotResponseDto.actionConfirm(
        "RESERVE_BED",
        Map.of("bedId", bed.getId(), "scheduledAt", scheduledAt),
        "Confirmer la réservation ?\n\n" +
        "Lit : " + bed.getBedNumber() + " — Unité " + unit + "\n" +
        "Pour : " + time.format(DateTimeFormatter.ofPattern("HH:mm"))
    );
}
```

---

### 3. createTransfer(String message, AppUserDetails user)
**Commande :** "Crée un transfert vers l'Hôpital Maisonneuve-Rosemont"

```java
public ChatbotResponseDto createTransfer(String message, AppUserDetails user) {
    requireRole(user, "ROLE_COORDINATOR", "ROLE_ADMIN");

    String mrdNumber   = extractMrd(message);
    String destination = extractHospitalName(message);

    Patient patient = patientRepository.findByMrdNumber(mrdNumber)
        .orElseThrow(() -> new PatientNotFoundException(mrdNumber));

    return ChatbotResponseDto.actionConfirm(
        "CREATE_TRANSFER",
        Map.of("patientId", patient.getId(), "destination", destination),
        "Confirmer la création du transfert ?\n\n" +
        "Patient : " + patient.getFullName() + "\n" +
        "Destination : " + destination + "\n" +
        "Statut initial : EN_ATTENTE"
    );
}
```

---

### 4. markCritical(String message, AppUserDetails user)
**Commande :** "Marque le patient MRD-1042 comme critique"

Change le `risk_level` du patient à `ÉLEVÉ` et envoie une alerte WebSocket à tous les coordinateurs connectés.

---

### 5. ActionConfirmController.java

```java
@PostMapping("/api/chatbot/action/confirm")
@PreAuthorize("hasAnyRole('ROLE_COORDINATOR', 'ROLE_ADMIN')")
public ResponseEntity<ApiResponse<ChatbotResponseDto>> confirmAction(
        @RequestBody ActionConfirmRequest request,
        @AuthenticationPrincipal AppUserDetails user) {

    ChatbotResponseDto result = switch (request.getActionType()) {
        case "ASSIGN_BED"       -> actionExecutor.executeAssignBed(request.getParams(), user);
        case "RESERVE_BED"      -> actionExecutor.executeReserveBed(request.getParams(), user);
        case "CREATE_TRANSFER"  -> actionExecutor.executeCreateTransfer(request.getParams(), user);
        case "MARK_CRITICAL"    -> actionExecutor.executeMarkCritical(request.getParams(), user);
        case "UPDATE_TRANSFER"  -> actionExecutor.executeUpdateTransfer(request.getParams(), user);
        default -> throw new BusinessException("Action inconnue : " + request.getActionType());
    };

    return ResponseEntity.ok(ApiResponse.success(result));
}
```

---

## PARTIE B — IA Avancée dans DecisionEngineService.java

### 1. generateStrategy() — "Meilleure stratégie pour réduire les délais"

```java
public IntelligenceResult generateStrategy() {

    // Collecter toutes les métriques actuelles
    int waiting       = stretcherRepository.countWaiting();
    int highRisk      = stretcherRepository.countWaitingByRisk("ÉLEVÉ");
    int cleaning      = bedRepository.countCleaning();
    int available     = bedRepository.countAvailable();
    double avgWait    = stretcherRepository.getAverageWaitMinutes();
    List<UnitSaturation> saturation = bedRepository.getUnitSaturation();

    // Générer des recommandations prioritisées
    List<StrategyRecommendation> recommendations = new ArrayList<>();

    if (highRisk > 0) {
        recommendations.add(StrategyRecommendation.critical(
            "Assigner immédiatement les " + highRisk + " patient(s) à risque élevé",
            "Priorité absolue — délai max 30 min déjà " + (avgWait > 30 ? "DÉPASSÉ" : "en approche")
        ));
    }

    if (cleaning > 3) {
        recommendations.add(StrategyRecommendation.high(
            "Accélérer le nettoyage des " + cleaning + " lits en cours",
            "Libère " + cleaning + " lits supplémentaires rapidement"
        ));
    }

    saturation.stream()
        .filter(u -> u.getSaturationRate() >= 0.85)
        .forEach(u -> recommendations.add(StrategyRecommendation.medium(
            "Rediriger les nouvelles admissions hors de " + u.getUnitName(),
            "Taux d'occupation : " + Math.round(u.getSaturationRate() * 100) + "%"
        )));

    if (available > 5 && waiting > available) {
        recommendations.add(StrategyRecommendation.medium(
            "Lancer une assignation groupée des " + Math.min(waiting, available) + " prochains patients",
            "Réduirait le temps d'attente moyen de ~" + Math.round(avgWait * 0.4) + " min"
        ));
    }

    return IntelligenceResult.strategy(recommendations);
}
```

---

### 2. detectDeteriorationRisk() — "Quel patient risque une détérioration ?"

**Score de risque de détérioration :**

```java
public IntelligenceResult detectDeteriorationRisk() {

    // Patients admis avec facteurs de risque de détérioration
    List<Patient> patients = patientRepository.findAdmitted();

    List<DeteriorationRisk> risks = patients.stream()
        .map(p -> {
            double score = 0.0;

            // Facteur 1 : Risque déjà élevé
            if ("ÉLEVÉ".equals(p.getRiskLevel())) score += 40;
            else if ("MOYEN".equals(p.getRiskLevel())) score += 20;

            // Facteur 2 : Âge avancé (> 75 ans)
            if (p.getAge() > 75) score += 15;
            else if (p.getAge() > 65) score += 8;

            // Facteur 3 : Longue durée d'attente avant admission
            long waitHours = p.getStretcherWaitMinutes() / 60;
            if (waitHours > 4) score += 20;
            else if (waitHours > 2) score += 10;

            // Facteur 4 : Diagnostics à risque élevé de détérioration
            String diag = p.getDiagnosis().toLowerCase();
            if (diag.contains("cardiaque") || diag.contains("sepsis")) score += 20;
            else if (diag.contains("pulmonaire") || diag.contains("aki")) score += 10;

            // Facteur 5 : Soins intensifs recommandés mais en unité générale
            if ("2S".equals(p.getRecommendedUnit()) && !"2S".equals(p.getUnit())) score += 15;

            return new DeteriorationRisk(p, Math.min(score, 100));
        })
        .filter(r -> r.getScore() >= 50)
        .sorted(Comparator.comparingDouble(DeteriorationRisk::getScore).reversed())
        .limit(5)
        .collect(Collectors.toList());

    if (risks.isEmpty()) {
        return IntelligenceResult.text("✅ Aucun patient ne présente de risque de détérioration imminent selon les indicateurs actuels.");
    }

    return IntelligenceResult.deteriorationRisks(risks);
}
```

---

### 3. optimizeBedAssignment() — "Optimise l'attribution des lits"

```java
public IntelligenceResult optimizeBedAssignment() {

    List<Stretcher> waiting = stretcherRepository.findWaitingOrderByPriority();
    List<Bed> available = bedRepository.findAvailableOrReady();

    List<OptimalAssignment> assignments = new ArrayList<>();

    for (Stretcher stretcher : waiting) {
        // Trouver le meilleur lit selon :
        // 1. Correspondance unité recommandée
        // 2. Lit le plus longtemps disponible (éviter le turnover rapide)
        // 3. Proximité avec unité de soins intensifs pour risque élevé

        Optional<Bed> bestBed = available.stream()
            .filter(b -> b.getUnit().equals(stretcher.getTargetUnit()))
            .filter(b -> !assignments.stream().anyMatch(a -> a.getBed().getId().equals(b.getId())))
            .findFirst();

        if (bestBed.isPresent()) {
            assignments.add(new OptimalAssignment(stretcher, bestBed.get(),
                calculateMatchScore(stretcher, bestBed.get())));
        }
    }

    return IntelligenceResult.optimizedAssignments(assignments);
}
```

---

### 4. simulateAdmissions(String message) — "Simule l'impact de 5 nouvelles admissions"

```java
public IntelligenceResult simulateAdmissions(String message) {

    int count = extractNumber(message); // Extrait "5" de "5 nouvelles admissions"

    // État actuel
    int currentAvailable = bedRepository.countAvailable();
    int currentWaiting   = stretcherRepository.countWaiting();
    List<UnitSaturation> currentSaturation = bedRepository.getUnitSaturation();

    // Simulation : répartition selon tendance historique par unité
    Map<String, Integer> distribution = admissionForecastRepository.getHistoricalDistribution(count);

    // État projeté
    List<SimulationResult> projected = currentSaturation.stream().map(unit -> {
        int additionalAdmissions = distribution.getOrDefault(unit.getUnit(), 0);
        int newOccupied   = unit.getOccupied() + additionalAdmissions;
        int newAvailable  = unit.getTotal() - newOccupied;
        double newRate    = (double) newOccupied / unit.getTotal();

        return new SimulationResult(
            unit.getUnit(),
            unit.getOccupied(), unit.getAvailable(), unit.getSaturationRate(),  // avant
            newOccupied, Math.max(newAvailable, 0), newRate,                    // après
            additionalAdmissions
        );
    }).collect(Collectors.toList());

    int projectedAvailable = currentAvailable - count;
    String verdict = projectedAvailable > 5  ? "✅ Le système peut absorber " + count + " admissions supplémentaires."
                   : projectedAvailable >= 0 ? "⚠️ Capacité tendue après " + count + " admissions. Surveillance recommandée."
                   : "🚨 Capacité insuffisante — " + Math.abs(projectedAvailable) + " patient(s) sans lit si " + count + " admissions simultanées.";

    return IntelligenceResult.simulation(verdict, projected, count);
}
```

---

### 5. proposeReorganization() — "Propose une réorganisation des unités"

```java
public IntelligenceResult proposeReorganization() {

    List<UnitSaturation> saturation = bedRepository.getUnitSaturation();

    // Identifier les unités sur-chargées et sous-chargées
    List<UnitSaturation> overloaded  = saturation.stream().filter(u -> u.getSaturationRate() >= 0.85).toList();
    List<UnitSaturation> underloaded = saturation.stream().filter(u -> u.getSaturationRate() <= 0.60).toList();

    List<ReorganizationProposal> proposals = new ArrayList<>();

    for (UnitSaturation over : overloaded) {
        for (UnitSaturation under : underloaded) {
            int transferrable = Math.min(
                (int)(over.getOccupied() - over.getTotal() * 0.75),  // réduire à 75%
                under.getAvailable()
            );
            if (transferrable > 0) {
                proposals.add(new ReorganizationProposal(
                    over.getUnit(), under.getUnit(), transferrable,
                    "Transférer " + transferrable + " patient(s) de " + over.getUnitName()
                    + " vers " + under.getUnitName()
                    + " ramènerait " + over.getUnitName() + " à ~75% d'occupation."
                ));
            }
        }
    }

    return IntelligenceResult.reorganization(proposals, saturation);
}
```

---

## FRONTEND — ChatbotWidget.jsx (mises à jour pour Module 3)

### Rendu ACTION_CONFIRM :

```jsx
const ActionConfirmCard = ({ action, onConfirm, onCancel }) => (
  <div style={{
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '10px',
    padding: '14px',
    marginTop: '8px'
  }}>
    <p style={{ fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
      ⚡ Action demandée
    </p>
    <pre style={{ fontSize: '12px', color: '#475569', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
      {action.summary}
    </pre>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={() => onConfirm(action)} style={{
        background: '#16a34a', color: '#fff', border: 'none',
        borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontWeight: 600
      }}>✓ Confirmer</button>
      <button onClick={onCancel} style={{
        background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
        borderRadius: '6px', padding: '6px 16px', cursor: 'pointer'
      }}>✕ Annuler</button>
    </div>
  </div>
);
```

### Rendu SIMULATION :

```jsx
const SimulationCard = ({ simulation }) => (
  <div style={{ marginTop: '8px' }}>
    <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>{simulation.verdict}</p>
    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f1f5f9' }}>
          <th style={{ padding: '4px 8px', textAlign: 'left' }}>Unité</th>
          <th style={{ padding: '4px 8px' }}>Avant</th>
          <th style={{ padding: '4px 8px' }}>Après</th>
          <th style={{ padding: '4px 8px' }}>Impact</th>
        </tr>
      </thead>
      <tbody>
        {simulation.projected.map(row => (
          <tr key={row.unit} style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '4px 8px', fontWeight: 600 }}>{row.unit}</td>
            <td style={{ padding: '4px 8px', textAlign: 'center' }}>{Math.round(row.rateBefore * 100)}%</td>
            <td style={{ padding: '4px 8px', textAlign: 'center',
              color: row.rateAfter >= 0.95 ? '#dc2626' : row.rateAfter >= 0.85 ? '#d97706' : '#16a34a'
            }}>{Math.round(row.rateAfter * 100)}%</td>
            <td style={{ padding: '4px 8px', textAlign: 'center' }}>+{row.additionalAdmissions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

---

## CE QU'IL FAUT GÉNÉRER (Module 3)

1. `ActionExecutorService.java` (toutes les actions + validation + confirmation)
2. `ActionConfirmController.java` (endpoint de confirmation)
3. `ActionConfirmRequest.java` (DTO)
4. `generateStrategy()` dans `DecisionEngineService`
5. `detectDeteriorationRisk()` dans `DecisionEngineService`
6. `optimizeBedAssignment()` dans `DecisionEngineService`
7. `simulateAdmissions()` dans `DecisionEngineService`
8. `proposeReorganization()` dans `DecisionEngineService`
9. `StrategyRecommendation.java`, `DeteriorationRisk.java`, `OptimalAssignment.java`, `SimulationResult.java` (DTOs)
10. `ActionConfirmCard.jsx` component
11. `SimulationCard.jsx` component
12. `StrategyCard.jsx` component
13. Mise à jour `ChatbotWidget.jsx` pour gérer tous les nouveaux types de réponse

---

## RÈGLES IMPORTANTES

- Toutes les **actions** requièrent une **double confirmation** (afficher le résumé → l'utilisateur clique Confirmer)
- Les actions sont **loggées** dans une table `action_audit_log` avec : user, action_type, params, timestamp, result
- Le score de détérioration est **affiché en pourcentage** avec couleur (< 50% vert, 50-75% orange, > 75% rouge)
- La simulation est **clairement étiquetée** comme estimation — jamais présentée comme certitude
- Les propositions de réorganisation incluent toujours un **avertissement** : "Ces suggestions nécessitent validation médicale avant exécution"
- Tous les calculs de simulation utilisent **Math.round()** — aucun décimal affiché
