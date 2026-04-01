# PROMPT MODULE 4 — Catégorie 10 : Questions d'assistance utilisateur
# (How-To Guide + Navigation intelligente + Réponses guidées)

> Coller dans ChatGPT APRÈS les 4 prompts précédents.
> Ce module ajoute le TYPE 4 au chatbot : "Comment faire... ?"

---

## CONTEXTE

Le chatbot CisssCoord gère maintenant 4 types de questions :

| Type | Exemple | Module |
|------|---------|--------|
| Type 1 — INFO     | "Combien de lits disponibles ?"          | Module 1-2 |
| Type 2 — DÉCISION | "Où envoyer ce patient ?"                | Module 2-3 |
| Type 3 — ACTION   | "Assigne un lit au patient MRD-001"      | Module 3   |
| Type 4 — GUIDE    | "Comment assigner un lit à un patient ?" | **Module 4** |

Le Type 4 retourne des **réponses guidées étape par étape** avec :
- Instructions numérotées claires
- Contexte visuel (quelle section de l'app)
- Conseil intelligent lié au contexte actuel du système
- Liens directs vers la section concernée (via `sendToSection()`)

---

## MISE À JOUR DE L'INTENT ROUTER

Ajouter ces intentions dans `ChatbotIntent.java` :

```java
// ── Catégorie 10 : Assistance utilisateur ──

// Lits / patients
GUIDE_ASSIGN_BED,        // "Comment assigner un lit ?"
GUIDE_ADMIT_PATIENT,     // "Comment coucher un patient ?"
GUIDE_CHANGE_BED,        // "Comment changer le lit d'un patient ?"
GUIDE_FREE_BED,          // "Comment libérer un lit ?"
GUIDE_MARK_OCCUPIED,     // "Comment marquer un lit comme occupé ?"
GUIDE_VIEW_BEDS,         // "Comment voir les lits disponibles ?"
GUIDE_RESERVE_BED,       // "Comment réserver un lit à l'avance ?"
GUIDE_CANCEL_RESERVATION,// "Comment annuler une réservation ?"

// Patients en attente
GUIDE_ADD_WAITING,       // "Comment ajouter un patient en attente ?"
GUIDE_PRIORITIZE,        // "Comment prioriser un patient critique ?"
GUIDE_ASSIGN_UNIT,       // "Comment affecter un patient à une unité ?"
GUIDE_VIEW_WAITING,      // "Comment voir les patients en attente ?"
GUIDE_FILTER_URGENCY,    // "Comment filtrer par urgence ?"
GUIDE_UPDATE_STATUS,     // "Comment mettre à jour le statut ?"

// Transferts
GUIDE_CREATE_TRANSFER,   // "Comment créer un rapatriement ?"
GUIDE_OUTGOING_TRANSFER, // "Comment enregistrer un transfert sortant ?"
GUIDE_ASSIGN_INCOMING,   // "Comment assigner une unité à un patient entrant ?"
GUIDE_RESERVE_TRANSFER,  // "Comment réserver un lit pour un transfert ?"
GUIDE_CHANGE_TRANSFER,   // "Comment changer le statut d'un transfert ?"
GUIDE_CANCEL_TRANSFER,   // "Comment annuler un transfert ?"
GUIDE_CONFIRM_ARRIVAL,   // "Comment confirmer l'arrivée d'un patient ?"

// Alertes
GUIDE_HANDLE_ALERT,      // "Comment traiter une alerte critique ?"
GUIDE_VIEW_ALERTS,       // "Comment voir les alertes actives ?"
GUIDE_RESOLVE_ALERT,     // "Comment marquer une alerte comme résolue ?"
GUIDE_IDENTIFY_URGENT,   // "Comment identifier les patients urgents ?"
GUIDE_CHECK_SATURATION,  // "Comment vérifier les risques de saturation ?"

// Dashboard
GUIDE_READ_DASHBOARD,    // "Comment lire le tableau de bord ?"
GUIDE_WEEK_STATS,        // "Comment voir les statistiques de la semaine ?"
GUIDE_ANALYZE_ADMISSIONS,// "Comment analyser les admissions ?"
GUIDE_IDENTIFY_DIFFICULT,// "Comment identifier les unités en difficulté ?"
GUIDE_ANTICIPATE_BEDS,   // "Comment anticiper les lits disponibles ?"

// Coordination métier
GUIDE_CRITICAL_WAIT,     // "Que faire si un patient critique attend trop longtemps ?"
GUIDE_BED_SHORTAGE,      // "Comment gérer un manque de lits ?"
GUIDE_MULTI_PRIORITY,    // "Comment prioriser plusieurs patients en même temps ?"
GUIDE_CHOOSE_UNIT,       // "Quelle unité choisir pour un patient ?"
GUIDE_OPTIMIZE,          // "Comment optimiser l'occupation des lits ?"
```

---

## MISE À JOUR DE L'INTENT ROUTER — détection des patterns "Comment"

```java
// Dans IntentRouter.java — ajouter AVANT le bloc Catégorie 1

// ── Catégorie 10 : Guide (détection prioritaire sur les mots "comment", "comment faire") ──
if (m.matches(".*(comment|how to|étapes?|procédure).*(assigner?|attribuer?).*(lit|bed).*")) return GUIDE_ASSIGN_BED;
if (m.matches(".*(comment).*(coucher|admettre|enregistrer).*(patient).*"))                  return GUIDE_ADMIT_PATIENT;
if (m.matches(".*(comment).*(changer|déplacer|transférer).*(lit).*"))                       return GUIDE_CHANGE_BED;
if (m.matches(".*(comment).*(libérer?|vider?|dégager?).*(lit).*"))                         return GUIDE_FREE_BED;
if (m.matches(".*(comment).*(marquer?|mettre?).*(occupé|occupation).*"))                    return GUIDE_MARK_OCCUPIED;
if (m.matches(".*(comment).*(voir|afficher?|consulter?).*(lit|lits).*(disponible).*"))      return GUIDE_VIEW_BEDS;
if (m.matches(".*(comment).*(réserver?).*(lit|bed).*"))                                     return GUIDE_RESERVE_BED;
if (m.matches(".*(comment).*(annuler?).*(réservation).*"))                                  return GUIDE_CANCEL_RESERVATION;

if (m.matches(".*(comment).*(ajouter?|créer?|enregistrer?).*(patient).*(attente).*"))       return GUIDE_ADD_WAITING;
if (m.matches(".*(comment).*(prioriser?|priorité).*(patient|critique).*"))                  return GUIDE_PRIORITIZE;
if (m.matches(".*(comment).*(affecter?|assigner?).*(patient).*(unité).*"))                  return GUIDE_ASSIGN_UNIT;
if (m.matches(".*(comment).*(voir|afficher?|liste).*(patient).*(attente).*"))               return GUIDE_VIEW_WAITING;
if (m.matches(".*(comment).*(filtrer?|trier?).*(urgence|priorité|risque).*"))               return GUIDE_FILTER_URGENCY;
if (m.matches(".*(comment).*(mettre? à jour|modifier?|changer?).*(statut).*"))              return GUIDE_UPDATE_STATUS;

if (m.matches(".*(comment).*(créer?|enregistrer?|faire?).*(rapatriment|rapatriement).*"))  return GUIDE_CREATE_TRANSFER;
if (m.matches(".*(comment).*(enregistrer?|créer?).*(transfert).*(sortant).*"))              return GUIDE_OUTGOING_TRANSFER;
if (m.matches(".*(comment).*(assigner?|affecter?).*(unité).*(entrant|transfert).*"))        return GUIDE_ASSIGN_INCOMING;
if (m.matches(".*(comment).*(réserver?).*(lit).*(transfert).*"))                            return GUIDE_RESERVE_TRANSFER;
if (m.matches(".*(comment).*(changer?|modifier?|mettre? à jour).*(statut).*(transfert).*")) return GUIDE_CHANGE_TRANSFER;
if (m.matches(".*(comment).*(annuler?).*(transfert).*"))                                    return GUIDE_CANCEL_TRANSFER;
if (m.matches(".*(comment).*(confirmer?).*(arrivée?).*"))                                   return GUIDE_CONFIRM_ARRIVAL;

if (m.matches(".*(comment).*(traiter?|gérer?|répondre?).*(alerte).*(critique).*"))          return GUIDE_HANDLE_ALERT;
if (m.matches(".*(comment).*(voir|afficher?|consulter?).*(alerte).*"))                      return GUIDE_VIEW_ALERTS;
if (m.matches(".*(comment).*(marquer?|résoudre?|fermer?).*(alerte).*"))                     return GUIDE_RESOLVE_ALERT;
if (m.matches(".*(comment).*(identifier?|trouver?|voir).*(urgent|critique).*"))             return GUIDE_IDENTIFY_URGENT;
if (m.matches(".*(comment).*(vérifier?|voir).*(saturation|risque|surcharge).*"))            return GUIDE_CHECK_SATURATION;

if (m.matches(".*(comment).*(lire?|comprendre?|interpréter?).*(tableau de bord|dashboard).*")) return GUIDE_READ_DASHBOARD;
if (m.matches(".*(comment).*(voir|consulter?|afficher?).*(statistique|stat).*(semaine).*"))    return GUIDE_WEEK_STATS;
if (m.matches(".*(comment).*(analyser?|voir).*(admission).*"))                              return GUIDE_ANALYZE_ADMISSIONS;
if (m.matches(".*(comment).*(identifier?).*(unité).*(difficulté|problème).*"))              return GUIDE_IDENTIFY_DIFFICULT;
if (m.matches(".*(comment).*(anticiper?|prévoir?).*(lit|lits).*(disponible).*"))            return GUIDE_ANTICIPATE_BEDS;

if (m.matches(".*(que faire|quoi faire|comment réagir?).*(patient).*(critique|urgent).*(attente|longtemps).*")) return GUIDE_CRITICAL_WAIT;
if (m.matches(".*(comment).*(gérer?|faire?).*(manque|pénurie|pas de).*(lit).*"))            return GUIDE_BED_SHORTAGE;
if (m.matches(".*(comment).*(prioriser?|gérer?).*(plusieurs|multiple).*(patient).*"))       return GUIDE_MULTI_PRIORITY;
if (m.matches(".*(quelle unité|quel service).*(choisir?|recommande?|suggère?).*(patient).*")) return GUIDE_CHOOSE_UNIT;
if (m.matches(".*(comment).*(optimiser?|améliorer?).*(occupation|lit|capacité).*"))         return GUIDE_OPTIMIZE;
```

---

## UserAssistanceService.java — TOUTES LES RÉPONSES GUIDÉES

```java
@Service
@RequiredArgsConstructor
public class UserAssistanceService {

    private final BedRepository bedRepository;
    private final StretcherRepository stretcherRepository;
    private final DecisionEngineService decisionEngine;

    // ════════════════════════════════════════════
    // 🛏️ GESTION DES LITS / PATIENTS
    // ════════════════════════════════════════════

    public GuideResponse guideAssignBed() {
        // Contexte dynamique : lits disponibles en ce moment
        int available = bedRepository.countAvailable();
        int waiting   = stretcherRepository.countWaiting();

        return GuideResponse.builder()
            .title("Assigner un lit à un patient")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "Accédez à la section **Civières** dans le menu de gauche",
                "Repérez le patient dans la liste des civières en attente",
                "Cliquez sur le bouton **Assigner un lit** à droite du patient",
                "Sélectionnez une **unité compatible** avec le diagnostic du patient",
                "Choisissez un lit dont le statut est **DISPONIBLE** ou **PRÊT** (vert)",
                "Cliquez sur **Confirmer l'attribution** — l'étage est notifié automatiquement"
            ))
            .tip(available > 5
                ? "💡 Il y a actuellement " + available + " lits disponibles — bonne disponibilité."
                : available > 0
                ? "⚠️ Seulement " + available + " lit(s) disponible(s) en ce moment. Priorisez les patients à risque élevé."
                : "🚨 Aucun lit disponible actuellement. Vérifiez les lits en nettoyage ou les congés prévus."
            )
            .relatedActions(List.of("Voir les lits disponibles", "Prioriser un patient critique"))
            .build();
    }

    public GuideResponse guideAdmitPatient() {
        return GuideResponse.builder()
            .title("Coucher un patient dans le système")
            .section("PATIENTS")
            .sectionRoute("/patients")
            .steps(List.of(
                "Accédez à la section **Patients** dans le menu",
                "Cliquez sur **+ Nouveau patient** en haut à droite",
                "Remplissez les informations : numéro MRD, nom, prénom, âge, sexe",
                "Saisissez le **diagnostic principal** et le **niveau de risque** (Élevé / Moyen / Faible)",
                "Sélectionnez l'**unité cible** recommandée selon le diagnostic",
                "Cliquez sur **Enregistrer** — le patient apparaît dans la liste d'attente",
                "Procédez ensuite à l'assignation d'un lit depuis la section **Civières**"
            ))
            .tip("💡 Le système suggère automatiquement une unité selon le diagnostic saisi.")
            .relatedActions(List.of("Assigner un lit", "Voir les unités disponibles"))
            .build();
    }

    public GuideResponse guideChangeBed() {
        return GuideResponse.builder()
            .title("Changer le lit d'un patient")
            .section("PATIENTS")
            .sectionRoute("/patients")
            .steps(List.of(
                "Accédez à la section **Patients** et trouvez le patient concerné",
                "Cliquez sur le patient pour ouvrir sa fiche",
                "Cliquez sur **Transférer / Changer de lit**",
                "Sélectionnez la nouvelle **unité** (peut être la même)",
                "Sélectionnez le **nouveau lit** (doit être DISPONIBLE ou PRÊT)",
                "Confirmez — l'ancien lit passe automatiquement en **NETTOYAGE**",
                "Les deux étages reçoivent une notification en temps réel"
            ))
            .tip("💡 Le changement de lit libère automatiquement l'ancien — pas besoin de le faire manuellement.")
            .relatedActions(List.of("Voir les lits disponibles", "Voir les lits en nettoyage"))
            .build();
    }

    public GuideResponse guideFreeBed() {
        return GuideResponse.builder()
            .title("Libérer un lit")
            .section("GESTION DES LITS")
            .sectionRoute("/lits")
            .steps(List.of(
                "Option 1 — Via la fiche patient : Ouvrez la fiche du patient → cliquez **Congédier le patient** → le lit passe en NETTOYAGE automatiquement",
                "Option 2 — Via la grille des lits : Accédez à **Gestion des lits** → cliquez sur le lit occupé → sélectionnez **Libérer ce lit**",
                "Après nettoyage, cliquez sur le lit → **Marquer comme PRÊT**",
                "Le lit est ensuite disponible pour une nouvelle admission"
            ))
            .tip("⚠️ Un lit ne peut pas être directement mis à DISPONIBLE depuis l'état OCCUPÉ — il doit passer par NETTOYAGE puis PRÊT.")
            .relatedActions(List.of("Voir les lits en nettoyage", "Assigner un lit"))
            .build();
    }

    public GuideResponse guideViewBeds() {
        List<UnitAvailability> units = bedRepository.getAllUnitAvailability();
        String contextMsg = units.stream()
            .map(u -> u.getUnit() + ": " + u.getAvailable() + "/" + u.getTotal() + " disponibles")
            .collect(Collectors.joining(" | "));

        return GuideResponse.builder()
            .title("Voir les lits disponibles par unité")
            .section("GESTION DES LITS")
            .sectionRoute("/lits")
            .steps(List.of(
                "Accédez à la section **Gestion des lits** dans le menu",
                "La **grille de lits** affiche tous les lits avec leur couleur d'état",
                "Utilisez les **onglets d'unité** (2N, 2S, 3N, 3S) pour naviguer entre les étages",
                "🟢 Vert = DISPONIBLE | 🔵 Bleu = OCCUPÉ | 🟡 Jaune = NETTOYAGE | 🟩 Vert foncé = PRÊT",
                "Survolez un lit pour voir les détails du patient ou son statut"
            ))
            .tip("📊 Situation actuelle : " + contextMsg)
            .relatedActions(List.of("Voir les unités proches de saturation", "Assigner un lit"))
            .build();
    }

    public GuideResponse guideReserveBed() {
        return GuideResponse.builder()
            .title("Réserver un lit à l'avance")
            .section("GESTION DES LITS")
            .sectionRoute("/lits")
            .steps(List.of(
                "Accédez à **Gestion des lits** et sélectionnez l'unité cible",
                "Cliquez sur un lit **DISPONIBLE** ou **PRÊT**",
                "Sélectionnez **Réserver ce lit**",
                "Indiquez l'heure prévue d'arrivée du patient",
                "Le lit passe en statut **RÉSERVÉ** — il n'est plus proposé aux autres assignations",
                "Vous pouvez aussi réserver depuis la section **Civières** → **Assigner un lit** → choisir une heure future"
            ))
            .tip("⚠️ Une réservation non confirmée après 60 minutes génère une alerte automatique.")
            .relatedActions(List.of("Annuler une réservation", "Confirmer l'arrivée d'un patient"))
            .build();
    }

    // ════════════════════════════════════════════
    // 🚑 PATIENTS EN ATTENTE
    // ════════════════════════════════════════════

    public GuideResponse guideAddWaiting() {
        return GuideResponse.builder()
            .title("Ajouter un patient en attente")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "Accédez à la section **Civières** dans le menu",
                "Cliquez sur **+ Ajouter une civière**",
                "Associez un patient existant (via numéro MRD) ou créez-en un nouveau",
                "Renseignez : diagnostic, niveau de risque, unité cible, numéro de civière",
                "Cliquez sur **Enregistrer** — le patient apparaît dans la file d'attente",
                "Le chronomètre d'attente démarre automatiquement"
            ))
            .tip("💡 Si le patient n'existe pas encore dans le système, créez-le d'abord dans la section **Patients**.")
            .relatedActions(List.of("Prioriser un patient critique", "Assigner un lit"))
            .build();
    }

    public GuideResponse guidePrioritize() {
        // Enrichissement dynamique
        int highRisk = stretcherRepository.countWaitingByRisk("ÉLEVÉ");

        return GuideResponse.builder()
            .title("Prioriser un patient critique")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "Accédez à la section **Civières**",
                "Cliquez sur le patient à prioriser pour ouvrir sa fiche",
                "Cliquez sur **Modifier** → changez le niveau de risque à **ÉLEVÉ**",
                "Le patient remonte automatiquement en tête de liste",
                "Une **alerte** est envoyée aux coordinateurs connectés",
                "Procédez immédiatement à l'assignation d'un lit (délai max : 30 min)"
            ))
            .tip(highRisk > 0
                ? "🚨 Il y a actuellement " + highRisk + " patient(s) à risque ÉLEVÉ en attente — vérifiez leur délai d'attente."
                : "✅ Aucun patient à risque élevé en attente pour l'instant."
            )
            .relatedActions(List.of("Assigner un lit", "Voir les alertes actives"))
            .build();
    }

    public GuideResponse guideViewWaiting() {
        int total   = stretcherRepository.countWaiting();
        int urgent  = stretcherRepository.countWaitingByRisk("ÉLEVÉ");
        double avg  = stretcherRepository.getAverageWaitMinutes();

        return GuideResponse.builder()
            .title("Voir les patients en attente")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "Accédez à la section **Civières** dans le menu",
                "La liste affiche tous les patients en attente d'un lit",
                "Chaque ligne montre : numéro MRD, diagnostic, risque, temps d'attente, unité cible",
                "Utilisez les **filtres** en haut pour trier par risque, unité ou temps d'attente",
                "Les patients à risque **ÉLEVÉ** apparaissent en rouge en haut de liste"
            ))
            .tip("📊 En ce moment : " + total + " patient(s) en attente"
                + (urgent > 0 ? " dont " + urgent + " à risque ÉLEVÉ 🚨" : "")
                + " | Attente moyenne : " + Math.round(avg) + " min")
            .relatedActions(List.of("Filtrer par urgence", "Prioriser un patient", "Assigner un lit"))
            .build();
    }

    // ════════════════════════════════════════════
    // 🔄 TRANSFERTS & RAPATRIEMENTS
    // ════════════════════════════════════════════

    public GuideResponse guideCreateTransfer() {
        return GuideResponse.builder()
            .title("Créer un rapatriement")
            .section("TRANSFERTS")
            .sectionRoute("/transferts")
            .steps(List.of(
                "Accédez à la section **Transferts** dans le menu",
                "Cliquez sur **+ Nouveau transfert** → sélectionnez **ENTRANT (Rapatriement)**",
                "Renseignez : hôpital d'origine, patient (MRD ou nouveau), diagnostic, risque",
                "Indiquez la **date et heure prévues** d'arrivée",
                "Sélectionnez ou réservez un **lit d'accueil** dans l'unité cible",
                "Cliquez sur **Créer le transfert** — le statut initial est EN_ATTENTE",
                "L'unité cible est notifiée automatiquement"
            ))
            .tip("💡 Pour un rapatriement urgent, cochez **Priorité élevée** — cela génère une alerte immédiate pour les coordinateurs.")
            .relatedActions(List.of("Réserver un lit pour un transfert", "Confirmer l'arrivée d'un patient"))
            .build();
    }

    public GuideResponse guideConfirmArrival() {
        return GuideResponse.builder()
            .title("Confirmer l'arrivée d'un patient")
            .section("TRANSFERTS")
            .sectionRoute("/transferts")
            .steps(List.of(
                "Accédez à la section **Transferts** et trouvez le transfert concerné",
                "Cliquez sur le transfert → **Confirmer l'arrivée**",
                "Vérifiez les informations du patient (diagnostic, risque, lit assigné)",
                "Cliquez sur **Valider l'arrivée** — le statut passe à ARRIVÉ",
                "Le lit passe automatiquement de RÉSERVÉ à **OCCUPÉ**",
                "La fiche patient est créée ou mise à jour dans la section **Patients**"
            ))
            .tip("💡 Si le patient arrive dans un lit différent de celui réservé, modifiez l'assignation avant de confirmer.")
            .relatedActions(List.of("Voir les transferts en attente", "Gérer la fiche patient"))
            .build();
    }

    // ════════════════════════════════════════════
    // ⚠️ ALERTES & PRIORITÉS
    // ════════════════════════════════════════════

    public GuideResponse guideHandleAlert() {
        return GuideResponse.builder()
            .title("Traiter une alerte critique")
            .section("TABLEAU DE BORD")
            .sectionRoute("/dashboard")
            .steps(List.of(
                "Les alertes critiques apparaissent en **rouge clignotant** dans la barre supérieure",
                "Cliquez sur l'alerte pour voir les détails",
                "Identifiez la cause : saturation d'unité, patient trop long en attente, réservation expirée",
                "Prenez l'action corrective selon le type d'alerte (assigner un lit, prioriser, etc.)",
                "Une fois résolue, cliquez sur **Marquer comme résolue** sur la fiche de l'alerte",
                "L'alerte disparaît du tableau de bord pour tous les utilisateurs connectés"
            ))
            .tip("⚠️ Les alertes CRITIQUES doivent être traitées dans les 15 minutes. Le système log automatiquement le temps de résolution.")
            .relatedActions(List.of("Voir toutes les alertes", "Assigner un lit d'urgence", "Prioriser un patient"))
            .build();
    }

    public GuideResponse guideCheckSaturation() {
        var saturation = decisionEngine.getSaturationRisks();

        return GuideResponse.builder()
            .title("Vérifier les risques de saturation")
            .section("TABLEAU DE BORD")
            .sectionRoute("/dashboard")
            .steps(List.of(
                "Accédez au **Tableau de bord** — les 5 KPIs du haut montrent l'état global",
                "Dans la section **Statut des unités**, les barres colorées indiquent le taux d'occupation",
                "🔴 Rouge ≥ 95% = CRITIQUE | 🟠 Orange ≥ 85% = ÉLEVÉE | 🟡 Jaune ≥ 70% = MODÉRÉE",
                "Cliquez sur une unité pour voir ses lits en détail",
                "Utilisez le chatbot : tapez **\"Y a-t-il un risque de saturation ?\"** pour une analyse instantanée",
                "Consultez les **prévisions 24h** pour anticiper les libérations de lits"
            ))
            .tip(saturation.getMessage())
            .relatedActions(List.of("Voir les prévisions 24h", "Anticiper les lits disponibles", "Identifier les unités en difficulté"))
            .build();
    }

    // ════════════════════════════════════════════
    // 📊 DASHBOARD
    // ════════════════════════════════════════════

    public GuideResponse guideReadDashboard() {
        return GuideResponse.builder()
            .title("Lire le tableau de bord")
            .section("TABLEAU DE BORD")
            .sectionRoute("/dashboard")
            .steps(List.of(
                "**Zone 1 — KPIs (ligne du haut)** : 5 chiffres clés en temps réel : patients totaux, lits disponibles, lits occupés, civières en attente, patients à risque élevé",
                "**Zone 2 — Alertes actives** : Bannières rouges/oranges si situation critique détectée",
                "**Zone 3 — Statut des unités** : Barres de progression par unité (2N, 2S, 3N, 3S) avec taux d'occupation",
                "**Zone 4 — File d'attente** : Les 5 prochains patients à assigner, triés par priorité",
                "**Zone 5 — Activité récente** : Dernières actions (attributions, congés, transferts)",
                "Toutes les données se **rafraîchissent en temps réel** via WebSocket — pas besoin de recharger"
            ))
            .tip("💡 En cas d'alerte rouge clignotante dans la barre du haut, traitez-la en priorité avant d'analyser les autres métriques.")
            .relatedActions(List.of("Voir les alertes actives", "Analyser les admissions", "Anticiper les lits disponibles"))
            .build();
    }

    // ════════════════════════════════════════════
    // 👨‍⚕️ COORDINATION MÉTIER
    // ════════════════════════════════════════════

    public GuideResponse guideCriticalWait() {
        int highRisk  = stretcherRepository.countWaitingByRisk("ÉLEVÉ");
        int available = bedRepository.countAvailable();

        return GuideResponse.builder()
            .title("Que faire si un patient critique attend trop longtemps ?")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "**Étape 1 — Évaluer immédiatement** : Vérifiez le temps d'attente exact et le diagnostic",
                "**Étape 2 — Chercher un lit dans l'unité cible** : Gestion des lits → unité concernée → chercher DISPONIBLE ou PRÊT",
                "**Étape 3 — Si aucun lit disponible dans l'unité cible** : Vérifiez les lits en NETTOYAGE (délai de libération) ou l'unité alternative la plus proche",
                "**Étape 4 — Accélérer le nettoyage** : Contactez l'équipe d'entretien pour prioriser les lits en NETTOYAGE",
                "**Étape 5 — En dernier recours** : Évaluez un transfert temporaire vers une unité moins spécialisée",
                "**Étape 6 — Documenter** : Marquez l'alerte comme traitée avec une note sur l'action prise"
            ))
            .tip(available > 0
                ? "⚡ Il y a " + available + " lit(s) disponible(s) en ce moment — agissez maintenant."
                : "🚨 Aucun lit disponible. Vérifiez les lits en NETTOYAGE ou contactez votre supérieur immédiat."
            )
            .relatedActions(List.of("Voir les lits en nettoyage", "Chercher une unité alternative", "Contacter l'étage"))
            .build();
    }

    public GuideResponse guideBedShortage() {
        return GuideResponse.builder()
            .title("Comment gérer un manque de lits ?")
            .section("TABLEAU DE BORD")
            .sectionRoute("/dashboard")
            .steps(List.of(
                "**1. Identifier les lits récupérables rapidement** : Lits en NETTOYAGE → accélérer la mise en PRÊT",
                "**2. Identifier les congés imminents** : Chatbot → \"Combien de lits libérés dans les prochaines 24h ?\"",
                "**3. Réviser les assignations réservées expirées** : Lits RÉSERVÉS depuis plus de 60 min sans arrivée → libérer",
                "**4. Redistribuer vers les unités moins chargées** : Demandez au chatbot \"Quelle unité peut encore accepter des patients ?\"",
                "**5. Activer le protocole de débordement** : Selon les procédures internes — contactez le médecin responsable",
                "**6. Prioriser les congés** : Identifiez les patients pouvant être congédiés — coordonnez avec l'équipe médicale"
            ))
            .tip("💡 Tapez **\"Optimise l'attribution des lits actuels\"** dans ce chatbot pour obtenir une recommandation automatique basée sur les données en temps réel.")
            .relatedActions(List.of("Optimiser l'attribution des lits", "Voir les prévisions 24h", "Identifier les unités en difficulté"))
            .build();
    }

    public GuideResponse guideMultiPriority() {
        return GuideResponse.builder()
            .title("Comment prioriser plusieurs patients en même temps ?")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "**Étape 1** : Demandez au chatbot **\"Quel patient doit être priorisé maintenant ?\"** — il calcule un score automatique",
                "**Étape 2** : Triez la liste des civières par **score de priorité** (bouton tri en haut de la liste)",
                "**Étape 3** : Traitez d'abord les patients **ÉLEVÉ** qui dépassent 30 min d'attente",
                "**Étape 4** : Ensuite les patients **ÉLEVÉ** dans les délais",
                "**Étape 5** : Puis les patients **MOYEN** par ordre d'arrivée",
                "**Étape 6** : Documenter l'ordre de traitement si demandé par l'administration"
            ))
            .tip("🧠 Le score de priorité = niveau de risque + temps d'attente. Un patient MOYEN qui attend 3h peut dépasser un patient ÉLEVÉ récent.")
            .relatedActions(List.of("Voir les patients urgents", "Optimiser l'attribution des lits"))
            .build();
    }

    public GuideResponse guideChooseUnit() {
        return GuideResponse.builder()
            .title("Quelle unité choisir pour un patient ?")
            .section("CIVIÈRES")
            .sectionRoute("/civieres")
            .steps(List.of(
                "**Règle 1 — Diagnostic d'abord** : Cardiologie → 2N | Soins intensifs → 2S | Néphrologie → 3N | Médecine générale → 3S",
                "**Règle 2 — Disponibilité** : Si l'unité recommandée est saturée (> 90%), cherchez l'alternative la plus proche",
                "**Règle 3 — Risque** : Patient ÉLEVÉ → priorité aux unités spécialisées même si distance plus grande",
                "**Méthode rapide** : Tapez dans le chatbot **\"Dans quelle unité envoyer un patient avec [diagnostic] ?\"**",
                "Le système calcule automatiquement la meilleure unité selon disponibilité + spécialité"
            ))
            .tip("💡 Guide rapide : Cardiaque → 2N | Critique/choc → 2S | Rénal/AKI → 3N | Général → 3S")
            .relatedActions(List.of("Voir la disponibilité par unité", "Voir les unités qui peuvent accepter des cas critiques"))
            .build();
    }

    public GuideResponse guideOptimize() {
        return GuideResponse.builder()
            .title("Comment optimiser l'occupation des lits ?")
            .section("TABLEAU DE BORD")
            .sectionRoute("/dashboard")
            .steps(List.of(
                "**Analyse rapide** : Demandez au chatbot **\"Optimise l'attribution des lits actuels\"**",
                "**Réduire les lits bloqués** : Traitez les lits en NETTOYAGE rapidement (objectif : < 30 min)",
                "**Réduire les réservations expirées** : Libérez les lits RÉSERVÉS sans arrivée depuis > 60 min",
                "**Équilibrer les unités** : Redirigez les admissions vers les unités sous-chargées (< 70% occupation)",
                "**Anticiper les congés** : Planifiez les nouvelles admissions sur les lits qui vont se libérer",
                "**Revue quotidienne** : Consultez le rapport d'optimisation dans **Rapports → Occupation**"
            ))
            .tip("🎯 Objectif optimal : maintenir chaque unité entre 75% et 85% d'occupation — assez haut pour être efficient, assez bas pour absorber les urgences.")
            .relatedActions(List.of("Voir les statistiques d'occupation", "Simuler l'impact de nouvelles admissions", "Voir les prévisions 24h"))
            .build();
    }
}
```

---

## GuideResponse.java — DTO

```java
@Data
@Builder
public class GuideResponse {

    private String title;              // Titre de la procédure
    private String section;            // Nom de la section de l'app concernée
    private String sectionRoute;       // Route React (ex: "/civieres")
    private List<String> steps;        // Étapes numérotées (markdown supporté)
    private String tip;                // Conseil contextuel dynamique
    private List<String> relatedActions; // Questions connexes suggérées (cliquables)
}
```

---

## FRONTEND — GuideCard.jsx

```jsx
const GuideCard = ({ guide, onRelatedClick }) => (
  <div style={{ marginTop: '8px' }}>

    {/* Header */}
    <div style={{
      background: '#e8f4fd', borderRadius: '8px 8px 0 0',
      padding: '10px 14px', borderBottom: '1px solid #bfdbfe'
    }}>
      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>
        📋 {guide.title}
      </span>
      <button onClick={() => navigateTo(guide.sectionRoute)} style={{
        float: 'right', fontSize: '11px', background: '#1d6fa4',
        color: '#fff', border: 'none', borderRadius: '4px',
        padding: '2px 8px', cursor: 'pointer'
      }}>
        Aller → {guide.section}
      </button>
    </div>

    {/* Steps */}
    <div style={{
      background: '#f8fafc', padding: '12px 14px',
      borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0'
    }}>
      {guide.steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
          <span style={{
            minWidth: '22px', height: '22px', background: '#1d6fa4',
            color: '#fff', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, flexShrink: 0
          }}>{i + 1}</span>
          <span style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(step) }} />
        </div>
      ))}
    </div>

    {/* Tip */}
    {guide.tip && (
      <div style={{
        background: '#fffbeb', padding: '8px 14px',
        borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
        fontSize: '12px', color: '#92400e'
      }}>
        {guide.tip}
      </div>
    )}

    {/* Related actions */}
    {guide.relatedActions?.length > 0 && (
      <div style={{
        background: '#f1f5f9', padding: '8px 14px',
        borderRadius: '0 0 8px 8px', border: '1px solid #e2e8f0',
        borderTop: 'none'
      }}>
        <span style={{ fontSize: '11px', color: '#64748b', marginRight: '6px' }}>
          Actions liées :
        </span>
        {guide.relatedActions.map((action, i) => (
          <button key={i} onClick={() => onRelatedClick(action)} style={{
            fontSize: '11px', background: '#fff', color: '#1d6fa4',
            border: '1px solid #bfdbfe', borderRadius: '4px',
            padding: '2px 8px', margin: '2px', cursor: 'pointer'
          }}>
            {action}
          </button>
        ))}
      </div>
    )}
  </div>
);
```

---

## MISE À JOUR DU MasterChatbotService.java

Ajouter dans le switch :

```java
// ── Catégorie 10 : Guide utilisateur ──
case GUIDE_ASSIGN_BED         -> formatter.formatGuide(assistanceService.guideAssignBed());
case GUIDE_ADMIT_PATIENT      -> formatter.formatGuide(assistanceService.guideAdmitPatient());
case GUIDE_CHANGE_BED         -> formatter.formatGuide(assistanceService.guideChangeBed());
case GUIDE_FREE_BED           -> formatter.formatGuide(assistanceService.guideFreeBed());
case GUIDE_MARK_OCCUPIED      -> formatter.formatGuide(assistanceService.guideMarkOccupied());
case GUIDE_VIEW_BEDS          -> formatter.formatGuide(assistanceService.guideViewBeds());
case GUIDE_RESERVE_BED        -> formatter.formatGuide(assistanceService.guideReserveBed());
case GUIDE_CANCEL_RESERVATION -> formatter.formatGuide(assistanceService.guideCancelReservation());
case GUIDE_ADD_WAITING        -> formatter.formatGuide(assistanceService.guideAddWaiting());
case GUIDE_PRIORITIZE         -> formatter.formatGuide(assistanceService.guidePrioritize());
case GUIDE_ASSIGN_UNIT        -> formatter.formatGuide(assistanceService.guideAssignUnit());
case GUIDE_VIEW_WAITING       -> formatter.formatGuide(assistanceService.guideViewWaiting());
case GUIDE_FILTER_URGENCY     -> formatter.formatGuide(assistanceService.guideFilterUrgency());
case GUIDE_UPDATE_STATUS      -> formatter.formatGuide(assistanceService.guideUpdateStatus());
case GUIDE_CREATE_TRANSFER    -> formatter.formatGuide(assistanceService.guideCreateTransfer());
case GUIDE_OUTGOING_TRANSFER  -> formatter.formatGuide(assistanceService.guideOutgoingTransfer());
case GUIDE_ASSIGN_INCOMING    -> formatter.formatGuide(assistanceService.guideAssignIncoming());
case GUIDE_RESERVE_TRANSFER   -> formatter.formatGuide(assistanceService.guideReserveTransfer());
case GUIDE_CHANGE_TRANSFER    -> formatter.formatGuide(assistanceService.guideChangeTransfer());
case GUIDE_CANCEL_TRANSFER    -> formatter.formatGuide(assistanceService.guideCancelTransfer());
case GUIDE_CONFIRM_ARRIVAL    -> formatter.formatGuide(assistanceService.guideConfirmArrival());
case GUIDE_HANDLE_ALERT       -> formatter.formatGuide(assistanceService.guideHandleAlert());
case GUIDE_VIEW_ALERTS        -> formatter.formatGuide(assistanceService.guideViewAlerts());
case GUIDE_RESOLVE_ALERT      -> formatter.formatGuide(assistanceService.guideResolveAlert());
case GUIDE_IDENTIFY_URGENT    -> formatter.formatGuide(assistanceService.guideIdentifyUrgent());
case GUIDE_CHECK_SATURATION   -> formatter.formatGuide(assistanceService.guideCheckSaturation());
case GUIDE_READ_DASHBOARD     -> formatter.formatGuide(assistanceService.guideReadDashboard());
case GUIDE_WEEK_STATS         -> formatter.formatGuide(assistanceService.guideWeekStats());
case GUIDE_ANALYZE_ADMISSIONS -> formatter.formatGuide(assistanceService.guideAnalyzeAdmissions());
case GUIDE_IDENTIFY_DIFFICULT -> formatter.formatGuide(assistanceService.guideIdentifyDifficult());
case GUIDE_ANTICIPATE_BEDS    -> formatter.formatGuide(assistanceService.guideAnticipateBeds());
case GUIDE_CRITICAL_WAIT      -> formatter.formatGuide(assistanceService.guideCriticalWait());
case GUIDE_BED_SHORTAGE       -> formatter.formatGuide(assistanceService.guideBedShortage());
case GUIDE_MULTI_PRIORITY     -> formatter.formatGuide(assistanceService.guideMultiPriority());
case GUIDE_CHOOSE_UNIT        -> formatter.formatGuide(assistanceService.guideChooseUnit());
case GUIDE_OPTIMIZE           -> formatter.formatGuide(assistanceService.guideOptimize());
```

---

## CE QU'IL FAUT GÉNÉRER (Module 4)

1. Tous les enums GUIDE_* dans `ChatbotIntent.java`
2. Tous les patterns regex dans `IntentRouter.java`
3. `GuideResponse.java` (DTO complet)
4. `UserAssistanceService.java` (toutes les méthodes — complètes, pas de placeholder)
5. `ResponseFormatterService.formatGuide()` (convertit GuideResponse → ChatbotResponseDto)
6. `GuideCard.jsx` (composant React complet)
7. Mise à jour `ChatbotWidget.jsx` pour rendre le type `GUIDE`
8. Mise à jour `MasterChatbotService.java` avec tous les cases GUIDE_*

---

## RÈGLES IMPORTANTES

- Chaque réponse GUIDE doit inclure un **conseil dynamique** basé sur les données réelles du système (pas statique)
- Le bouton **"Aller → [SECTION]"** dans la GuideCard navigue directement vers la section concernée dans React
- Les **"Actions liées"** sont cliquables et envoient la question directement au chatbot (comme sendPrompt)
- Le texte dans `steps` supporte le **markdown gras** (`**texte**`) — converti en HTML dans le composant
- Toutes les méthodes sont `@Transactional(readOnly = true)` — elles lisent seulement, n'écrivent jamais
- Les guides sont **contextuels** : si aucun lit disponible, le tip le dit clairement plutôt qu'un message générique
