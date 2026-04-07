package com.hoscor.service;

import com.hoscor.domain.enums.ChatbotIntent;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

import static com.hoscor.domain.enums.ChatbotIntent.*;

@Component
public class IntentRouter {

    public ChatbotIntent detectIntent(String message) {
        String m = message.toLowerCase().trim();

        // ============================================================
        // 1. ACTIONS (user explicitly wants to mutate data)
        // ============================================================
        if (matches(m, "(assigner|attribuer|affecter).*(lit|bed).*(patient|mrd|civ)")) return ACTION_ASSIGN_BED;
        if (matches(m, "(assigner|attribuer|affecter).*(patient|mrd|civ).*(lit|bed)")) return ACTION_ASSIGN_BED;
        if (matches(m, "(réserver|reserver|reserve).*(lit|bed)")) return ACTION_RESERVE_BED;
        if (matches(m, "(créer|creer|nouveau|enregistrer|ajouter).*(transfert|rapatr|transfer)")) return ACTION_CREATE_TRANSFER;
        if (matches(m, "(marquer|mark|mettre|passer).*(critique|urgent|priorité élevée|prioritaire)")) return ACTION_MARK_CRITICAL;
        if (matches(m, "(mettre à jour|modifier|changer|update).*(statut|status|état).*(transfert|rapatr)")) return ACTION_UPDATE_TRANSFER;

        // ============================================================
        // 2. ERROR / TROUBLESHOOTING  (before guides — "problème" must not fall to OPS)
        // ============================================================

        // Login errors
        if (matches(m, "(connexion|login|connecter|mot de passe|password|identifiant).*(erreur|problème|impossible|refusé|incorrect|ne fonctionne|ne marche)")) return ERROR_LOGIN;
        if (matches(m, "(ne (peux|peut|pouvais|pouvait) pas|impossible).*(connecter|login|accéder|ouvrir session)")) return ERROR_LOGIN;
        if (matches(m, "(erreur|problème).*(connexion|login)")) return ERROR_LOGIN;

        // Bed assignment errors
        if (matches(m, "(ne (peux|peut|pouvais) pas|impossible|pourquoi).*(assigner|attribuer|affecter).*(lit|bed)")) return ERROR_ASSIGN_BED;
        if (matches(m, "(lit|bed).*(ne (peut|peux) pas|impossible|erreur|ne fonctionne|ne marche).*(assigner|attribuer|affecter)")) return ERROR_ASSIGN_BED;
        if (matches(m, "(bouton|button).*(assigner|attribuer|affecter|lit).*(ne fonctionne|ne marche|ne répond|grisé|inactif)")) return ERROR_ASSIGN_BED;
        if (matches(m, "(bouton|button).*(ne fonctionne|ne marche|ne répond|grisé|inactif).*(assigner|attribuer|lit)")) return ERROR_ASSIGN_BED;

        // Transfer errors
        if (matches(m, "(ne (peux|peut) pas|impossible|pourquoi).*(créer|modifier|enregistrer).*(transfert|rapatr)")) return ERROR_TRANSFER;
        if (matches(m, "(bouton|button).*(transfert|rapatr).*(ne fonctionne|ne marche|ne répond|grisé)")) return ERROR_TRANSFER;
        if (matches(m, "(transfert).*(erreur|ne fonctionne|ne marche|impossible|bloqué)")) return ERROR_TRANSFER;

        // Generic button / system errors
        if (matches(m, "bouton.*(ne fonctionne|ne marche|ne répond|grisé|inactif)")) return ERROR_GENERAL;
        if (matches(m, "(ne fonctionne pas|ne marche pas|ne répond pas).*(bouton|page|application|système|écran)")) return ERROR_GENERAL;
        if (matches(m, "(rien ne se passe|page blanche|écran blanc|application (bloquée|gelée|figée)|système bloqué)")) return ERROR_GENERAL;
        if (matches(m, "erreur (inattendue|500|404|403|401|réseau)")) return ERROR_GENERAL;
        if (matches(m, "pourquoi (ça|ca|le système|l.application) ne (fonctionne|marche) pas")) return ERROR_GENERAL;

        // ============================================================
        // 3. ONBOARDING / NAVIGATION  (user is lost or just starting)
        // ============================================================
        if (matches(m, "(comment utiliser|par où commencer|comment ça marche|tutoriel|guide d.utilisation|aide moi|aidez.moi|help me|how to use|premiers pas|first time|je suis (nouveau|débutant))")) return ONBOARDING_HELP;
        if (matches(m, "^(aide|help|bonjour|bonsoir|salut|allô|allo)$")) return ONBOARDING_HELP;
        if (matches(m, "(que (puis.je|peux.je|peut.on) faire|quelles? (fonctions?|fonctionnalités?|options?)|qu.est.ce que (je peux|tu peux|on peut|ce système|ce chatbot|cet outil))")) return ONBOARDING_HELP;
        if (matches(m, "(comment naviguer|où (trouver|se trouve|est) la (section|page|menu)|comment (accéder|aller) (à|au|aux))")) return ONBOARDING_NAVIGATE;
        if (matches(m, "(menu|navigation).*(comment|où|expliquer|montrer)")) return ONBOARDING_NAVIGATE;

        // ============================================================
        // 4. MORNING COORDINATION
        // ============================================================
        if (matches(m, "(station matinale|briefing (matin|du matin|journalier)|réunion (du matin|matinale|de quart)|rapport (du matin|matin|début)|début de (quart|journée|shift)|revue matinale|bilan du matin)")) return MORNING_BRIEFING;

        // ============================================================
        // 5. GUIDE — Beds
        // ============================================================
        if (matches(m, "(comment|étapes|procédure|expliquer).*(assigner|attribuer|affecter).*(lit|bed)")) return GUIDE_ASSIGN_BED;
        if (matches(m, "(comment|étapes|procédure).*(admettre|admission|hospitaliser).*(patient)")) return GUIDE_ADMIT_PATIENT;
        if (matches(m, "(comment|étapes).*(changer|déplacer).*(lit|chambre)")) return GUIDE_CHANGE_BED;
        if (matches(m, "(comment|étapes).*(libérer|vider|liberer).*(lit|chambre)")) return GUIDE_FREE_BED;
        if (matches(m, "(comment|étapes).*(marquer|passer).*(lit).*(occupé|occupe)")) return GUIDE_MARK_OCCUPIED;
        if (matches(m, "(comment|étapes).*(voir|consulter|afficher|visualiser).*(lit|lits|beds)")) return GUIDE_VIEW_BEDS;
        if (matches(m, "(comment|étapes).*(réserver|reserver).*(lit|bed)")) return GUIDE_RESERVE_BED;
        if (matches(m, "(comment|étapes).*(annuler|supprimer).*(réservation|reservation)")) return GUIDE_CANCEL_RESERVATION;

        // ============================================================
        // 6. GUIDE — Waiting / Stretchers
        // ============================================================
        if (matches(m, "(comment|étapes).*(ajouter|enregistrer|inscrire).*(patient|civi[eè]re).*(attente|liste)")) return GUIDE_ADD_WAITING;
        if (matches(m, "(comment|étapes).*(prioriser|priorité|trier).*(patient|civi[eè]re)")) return GUIDE_PRIORITIZE;
        if (matches(m, "(comment|étapes).*(assigner|affecter|attribuer).*(unité|service|unit).*(patient|civi[eè]re)")) return GUIDE_ASSIGN_UNIT;
        if (matches(m, "(comment|étapes).*(voir|consulter|afficher).*(patient|civi[eè]re).*(attente|liste)")) return GUIDE_VIEW_WAITING;
        if (matches(m, "(comment|étapes).*(filtrer|trier|classer).*(urgence|risque|priorité)")) return GUIDE_FILTER_URGENCY;
        if (matches(m, "(comment|étapes).*(mettre à jour|modifier|changer).*(statut|status).*(patient|civi[eè]re)")) return GUIDE_UPDATE_STATUS;

        // ============================================================
        // 7. GUIDE — Transfers
        // ============================================================
        if (matches(m, "(comment|étapes).*(créer|enregistrer|ajouter).*(transfert|rapatr)")) return GUIDE_CREATE_TRANSFER;
        if (matches(m, "(comment|étapes).*(transfert sortant|transférer vers|envoyer patient)")) return GUIDE_OUTGOING_TRANSFER;
        if (matches(m, "(comment|étapes).*(assigner|accueillir|recevoir).*(transfert entrant|patient entrant)")) return GUIDE_ASSIGN_INCOMING;
        if (matches(m, "(comment|étapes).*(réserver|planifier).*(transfert)")) return GUIDE_RESERVE_TRANSFER;
        if (matches(m, "(comment|étapes).*(modifier|changer|mettre à jour).*(transfert)")) return GUIDE_CHANGE_TRANSFER;
        if (matches(m, "(comment|étapes).*(annuler|supprimer).*(transfert)")) return GUIDE_CANCEL_TRANSFER;
        if (matches(m, "(comment|étapes).*(confirmer|valider).*(arrivée|arrival).*(transfert|patient)")) return GUIDE_CONFIRM_ARRIVAL;

        // ============================================================
        // 8. GUIDE — Alerts
        // ============================================================
        if (matches(m, "(comment|étapes).*(gérer|traiter|répondre).*(alerte)")) return GUIDE_HANDLE_ALERT;
        if (matches(m, "(comment|étapes).*(voir|consulter|afficher).*(alerte)")) return GUIDE_VIEW_ALERTS;
        if (matches(m, "(comment|étapes).*(résoudre|fermer|acquitter).*(alerte)")) return GUIDE_RESOLVE_ALERT;
        if (matches(m, "(comment|étapes).*(identifier|repérer|trouver).*(patient urgent|prioritaire)")) return GUIDE_IDENTIFY_URGENT;
        if (matches(m, "(comment|étapes).*(vérifier|contrôler|surveiller).*(saturation|taux d.occup)")) return GUIDE_CHECK_SATURATION;

        // ============================================================
        // 9. GUIDE — Stats / Dashboard
        // ============================================================
        if (matches(m, "(comment|étapes).*(lire|interpréter|comprendre).*(tableau de bord|dashboard)")) return GUIDE_READ_DASHBOARD;
        if (matches(m, "(comment|étapes).*(voir|consulter).*(statistiques|stats).*(semaine|hebdo)")) return GUIDE_WEEK_STATS;
        if (matches(m, "(comment|étapes).*(analyser|étudier).*(admission|entrée|hospitali)")) return GUIDE_ANALYZE_ADMISSIONS;
        if (matches(m, "(comment|étapes).*(identifier|trouver|repérer).*(cas difficile|patient difficile|patient complexe)")) return GUIDE_IDENTIFY_DIFFICULT;
        if (matches(m, "(comment|étapes).*(anticiper|prévoir|planifier).*(lit|congé|sortie)")) return GUIDE_ANTICIPATE_BEDS;

        // ============================================================
        // 10. GUIDE — Advanced Scenarios
        // ============================================================
        if (matches(m, "(comment|que faire).*(patient critique|urgence critique).*(attente|attend)")) return GUIDE_CRITICAL_WAIT;
        if (matches(m, "(comment|que faire).*(manque de lit|pénurie de lit|plus de lit|pas de lit)")) return GUIDE_BED_SHORTAGE;
        if (matches(m, "(comment|étapes).*(gérer|prioriser|trier).*(plusieurs|multiple).*(urgent|priorité)")) return GUIDE_MULTI_PRIORITY;
        if (matches(m, "(comment|étapes).*(choisir|sélectionner|décider).*(unité|service).*(patient)")) return GUIDE_CHOOSE_UNIT;
        if (matches(m, "(comment|étapes).*(optimiser|améliorer|maximiser).*(gestion|occupation|capacité)")) return GUIDE_OPTIMIZE;

        // ============================================================
        // 11. GUIDE — Patient Lifecycle
        // ============================================================
        if (matches(m, "(comment|étapes).*(congédier|congé|décharger|discharge|sortie du patient|renvoyer).*(patient)?")) return PATIENT_DISCHARGE;
        if (matches(m, "(comment|étapes).*(créer|ajouter|enregistrer|saisir|ouvrir).*(dossier|fiche|record).*(patient)?")) return PATIENT_CREATE;
        if (matches(m, "(comment|étapes).*(créer|ajouter|enregistrer|saisir).*(nouveau patient|patient)")) return PATIENT_CREATE;

        // ============================================================
        // 12. GUIDE — Hygiene
        // ============================================================
        if (matches(m, "(comment|étapes|protocole|procédure).*(nettoyage|hygiène|ménage|propre)")) return HYGIENE_ROTATION;
        if (matches(m, "(cycle|rotation|planning|fréquence|délai).*(nettoyage|hygiène|ménage)")) return HYGIENE_ROTATION;

        // ============================================================
        // 13. DIAGNOSIS → UNIT LOOKUP
        // ============================================================
        if (matches(m, "(cardio|infarctus|insuffisance cardiaque|angine|avc|coronar)")) return DIAGNOSIS_LOOKUP;
        if (matches(m, "(néphro|insuffisance rénale|dialyse|néphropathie)")) return DIAGNOSIS_LOOKUP;
        if (matches(m, "(soins intensifs|icu|réanimation|patient instable|ventilé|intubé)")) return DIAGNOSIS_LOOKUP;
        if (matches(m, "(post.op|post opératoire|appendic|orthopédie|prothèse|fracture)")) return DIAGNOSIS_LOOKUP;
        if (matches(m, "(diagnostic|pathologie|maladie).*(quelle unité|quel service|où placer|où envoyer|recommand)")) return DIAGNOSIS_LOOKUP;
        if (matches(m, "(quelle unité|quel service).*(diagnostic|pathologie|cardio|néphro|chir|médecine générale)")) return DIAGNOSIS_LOOKUP;

        // ============================================================
        // 14. BED INTELLIGENCE
        // ============================================================
        if (matches(m, "(combien|nombre|total).*(lit|lits).*(disponible|libre|vide|vacant)")) return BED_COUNT;
        if (matches(m, "(lit|lits).*(disponible|libre|vide|vacant)")) return BED_COUNT;
        if (matches(m, "(saturation|taux d.occup|capacité|plein|rempli|débordement|surcharg)")) return BED_SATURATION;
        if (matches(m, "(lit|lits).*(réservé|reserve|réservation).*(vide|inoccupé|personne|non occupé)")) return BED_RESERVED;
        if (matches(m, "(réservation|réservé|reserve).*(inutile|inoccupé|vide|perdu|bloqué)")) return BED_RESERVED;
        if (matches(m, "(nettoyage|cleaning|ménage|salubrit|propre).*(lit|lits|chambre)")) return BED_CLEANING;
        if (matches(m, "(lit|lits).*(nettoyage|cleaning|ménage|propre|prêt)")) return BED_CLEANING;
        if (matches(m, "(marquer|mark|mettre|passer|signaler).*(lit|lits).*(propre|nettoyé|disponible|prêt)")) return BED_CLEANING;
        if (matches(m, "(prévision|prévoir|forecast|anticiper).*(lit|congé|sortie|disponib)")) return BED_FORECAST;
        if (matches(m, "(congé|sortie).*(prévu|attendu|planifié|24h|demain)")) return BED_FORECAST;

        // ============================================================
        // 15. HYGIENE STATUS (data query, not guide)
        // ============================================================
        if (matches(m, "(combien|état|liste|voir|statut|situation).*(nettoyage|ménage|hygiène|propre)")) return HYGIENE_STATUS;
        if (matches(m, "(nettoyage|ménage|hygiène).*(en cours|actuel|maintenant|aujourd.hui|unité|chambre)")) return HYGIENE_STATUS;

        // ============================================================
        // 16. WAITING PATIENTS (Stretchers)
        // ============================================================
        if (matches(m, "(combien|nombre|total).*(patient|civi[eè]re|civière).*(attente|attend|liste)")) return WAITING_COUNT;
        if (matches(m, "(liste|tous|afficher|voir).*(patient|civi[eè]re).*(attente|attend)")) return WAITING_COUNT;
        if (matches(m, "(urgent|critique|prioritaire|plus urgent|plus critique|risque (élevé|élévé|eleve)).*(patient|civi[eè]re)")) return WAITING_URGENT;
        if (matches(m, "(patient|civi[eè]re).*(urgent|critique|risque (élevé|élévé|eleve)|élevé|élévé|eleve)")) return WAITING_URGENT;
        if (matches(m, "(patient|civi[eè]re).*(par|selon|diagnostic|maladie|pathologie|groupé)")) return WAITING_BY_DIAG;
        if (matches(m, "(priorité|prioritaire|premier|qui.*en.*premier|qui.*prioris)")) return WAITING_PRIORITY;
        if (matches(m, "(quel patient|qui).*(prioriser|traiter|admettre|placer).*(premier|avant|urgence)")) return WAITING_PRIORITY;

        // ============================================================
        // 17. UNIT MATCHING
        // ============================================================
        if (matches(m, "(quelle unité|quel service|où.*(placer|mettre|admettre|envoyer)).*(patient|mrd)")) return UNIT_MATCHING;
        if (matches(m, "(recommand|suggère|suggérer|proposer).*(unité|service|unit).*(patient|mrd|diagnostic|diagnos)")) return UNIT_MATCHING;
        if (matches(m, "(patient|mrd).*(correspondre|correspond|aller|devrait aller|quelle unité)")) return UNIT_MATCHING;
        if (matches(m, "(capacité|place disponible|disponibilité|libre).*(unité|service|unit)")) return UNIT_CAPACITY;

        // ============================================================
        // 18. TRANSFERS
        // ============================================================
        if (matches(m, "(statut|status|état|où en est).*(transfert|rapatr).*(mrd|patient|civi[eè]re)")) return TRANSFER_STATUS;
        if (matches(m, "(mrd|patient).*(transfert|rapatr).*(statut|status|état|où en est)")) return TRANSFER_STATUS;
        if (matches(m, "(liste|tous|afficher|voir).*(transfert|rapatr|transfer)")) return TRANSFER_LIST;
        if (matches(m, "(transfert|rapatr|transfer).*(aujourd.hui|planifié|prévu|en cours|en attente)")) return TRANSFER_LIST;
        if (matches(m, "(délai|retard|temps d.attente|heure|durée).*(transfert|rapatr)")) return TRANSFER_DELAYS;

        // ============================================================
        // 19. ALERTS
        // ============================================================
        if (matches(m, "(alerte|alerte critique|urgence critique|situation critique)")) return ALERT_CRITICAL;
        if (matches(m, "(alerte|unité).*(saturation|surchargé|plein|débordement|capacité maximale)")) return ALERT_SATURATION;
        if (matches(m, "(attente trop longue|patient.*attend.*trop|dépassé.*délai|attente.*maximale|trop longtemps)")) return ALERT_WAIT_TOO_LONG;

        // ============================================================
        // 20. STATS
        // ============================================================
        if (matches(m, "(taux d.occup|occupation globale|pourcentage.*(occup|rempli))")) return STATS_OCCUPANCY;
        if (matches(m, "(admission|entrée|hospitali).*(stat|nombre|combien|semaine|mois|jour|historique)")) return STATS_ADMISSIONS;
        if (matches(m, "(durée de séjour|los|durée moyenne|temps moyen|séjour moyen)")) return STATS_LOS;
        if (matches(m, "(dama|départ contre|avis médical|contre avis)")) return STATS_DAMA;
        if (matches(m, "(tendance|trend|évolution|historique|progression)")) return STATS_TRENDS;

        // ============================================================
        // 21. FORECASTS
        // ============================================================
        if (matches(m, "(prévision|prévoir|forecast|estimer).*(aujourd.hui|ce soir|journée|dans les prochaines)")) return FORECAST_TODAY;
        if (matches(m, "(prévision|prévoir|forecast|estimer).*(demain|lendemain|24h à 48h)")) return FORECAST_TOMORROW;
        if (matches(m, "(risque|saturation|débordement).*(aujourd.hui|ce soir|prochaines heures|bientôt)")) return FORECAST_RISK;

        // ============================================================
        // 22. OPERATIONAL (narrow — removed generic "problème")
        // ============================================================
        if (matches(m, "(goulot|bottleneck|point de blocage|engorgé|unité (surchargée|bloquée|engorgée))")) return OPS_BOTTLENECK;
        if (matches(m, "(qu.est.ce qui (bloque|ralentit|freine|empêche)|source du blocage|cause du blocage)")) return OPS_BLOCKER;
        if (matches(m, "(qui.*intervenir|qui.*responsable|qui.*contacter|qui.*appeler|qui.*doit|qui.*peut)")) return OPS_WHO_INTERVENE;

        // ============================================================
        // 23. AI / ADVANCED
        // ============================================================
        if (matches(m, "(stratégie|plan d.action|recommandation globale|que faire globalement|vue d.ensemble|stratégique)")) return AI_STRATEGY;
        if (matches(m, "(détérioration|risque de détérioration|patient.*se détériore|dégradation|s.aggraver|aggravation)")) return AI_DETERIORATION;
        if (matches(m, "(optimis|meilleure.*assignation|répartition optimale|assignation optimale|améliorer l.assignation)")) return AI_OPTIMIZE;
        if (matches(m, "(simuler|simulation|si j.admet|si on admet|si on ajout|simulons|impact si)")) return AI_SIMULATE;
        if (matches(m, "(réorganis|redistribu|déplacer.*patient|réaménager|redistribution|réorganisation)")) return AI_REORGANIZE;

        // ============================================================
        // 24. PATIENT SEARCH
        // ============================================================
        if (matches(m, "(mrd[-\\s]\\d|mrd-2024|patient.*mrd|cherch.*patient|trouver.*patient|où est.*patient|quel lit.*(patient|mrd))")) return PATIENT_SEARCH;
        if (matches(m, "(où est|quel lit|quelle chambre).*(patient|monsieur|madame)")) return PATIENT_SEARCH;

        return UNKNOWN;
    }

    private boolean matches(String text, String pattern) {
        return Pattern.compile(pattern, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(text).find();
    }
}
