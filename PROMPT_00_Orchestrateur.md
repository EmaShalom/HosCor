# PROMPT PRINCIPAL — CisssCoord Intelligence Décisionnelle (Orchestrateur)

---

## CONTEXTE

Tu es un développeur Java senior spécialisé en systèmes hospitaliers.
Tu dois construire un **assistant clinique intelligent** intégré à CisssCoord —
une application gouvernementale de coordination hospitalière québécoise.

Ce chatbot n'est PAS un simple Q&R. C'est un **moteur d'intelligence décisionnelle** qui :
- Interroge la base de données en temps réel (PostgreSQL)
- Détecte l'intention précise de chaque message
- Exécute des requêtes SQL dynamiques ou des actions métier
- Applique des algorithmes de scoring et de recommandation
- Simule des scénarios (ex: impact de 5 nouvelles admissions)
- Répond toujours en français, avec des données réelles

---

## ARCHITECTURE GLOBALE

```
User message (texte libre)
        ↓
[IntentRouter] — détecte parmi 9 catégories d'intention
        ↓
┌─────────────────────────────────────────────────────────┐
│  MODULE 1 : BedIntelligenceService    (lits, saturation) │
│  MODULE 2 : PatientFlowService        (patients, matching)│
│  MODULE 3 : DecisionEngineService     (IA, simulation)   │
│  MODULE 4 : ActionExecutorService     (commandes actives) │
└─────────────────────────────────────────────────────────┘
        ↓
[ResponseFormatterService] — formate la réponse (texte + cards + alertes)
        ↓
Frontend ChatbotWidget (React)
```

---

## LES 9 CATÉGORIES D'INTENTION + BONUS

```java
public enum ChatbotIntent {

    // Catégorie 1 — Lits
    BED_COUNT,           // "Combien de lits disponibles ?"
    BED_SATURATION,      // "Quelle unité est proche de saturation ?"
    BED_RESERVED,        // "Quels lits sont réservés mais non occupés ?"
    BED_CLEANING,        // "Quels lits sont en nettoyage ?"
    BED_FORECAST,        // "Combien de lits libérés dans 24h ?"

    // Catégorie 2 — Patients en attente
    WAITING_COUNT,       // "Combien de patients attendent ?"
    WAITING_URGENT,      // "Qui sont les plus urgents ?"
    WAITING_BY_DIAG,     // "Patients en attente par diagnostic"
    WAITING_PRIORITY,    // "Quel patient prioriser maintenant ?"

    // Catégorie 3 — Matching patient → unité
    UNIT_MATCHING,       // "Dans quelle unité envoyer ce patient ?"
    UNIT_CAPACITY,       // "Quelle unité peut accepter des cas critiques ?"

    // Catégorie 4 — Transferts
    TRANSFER_STATUS,     // "Statut du patient MRD-EXT-002 ?"
    TRANSFER_LIST,       // "Liste des transferts sortants"
    TRANSFER_DELAYS,     // "Y a-t-il des retards ?"

    // Catégorie 5 — Alertes
    ALERT_CRITICAL,      // "Y a-t-il des situations critiques ?"
    ALERT_SATURATION,    // "Quelle unité risque la saturation ?"
    ALERT_WAIT_TOO_LONG, // "Patients qui attendent trop longtemps ?"

    // Catégorie 6 — Statistiques
    STATS_OCCUPANCY,     // "Taux d'occupation actuel ?"
    STATS_ADMISSIONS,    // "Admissions cette semaine ?"
    STATS_LOS,           // "Durée moyenne de séjour ?"
    STATS_DAMA,          // "Taux de DAMA ?"
    STATS_TRENDS,        // "Tendance des admissions ?"

    // Catégorie 7 — Anticipation
    FORECAST_TODAY,      // "Aura-t-on assez de lits aujourd'hui ?"
    FORECAST_TOMORROW,   // "Lits disponibles demain ?"
    FORECAST_RISK,       // "Risque de saturation aujourd'hui ?"

    // Catégorie 8 — Actions actives
    ACTION_ASSIGN_BED,   // "Assigne un lit au patient MRD-EXT-001"
    ACTION_RESERVE_BED,  // "Réserve un lit en cardiologie pour 14h"
    ACTION_CREATE_TRANSFER, // "Crée un transfert vers l'hôpital X"
    ACTION_MARK_CRITICAL,   // "Marque ce patient comme critique"
    ACTION_UPDATE_TRANSFER, // "Mets à jour le statut du transfert"

    // Catégorie 9 — Opérationnel
    OPS_BOTTLENECK,      // "Où est le goulot d'étranglement ?"
    OPS_BLOCKER,         // "Pourquoi ce patient n'a pas de lit ?"
    OPS_WHO_INTERVENE,   // "Qui doit intervenir ?"

    // BONUS — IA avancée
    AI_STRATEGY,         // "Meilleure stratégie pour réduire les délais"
    AI_DETERIORATION,    // "Quel patient risque une détérioration ?"
    AI_OPTIMIZE,         // "Optimise l'attribution des lits"
    AI_SIMULATE,         // "Simule 5 nouvelles admissions"
    AI_REORGANIZE,       // "Propose une réorganisation des unités"

    // Fallback
    PATIENT_SEARCH,      // Déjà implémenté — recherche par MRD/nom/lit
    GENERAL_QUESTION,    // Q&R base de données (pgvector)
    UNKNOWN              // Réponse de fallback
}
```

---

## INTENT ROUTER — IntentRouter.java

```java
@Component
public class IntentRouter {

    public ChatbotIntent route(String message) {
        String m = message.toLowerCase().trim();

        // ── Catégorie 8 : Actions (priority — toujours détecter en premier) ──
        if (m.matches(".*\\bassigne\\b.*\\b(lit|bed)\\b.*")) return ChatbotIntent.ACTION_ASSIGN_BED;
        if (m.matches(".*\\bréserve\\b.*\\b(lit|bed)\\b.*")) return ChatbotIntent.ACTION_RESERVE_BED;
        if (m.matches(".*\\bcrée\\b.*\\btransfert\\b.*"))    return ChatbotIntent.ACTION_CREATE_TRANSFER;
        if (m.matches(".*\\bmarque\\b.*\\bcritique\\b.*"))   return ChatbotIntent.ACTION_MARK_CRITICAL;
        if (m.matches(".*\\bmets à jour\\b.*\\btransfert\\b.*")) return ChatbotIntent.ACTION_UPDATE_TRANSFER;

        // ── Catégorie 1 : Lits ──
        if (m.matches(".*(combien|nombre).*(lit|lits).*(disponible|libre).*")) return ChatbotIntent.BED_COUNT;
        if (m.matches(".*(saturation|surcharge|pleine?|débordement).*"))       return ChatbotIntent.BED_SATURATION;
        if (m.matches(".*(réservé|réservés).*(non occupé|pas occupé|vide).*")) return ChatbotIntent.BED_RESERVED;
        if (m.matches(".*(nettoyage|cleaning).*"))                              return ChatbotIntent.BED_CLEANING;
        if (m.matches(".*(libéré|disponible).*(24h|demain|prochaine).*"))       return ChatbotIntent.BED_FORECAST;

        // ── Catégorie 2 : Patients en attente ──
        if (m.matches(".*(combien|nombre).*(patient|civière).*(attend|attente).*")) return ChatbotIntent.WAITING_COUNT;
        if (m.matches(".*(urgent|critique|priorité).*(attente|attend).*"))          return ChatbotIntent.WAITING_URGENT;
        if (m.matches(".*(attente).*(diagnostic|diagnostics).*"))                    return ChatbotIntent.WAITING_BY_DIAG;
        if (m.matches(".*(prioriser|priorité|quel patient).*(maintenant|d'abord).*")) return ChatbotIntent.WAITING_PRIORITY;

        // ── Catégorie 3 : Matching ──
        if (m.matches(".*(quelle unité|quel service).*(envoyer|admettre|assigner).*")) return ChatbotIntent.UNIT_MATCHING;
        if (m.matches(".*(unité|service).*(accepter|recevoir).*(critique|urgent).*"))  return ChatbotIntent.UNIT_CAPACITY;

        // ── Catégorie 4 : Transferts ──
        if (m.matches(".*\\bMRD-EXT\\b.*"))                                     return ChatbotIntent.TRANSFER_STATUS;
        if (m.matches(".*(liste|listez?).*(transfert|rapatriment).*"))           return ChatbotIntent.TRANSFER_LIST;
        if (m.matches(".*(retard|délai).*(transfert|rapatriment).*"))            return ChatbotIntent.TRANSFER_DELAYS;
        if (m.matches(".*(rapatriment|rapatrié).*(aujourd'hui|prévu).*"))        return ChatbotIntent.TRANSFER_LIST;

        // ── Catégorie 5 : Alertes ──
        if (m.matches(".*(situation|alerte).*(critique|urgente?).*"))            return ChatbotIntent.ALERT_CRITICAL;
        if (m.matches(".*(risque|danger).*(saturation|pleine?).*"))              return ChatbotIntent.ALERT_SATURATION;
        if (m.matches(".*(attente).*(trop long|longtemps|dépassé|heure).*"))     return ChatbotIntent.ALERT_WAIT_TOO_LONG;

        // ── Catégorie 6 : Stats ──
        if (m.matches(".*(taux).*(occupation|occupé).*"))  return ChatbotIntent.STATS_OCCUPANCY;
        if (m.matches(".*(admission|admis).*(semaine|mois|aujourd'hui).*")) return ChatbotIntent.STATS_ADMISSIONS;
        if (m.matches(".*(durée|moyenne).*(séjour|hospitalisation).*"))     return ChatbotIntent.STATS_LOS;
        if (m.matches(".*\\bdama\\b.*"))                                    return ChatbotIntent.STATS_DAMA;
        if (m.matches(".*(tendance|évolution).*(admission|patient).*"))     return ChatbotIntent.STATS_TRENDS;

        // ── Catégorie 7 : Anticipation ──
        if (m.matches(".*(assez|suffisant|manque).*(lit|lits).*(aujourd'hui|ce soir).*")) return ChatbotIntent.FORECAST_TODAY;
        if (m.matches(".*(lit|lits).*(demain|dans 24h).*"))                               return ChatbotIntent.FORECAST_TOMORROW;
        if (m.matches(".*(risque).*(saturation|pleine?).*(aujourd'hui|ce soir).*"))       return ChatbotIntent.FORECAST_RISK;

        // ── Catégorie 9 : Opérationnel ──
        if (m.matches(".*(goulot|bottleneck|blocage|bloque).*"))   return ChatbotIntent.OPS_BOTTLENECK;
        if (m.matches(".*(pourquoi).*(pas de lit|sans lit).*"))    return ChatbotIntent.OPS_BLOCKER;
        if (m.matches(".*(qui).*(intervenir|responsable|doit).*")) return ChatbotIntent.OPS_WHO_INTERVENE;

        // ── BONUS : IA avancée ──
        if (m.matches(".*(stratégie|optimis).*(délai|attente|lit).*"))  return ChatbotIntent.AI_STRATEGY;
        if (m.matches(".*(détérioration|aggrav).*(patient|risque).*"))  return ChatbotIntent.AI_DETERIORATION;
        if (m.matches(".*(optimi).*(attribution|lit|assignation).*"))   return ChatbotIntent.AI_OPTIMIZE;
        if (m.matches(".*(simul).*(admission|patient|impact).*"))       return ChatbotIntent.AI_SIMULATE;
        if (m.matches(".*(réorganis).*(unité|service|hôpital).*"))      return ChatbotIntent.AI_REORGANIZE;

        // ── Patient search (already implemented) ──
        if (message.toUpperCase().contains("MRD-")) return ChatbotIntent.PATIENT_SEARCH;
        if (m.matches(".*(cherche|trouve|où est|fiche).*(patient|mrd).*")) return ChatbotIntent.PATIENT_SEARCH;

        // ── Fallback ──
        return ChatbotIntent.GENERAL_QUESTION;
    }
}
```

---

## MASTER CHATBOT SERVICE — MasterChatbotService.java

```java
@Service
@RequiredArgsConstructor
public class MasterChatbotService {

    private final IntentRouter intentRouter;
    private final BedIntelligenceService bedService;
    private final PatientFlowService patientFlowService;
    private final DecisionEngineService decisionEngine;
    private final ActionExecutorService actionExecutor;
    private final PatientChatbotSearchService patientSearchService;
    private final ChatbotService qaService;  // existing Q&A service
    private final ResponseFormatterService formatter;

    public ChatbotResponseDto ask(String message, AppUserDetails user) throws Exception {

        ChatbotIntent intent = intentRouter.route(message);

        return switch (intent) {

            // ── Lits ──
            case BED_COUNT       -> formatter.format(bedService.getAvailableBedCount());
            case BED_SATURATION  -> formatter.format(bedService.getSaturationStatus());
            case BED_RESERVED    -> formatter.format(bedService.getReservedUnoccupied());
            case BED_CLEANING    -> formatter.format(bedService.getCleaningBeds());
            case BED_FORECAST    -> formatter.format(bedService.forecast24h());

            // ── Patients en attente ──
            case WAITING_COUNT    -> formatter.format(patientFlowService.getWaitingCount());
            case WAITING_URGENT   -> formatter.format(patientFlowService.getMostUrgent());
            case WAITING_BY_DIAG  -> formatter.format(patientFlowService.getWaitingByDiagnosis());
            case WAITING_PRIORITY -> formatter.format(patientFlowService.getPriorityPatient());

            // ── Matching ──
            case UNIT_MATCHING -> formatter.format(decisionEngine.matchPatientToUnit(message));
            case UNIT_CAPACITY -> formatter.format(decisionEngine.getUnitsAcceptingCritical());

            // ── Transferts ──
            case TRANSFER_STATUS -> formatter.format(patientFlowService.getTransferStatus(message));
            case TRANSFER_LIST   -> formatter.format(patientFlowService.getTransferList());
            case TRANSFER_DELAYS -> formatter.format(patientFlowService.getTransferDelays());

            // ── Alertes ──
            case ALERT_CRITICAL      -> formatter.format(decisionEngine.getCriticalAlerts());
            case ALERT_SATURATION    -> formatter.format(decisionEngine.getSaturationRisks());
            case ALERT_WAIT_TOO_LONG -> formatter.format(decisionEngine.getOverdueWaiting());

            // ── Stats ──
            case STATS_OCCUPANCY   -> formatter.format(bedService.getOccupancyRate());
            case STATS_ADMISSIONS  -> formatter.format(patientFlowService.getAdmissionStats());
            case STATS_LOS         -> formatter.format(patientFlowService.getAverageLOS());
            case STATS_DAMA        -> formatter.format(patientFlowService.getDamaRate());
            case STATS_TRENDS      -> formatter.format(patientFlowService.getAdmissionTrends());

            // ── Anticipation ──
            case FORECAST_TODAY    -> formatter.format(decisionEngine.forecastToday());
            case FORECAST_TOMORROW -> formatter.format(decisionEngine.forecastTomorrow());
            case FORECAST_RISK     -> formatter.format(decisionEngine.saturationRiskToday());

            // ── Actions (COORDINATOR + ADMIN only) ──
            case ACTION_ASSIGN_BED      -> actionExecutor.assignBed(message, user);
            case ACTION_RESERVE_BED     -> actionExecutor.reserveBed(message, user);
            case ACTION_CREATE_TRANSFER -> actionExecutor.createTransfer(message, user);
            case ACTION_MARK_CRITICAL   -> actionExecutor.markCritical(message, user);
            case ACTION_UPDATE_TRANSFER -> actionExecutor.updateTransfer(message, user);

            // ── Opérationnel ──
            case OPS_BOTTLENECK    -> formatter.format(decisionEngine.findBottleneck());
            case OPS_BLOCKER       -> formatter.format(decisionEngine.explainBlocker(message));
            case OPS_WHO_INTERVENE -> formatter.format(decisionEngine.whoShouldIntervene(message));

            // ── IA avancée ──
            case AI_STRATEGY      -> formatter.format(decisionEngine.generateStrategy());
            case AI_DETERIORATION -> formatter.format(decisionEngine.detectDeteriorationRisk());
            case AI_OPTIMIZE      -> formatter.format(decisionEngine.optimizeBedAssignment());
            case AI_SIMULATE      -> formatter.format(decisionEngine.simulateAdmissions(message));
            case AI_REORGANIZE    -> formatter.format(decisionEngine.proposeReorganization());

            // ── Patient search ──
            case PATIENT_SEARCH -> patientSearchService.searchFromMessage(message, user);

            // ── Q&A fallback ──
            default -> qaService.ask(message, user);
        };
    }
}
```

---

## RESPONSE FORMATTER — ResponseFormatterService.java

Toutes les réponses passent par ce service qui produit un objet unifié :

```java
@Service
public class ResponseFormatterService {

    public ChatbotResponseDto format(IntelligenceResult result) {
        return ChatbotResponseDto.builder()
            .type(result.getType())           // TEXT, METRIC, TABLE, ALERT, PATIENT_CARDS, CHART_DATA
            .message(result.getSummary())     // Texte principal en français
            .metrics(result.getMetrics())     // Liste de KPIs (label + valeur + couleur)
            .rows(result.getRows())           // Données tabulaires
            .alerts(result.getAlerts())       // Alertes critiques
            .patients(result.getPatients())   // Fiches patients
            .recommendation(result.getReco()) // Recommandation IA
            .confidence(result.getConfidence()) // Score de confiance 0-1
            .build();
    }
}
```

### Types de réponse frontend :

| Type | Rendu React |
|------|-------------|
| `TEXT` | Bulle de texte simple |
| `METRIC` | Cards KPI avec chiffres colorés |
| `TABLE` | Tableau compact scrollable |
| `ALERT` | Bannière rouge/orange avec icône |
| `PATIENT_CARDS` | Fiches patients (déjà implémenté) |
| `CHART_DATA` | Mini chart (recharts) |
| `ACTION_CONFIRM` | Boutons Confirmer / Annuler |

---

## CE QU'IL FAUT GÉNÉRER (dans l'ordre)

1. `ChatbotIntent.java` (enum complet)
2. `IntentRouter.java` (routeur regex complet)
3. `IntelligenceResult.java` (DTO résultat unifié)
4. `ChatbotResponseDto.java` (mise à jour avec tous les types)
5. `ResponseFormatterService.java`
6. `MasterChatbotService.java`
7. Ensuite utiliser les 3 prompts spécialisés ci-dessous :
   - **PROMPT-MODULE1** : BedIntelligenceService
   - **PROMPT-MODULE2** : PatientFlowService + DecisionEngineService
   - **PROMPT-MODULE3** : ActionExecutorService + IA avancée
