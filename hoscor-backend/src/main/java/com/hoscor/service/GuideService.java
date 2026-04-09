package com.hoscor.service;

import com.hoscor.domain.enums.ChatbotIntent;
import com.hoscor.dto.GuideResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuideService {

    public GuideResponse getGuide(ChatbotIntent intent) {
        return switch (intent) {
            case GUIDE_ASSIGN_BED -> GuideResponse.builder()
                    .title("Comment attribuer un lit à un patient")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .steps(List.of(
                            "Accédez à la section 'Gestion des Lits'",
                            "Sélectionnez une unité dans le menu latéral",
                            "Cliquez sur un lit disponible (vert)",
                            "Choisissez le patient sur civière à assigner",
                            "Confirmez l'attribution"
                    ))
                    .tip("Les lits verts sont disponibles, les jaunes sont en nettoyage.")
                    .relatedActions(List.of("Voir les patients en attente", "Marquer un lit propre"))
                    .build();

            case GUIDE_VIEW_BEDS -> GuideResponse.builder()
                    .title("Comment voir l'état des lits")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .steps(List.of(
                            "Cliquez sur 'Gestion des Lits' dans le menu",
                            "Sélectionnez l'unité souhaitée",
                            "Consultez le tableau de bord des lits par état"
                    ))
                    .tip("Le code couleur: vert=disponible, rouge=occupé, jaune=nettoyage, bleu=réservé.")
                    .relatedActions(List.of("Attribuer un lit", "Réserver un lit"))
                    .build();

            case GUIDE_RESERVE_BED -> GuideResponse.builder()
                    .title("Comment réserver un lit")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .steps(List.of(
                            "Allez dans 'Gestion des Lits'",
                            "Sélectionnez un lit disponible",
                            "Cliquez sur 'Réserver'",
                            "Indiquez la durée de réservation"
                    ))
                    .tip("Une réservation non utilisée après 60 min déclenche une alerte.")
                    .relatedActions(List.of("Attribuer un lit", "Annuler une réservation"))
                    .build();

            case GUIDE_CANCEL_RESERVATION -> GuideResponse.builder()
                    .title("Comment annuler une réservation")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .steps(List.of(
                            "Allez dans 'Gestion des Lits'",
                            "Trouvez le lit réservé (bleu)",
                            "Cliquez sur le lit puis sur 'Annuler la réservation'"
                    ))
                    .tip("Le lit repassera automatiquement à l'état disponible.")
                    .relatedActions(List.of("Réserver un lit", "Attribuer un lit"))
                    .build();

            case GUIDE_MARK_OCCUPIED -> GuideResponse.builder()
                    .title("Comment marquer un lit comme occupé")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .steps(List.of(
                            "Allez dans 'Gestion des Lits'",
                            "Cliquez sur le lit concerné",
                            "Changez l'état à 'Occupé'",
                            "Associez le patient si nécessaire"
                    ))
                    .tip("Utilisez l'attribution de lit pour associer automatiquement le patient.")
                    .relatedActions(List.of("Attribuer un lit", "Libérer un lit"))
                    .build();

            case GUIDE_FREE_BED -> GuideResponse.builder()
                    .title("Comment libérer un lit")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .steps(List.of(
                            "Congédiez d'abord le patient dans la section 'Patients admis'",
                            "Le lit passe automatiquement en 'Nettoyage'",
                            "Après nettoyage, changez l'état à 'Disponible'"
                    ))
                    .tip("Le congé du patient déclenche le processus de nettoyage du lit.")
                    .relatedActions(List.of("Congédier un patient", "Marquer lit propre"))
                    .build();

            case GUIDE_CHANGE_BED -> GuideResponse.builder()
                    .title("Comment changer un patient de lit")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Allez dans la section 'Coordonnateur'",
                            "Trouvez le patient à déplacer",
                            "Cliquez sur 'Changer de lit'",
                            "Sélectionnez le nouveau lit disponible",
                            "Confirmez le transfert intra-unité"
                    ))
                    .tip("Assurez-vous que le nouveau lit est bien disponible avant de procéder.")
                    .relatedActions(List.of("Libérer un lit", "Attribuer un lit"))
                    .build();

            case GUIDE_ADMIT_PATIENT -> GuideResponse.builder()
                    .title("Comment admettre un patient")
                    .section("Admissions")
                    .sectionRoute("/admissions")
                    .steps(List.of(
                            "Accédez à la section 'Admissions'",
                            "Cliquez sur 'Nouveau patient'",
                            "Remplissez les informations du patient (nom, MRD, diagnostic)",
                            "Sélectionnez l'unité d'accueil",
                            "Confirmez l'admission"
                    ))
                    .tip("Le numéro MRD doit être unique (format: MRD-AAAA-XXX).")
                    .relatedActions(List.of("Attribuer un lit", "Voir les lits disponibles"))
                    .build();

            case GUIDE_ADD_WAITING -> GuideResponse.builder()
                    .title("Comment ajouter un patient en attente")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Allez dans la section 'Coordonnateur'",
                            "Cliquez sur 'Ajouter une civière'",
                            "Sélectionnez le patient et son niveau de risque",
                            "Indiquez l'unité cible souhaitée",
                            "Confirmez l'ajout à la liste d'attente"
                    ))
                    .tip("Le niveau de risque détermine la priorité dans la liste d'attente.")
                    .relatedActions(List.of("Prioriser un patient", "Attribuer un lit"))
                    .build();

            case GUIDE_PRIORITIZE -> GuideResponse.builder()
                    .title("Comment prioriser un patient en attente")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Allez dans 'Coordonnateur' → liste d'attente",
                            "Trouvez le patient à prioriser",
                            "Cliquez sur 'Modifier la priorité'",
                            "Changez le niveau de risque (ELEVE/MOYEN/FAIBLE)"
                    ))
                    .tip("Les patients ÉLEVÉ sont traités en priorité absolue.")
                    .relatedActions(List.of("Voir les patients urgents", "Attribuer un lit"))
                    .build();

            case GUIDE_ASSIGN_UNIT -> GuideResponse.builder()
                    .title("Comment assigner une unité à un patient")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Dans 'Coordonnateur', sélectionnez le patient en attente",
                            "Cliquez sur 'Assigner une unité'",
                            "Choisissez l'unité selon le diagnostic",
                            "Vérifiez la disponibilité des lits",
                            "Confirmez l'assignation"
                    ))
                    .tip("L'IA peut suggérer l'unité la plus appropriée selon le diagnostic.")
                    .relatedActions(List.of("Demander au chatbot l'unité recommandée", "Voir les lits disponibles"))
                    .build();

            case GUIDE_VIEW_WAITING -> GuideResponse.builder()
                    .title("Comment voir les patients en attente")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Accédez à la section 'Coordonnateur'",
                            "Consultez la liste des civières en attente",
                            "Filtrez par unité ou niveau de risque si nécessaire"
                    ))
                    .tip("La liste est triée par niveau de risque puis par durée d'attente.")
                    .relatedActions(List.of("Prioriser un patient", "Attribuer un lit"))
                    .build();

            case GUIDE_FILTER_URGENCY -> GuideResponse.builder()
                    .title("Comment filtrer par niveau d'urgence")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Dans 'Coordonnateur', utilisez le filtre en haut de la liste",
                            "Sélectionnez le niveau: ÉLEVÉ, MOYEN ou FAIBLE",
                            "La liste se met à jour automatiquement"
                    ))
                    .tip("Vous pouvez également filtrer par unité cible.")
                    .relatedActions(List.of("Voir tous les patients en attente"))
                    .build();

            case GUIDE_UPDATE_STATUS -> GuideResponse.builder()
                    .title("Comment mettre à jour le statut d'un patient")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Trouvez le patient dans la liste",
                            "Cliquez sur son nom pour ouvrir sa fiche",
                            "Modifiez le statut ou les informations",
                            "Sauvegardez les changements"
                    ))
                    .tip("Les changements de statut sont enregistrés dans le journal d'audit.")
                    .relatedActions(List.of("Congédier un patient", "Changer de lit"))
                    .build();

            case GUIDE_CREATE_TRANSFER -> GuideResponse.builder()
                    .title("Comment créer un transfert")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "Accédez à la section 'Transferts'",
                            "Cliquez sur 'Nouveau transfert'",
                            "Sélectionnez le patient et le type (ENTRANT/SORTANT)",
                            "Indiquez l'hôpital d'origine ou de destination",
                            "Choisissez le mode de transport",
                            "Planifiez la date et l'heure"
                    ))
                    .tip("Les transferts ENTRANTS nécessitent un lit disponible à l'arrivée.")
                    .relatedActions(List.of("Voir les lits disponibles", "Vérifier la saturation"))
                    .build();

            case GUIDE_OUTGOING_TRANSFER -> GuideResponse.builder()
                    .title("Comment gérer un transfert sortant")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "Allez dans 'Transferts'",
                            "Créez un transfert de type SORTANT",
                            "Indiquez l'hôpital de destination",
                            "Préparez le dossier de transfert",
                            "Mettez à jour le statut à 'EN_COURS' au départ"
                    ))
                    .tip("Le lit du patient sera libéré automatiquement au congé.")
                    .relatedActions(List.of("Congédier un patient", "Créer un transfert"))
                    .build();

            case GUIDE_ASSIGN_INCOMING -> GuideResponse.builder()
                    .title("Comment accueillir un transfert entrant")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "Vérifiez les transferts ENTRANTS en attente",
                            "Confirmez la disponibilité d'un lit dans l'unité cible",
                            "Réservez le lit pour le patient entrant",
                            "Mettez le transfert à 'EN_COURS' à l'arrivée",
                            "Admettez le patient et attribuez le lit réservé"
                    ))
                    .tip("Prévenez l'unité d'accueil avant l'arrivée du patient.")
                    .relatedActions(List.of("Réserver un lit", "Admettre un patient"))
                    .build();

            case GUIDE_RESERVE_TRANSFER -> GuideResponse.builder()
                    .title("Comment réserver un lit pour un transfert")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "Identifiez le lit à réserver pour le transfert",
                            "Allez dans 'Gestion des Lits'",
                            "Réservez le lit avec la date d'arrivée prévue",
                            "Associez la réservation au dossier de transfert"
                    ))
                    .tip("La réservation expire automatiquement si non utilisée dans les délais.")
                    .relatedActions(List.of("Créer un transfert entrant", "Voir les lits disponibles"))
                    .build();

            case GUIDE_CHANGE_TRANSFER -> GuideResponse.builder()
                    .title("Comment modifier un transfert")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "Allez dans 'Transferts'",
                            "Trouvez le transfert à modifier",
                            "Cliquez sur 'Modifier'",
                            "Mettez à jour les informations (date, hôpital, transport)",
                            "Sauvegardez les changements"
                    ))
                    .tip("Les transferts EN_COURS ne peuvent pas être modifiés, seulement annulés.")
                    .relatedActions(List.of("Annuler un transfert"))
                    .build();

            case GUIDE_CANCEL_TRANSFER -> GuideResponse.builder()
                    .title("Comment annuler un transfert")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "Allez dans 'Transferts'",
                            "Sélectionnez le transfert à annuler",
                            "Cliquez sur 'Annuler le transfert'",
                            "Confirmez l'annulation et indiquez la raison"
                    ))
                    .tip("Libérez le lit réservé si applicable après l'annulation.")
                    .relatedActions(List.of("Créer un nouveau transfert"))
                    .build();

            case GUIDE_CONFIRM_ARRIVAL -> GuideResponse.builder()
                    .title("Comment confirmer l'arrivée d'un patient")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .steps(List.of(
                            "À l'arrivée du patient, allez dans 'Transferts'",
                            "Trouvez le transfert correspondant",
                            "Cliquez sur 'Confirmer l'arrivée'",
                            "Mettez le statut à 'COMPLET'",
                            "Procédez à l'admission du patient"
                    ))
                    .tip("L'admission doit être complétée dans les 30 minutes suivant l'arrivée.")
                    .relatedActions(List.of("Admettre un patient", "Attribuer un lit"))
                    .build();

            case GUIDE_HANDLE_ALERT -> GuideResponse.builder()
                    .title("Comment gérer une alerte")
                    .section("Urgence")
                    .sectionRoute("/urgence")
                    .steps(List.of(
                            "Les alertes apparaissent en haut de l'écran (bannière rouge)",
                            "Cliquez sur l'alerte pour voir les détails",
                            "Prenez l'action corrective (libérer lit, prioriser patient)",
                            "L'alerte se résout automatiquement une fois l'action effectuée"
                    ))
                    .tip("Les alertes CRITIQUES nécessitent une action immédiate.")
                    .relatedActions(List.of("Voir toutes les alertes", "Attribuer un lit d'urgence"))
                    .build();

            case GUIDE_VIEW_ALERTS -> GuideResponse.builder()
                    .title("Comment voir les alertes actives")
                    .section("Urgence")
                    .sectionRoute("/urgence")
                    .steps(List.of(
                            "Consultez la bannière d'alertes en haut de l'écran",
                            "Allez dans 'Urgence' pour la liste complète",
                            "Filtrez par sévérité: CRITIQUE, AVERTISSEMENT, INFO"
                    ))
                    .tip("Configurez les notifications pour recevoir les alertes en temps réel.")
                    .relatedActions(List.of("Gérer une alerte", "Vérifier la saturation"))
                    .build();

            case GUIDE_RESOLVE_ALERT -> GuideResponse.builder()
                    .title("Comment résoudre une alerte")
                    .section("Urgence")
                    .sectionRoute("/urgence")
                    .steps(List.of(
                            "Identifiez la cause de l'alerte",
                            "Prenez l'action corrective appropriée",
                            "L'alerte disparaît automatiquement quand la situation est résolue"
                    ))
                    .tip("Les alertes de saturation se résolvent quand le taux passe sous 85%.")
                    .relatedActions(List.of("Voir les alertes", "Proposer une réorganisation"))
                    .build();

            case GUIDE_IDENTIFY_URGENT -> GuideResponse.builder()
                    .title("Comment identifier les patients urgents")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Dans 'Coordonnateur', les patients ÉLEVÉ sont en rouge",
                            "Triez la liste par niveau de risque",
                            "Consultez le chatbot: 'patients les plus urgents'"
                    ))
                    .tip("Un patient ÉLEVÉ attendant plus de 30 min déclenche une alerte critique.")
                    .relatedActions(List.of("Attribuer un lit", "Voir les alertes"))
                    .build();

            case GUIDE_CHECK_SATURATION -> GuideResponse.builder()
                    .title("Comment vérifier la saturation des unités")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .steps(List.of(
                            "Accédez à 'Vue d'Ensemble' pour le taux global",
                            "Consultez les cartes par unité pour le détail",
                            "Les unités rouges (>95%) sont en saturation critique"
                    ))
                    .tip("Demandez au chatbot: 'taux de saturation par unité' pour plus de détails.")
                    .relatedActions(List.of("Voir les lits disponibles", "Proposer une réorganisation"))
                    .build();

            case GUIDE_READ_DASHBOARD -> GuideResponse.builder()
                    .title("Comment lire le tableau de bord")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .steps(List.of(
                            "La page 'Vue d'Ensemble' affiche les KPIs principaux",
                            "Lits totaux, disponibles, occupés, en nettoyage",
                            "Patients en attente et transferts actifs",
                            "Taux d'occupation global et par unité"
                    ))
                    .tip("Les données se rafraîchissent toutes les 30 secondes automatiquement.")
                    .relatedActions(List.of("Vérifier les alertes", "Voir les prédictions IA"))
                    .build();

            case GUIDE_WEEK_STATS -> GuideResponse.builder()
                    .title("Comment consulter les statistiques hebdomadaires")
                    .section("Centre de Rapports")
                    .sectionRoute("/centre-rapports")
                    .steps(List.of(
                            "Allez dans 'Centre de Rapports'",
                            "Sélectionnez la période: 7 derniers jours",
                            "Consultez les admissions, congés, et taux d'occupation",
                            "Exportez le rapport si nécessaire"
                    ))
                    .tip("Demandez au chatbot: 'statistiques de la semaine' pour un résumé rapide.")
                    .relatedActions(List.of("Voir les tendances d'admission", "Durée moyenne de séjour"))
                    .build();

            case GUIDE_ANALYZE_ADMISSIONS -> GuideResponse.builder()
                    .title("Comment analyser les admissions")
                    .section("Centre de Rapports")
                    .sectionRoute("/centre-rapports")
                    .steps(List.of(
                            "Allez dans 'Centre de Rapports'",
                            "Consultez le graphique des admissions quotidiennes",
                            "Identifiez les pics et les tendances",
                            "Demandez au chatbot: 'tendances admissions 30 jours'"
                    ))
                    .tip("Les admissions sont plus élevées en début de semaine typiquement.")
                    .relatedActions(List.of("Prévoir les besoins en lits", "Durée moyenne de séjour"))
                    .build();

            case GUIDE_IDENTIFY_DIFFICULT -> GuideResponse.builder()
                    .title("Comment identifier les cas difficiles")
                    .section("Prédictions IA")
                    .sectionRoute("/ia-predictions")
                    .steps(List.of(
                            "Allez dans 'Prédictions IA'",
                            "Consultez la section 'Risque de détérioration'",
                            "Les patients avec score élevé nécessitent attention",
                            "Demandez au chatbot: 'patients à risque de détérioration'"
                    ))
                    .tip("Le score prend en compte: niveau de risque, temps d'attente, âge, diagnostic.")
                    .relatedActions(List.of("Voir les alertes critiques", "Prioriser un patient"))
                    .build();

            case GUIDE_ANTICIPATE_BEDS -> GuideResponse.builder()
                    .title("Comment anticiper les besoins en lits")
                    .section("Prédictions IA")
                    .sectionRoute("/ia-predictions")
                    .steps(List.of(
                            "Consultez les prévisions dans 'Prédictions IA'",
                            "Demandez au chatbot: 'prévision pour aujourd'hui'",
                            "Identifiez les unités qui seront sous pression",
                            "Planifiez les sorties et transferts en conséquence"
                    ))
                    .tip("Les prévisions sont basées sur la durée moyenne de séjour par diagnostic.")
                    .relatedActions(List.of("Voir le risque de saturation", "Trouver le goulot d'étranglement"))
                    .build();

            case GUIDE_CRITICAL_WAIT -> GuideResponse.builder()
                    .title("Comment gérer une attente critique")
                    .section("Urgence")
                    .sectionRoute("/urgence")
                    .steps(List.of(
                            "Identifiez les patients ÉLEVÉ en attente depuis plus de 30 min",
                            "Demandez au chatbot: 'patients en attente critique'",
                            "Libérez un lit en accélérant un congé ou nettoyage",
                            "Envisagez un transfert vers une unité moins surchargée"
                    ))
                    .tip("Chaque minute compte pour les patients à risque ÉLEVÉ.")
                    .relatedActions(List.of("Voir les alertes critiques", "Proposer une réorganisation"))
                    .build();

            case GUIDE_BED_SHORTAGE -> GuideResponse.builder()
                    .title("Comment gérer une pénurie de lits")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .steps(List.of(
                            "Demandez au chatbot: 'générer une stratégie'",
                            "Identifiez les lits en nettoyage depuis trop longtemps",
                            "Accélérez les congés planifiés",
                            "Proposez des transferts inter-unités si possible",
                            "Contactez les hôpitaux partenaires pour des transferts sortants"
                    ))
                    .tip("L'IA peut proposer une réorganisation optimale des patients.")
                    .relatedActions(List.of("Générer une stratégie IA", "Proposer une réorganisation"))
                    .build();

            case GUIDE_MULTI_PRIORITY -> GuideResponse.builder()
                    .title("Comment gérer plusieurs priorités simultanées")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Consultez la liste triée par score de priorité",
                            "Traitez en premier les patients ÉLEVÉ les plus anciens",
                            "Demandez au chatbot: 'optimiser les attributions de lits'",
                            "Utilisez la vue Station Matinale pour une vue d'ensemble"
                    ))
                    .tip("Le score de priorité combine niveau de risque et durée d'attente.")
                    .relatedActions(List.of("Optimiser les attributions", "Voir les patients urgents"))
                    .build();

            case GUIDE_CHOOSE_UNIT -> GuideResponse.builder()
                    .title("Comment choisir la bonne unité pour un patient")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .steps(List.of(
                            "Demandez au chatbot: 'quelle unité pour [diagnostic]'",
                            "L'IA analyse le diagnostic et recommande l'unité appropriée",
                            "Vérifiez la disponibilité des lits dans l'unité recommandée",
                            "Procédez à l'attribution"
                    ))
                    .tip("L'IA connaît 30+ diagnostics et leurs unités appropriées.")
                    .relatedActions(List.of("Voir les lits disponibles par unité", "Attribuer un lit"))
                    .build();

            case GUIDE_OPTIMIZE -> GuideResponse.builder()
                    .title("Comment optimiser l'utilisation des lits")
                    .section("Prédictions IA")
                    .sectionRoute("/ia-predictions")
                    .steps(List.of(
                            "Demandez au chatbot: 'optimiser les attributions'",
                            "L'IA propose les meilleures attributions selon priorité et disponibilité",
                            "Reviewez les propositions et confirmez",
                            "Demandez: 'proposer une réorganisation' pour équilibrer la charge"
                    ))
                    .tip("L'optimisation prend en compte les niveaux de risque et les unités cibles.")
                    .relatedActions(List.of("Proposer une réorganisation", "Trouver le goulot d'étranglement"))
                    .build();

            case ONBOARDING_HELP -> GuideResponse.builder()
                    .title("Bienvenue dans HosCor — Guide de démarrage")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .context("Utilisez ce guide si vous démarrez avec le système ou si vous avez besoin d'un rappel des fonctions principales.")
                    .steps(List.of(
                            "**Vue d'Ensemble** : tableau de bord avec les KPIs (lits, patients, alertes)",
                            "**Gestion des Lits** : attribuer, réserver, et suivre l'état des lits par unité",
                            "**Coordonnateur** : gérer la liste d'attente des civières et les priorités",
                            "**Transferts** : créer et suivre les transferts entrants et sortants",
                            "**Urgence** : consulter les alertes critiques en temps réel",
                            "**Chatbot** (ce panneau) : posez des questions en français pour obtenir des données ou des guides"
                    ))
                    .tip("Commencez par la Vue d'Ensemble pour avoir une image complète de la situation.")
                    .smartSuggestions(List.of(
                            "Combien de lits disponibles ?",
                            "Patients en attente urgents",
                            "Alertes critiques actives",
                            "Comment attribuer un lit ?"
                    ))
                    .relatedActions(List.of("Voir les lits disponibles", "Voir les alertes", "Patients en attente"))
                    .build();

            case ONBOARDING_NAVIGATE -> GuideResponse.builder()
                    .title("Comment naviguer dans HosCor")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .context("Le menu latéral donne accès à toutes les sections. Chaque section a un rôle précis.")
                    .steps(List.of(
                            "Le menu est toujours visible à gauche de l'écran",
                            "**Vue d'Ensemble** → KPIs et état global",
                            "**Gestion des Lits** → lits par unité (2N, 3N, 2S, 3S, URG, CHIR)",
                            "**Coordonnateur** → civières en attente",
                            "**Transferts** → mouvements inter-hôpitaux",
                            "**Station Matinale** → réunion de début de quart",
                            "**Centre de Rapports** → rapports et exports PDF",
                            "**Prédictions IA** → forecasts et optimisations"
                    ))
                    .tip("Cliquez sur l'icône du chatbot (coin bas-droit) pour accéder à l'assistant à tout moment.")
                    .relatedActions(List.of("Voir le tableau de bord", "Comment utiliser le chatbot ?"))
                    .build();

            case ERROR_ASSIGN_BED -> GuideResponse.builder()
                    .title("Pourquoi je ne peux pas attribuer un lit ?")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .context("L'attribution de lit peut échouer pour plusieurs raisons. Vérifiez ces points dans l'ordre.")
                    .steps(List.of(
                            "**Vérifiez l'état du lit** : le lit doit être DISPONIBLE (vert) — pas occupé, réservé, ou en nettoyage",
                            "**Vérifiez le patient** : le patient doit être en attente (civière) — pas déjà admis",
                            "**Vérifiez votre session** : si le bouton ne répond pas, rechargez la page (F5)",
                            "**Vérifiez les permissions** : seuls ADMIN et COORDINATOR peuvent attribuer des lits",
                            "**Si l'erreur persiste** : déconnectez-vous, reconnectez-vous, et réessayez"
                    ))
                    .tip("Si le lit apparaît disponible mais ne peut pas être attribué, vérifiez qu'il n'est pas en cours de nettoyage.")
                    .troubleshooting(List.of(
                            "Bouton grisé → lit non disponible ou patient déjà admis",
                            "Erreur 403 → session expirée, reconnectez-vous",
                            "Rien ne se passe au clic → rechargez la page (F5)",
                            "Message d'erreur 'Patient introuvable' → vérifiez le numéro MRD"
                    ))
                    .warnings(List.of(
                            "Ne tentez pas d'attribuer un lit en nettoyage — risque d'infection",
                            "Un patient déjà admis doit être congédié avant d'être réassigné"
                    ))
                    .relatedActions(List.of("Voir les lits disponibles", "Vérifier le statut du patient"))
                    .build();

            case ERROR_TRANSFER -> GuideResponse.builder()
                    .title("Pourquoi le bouton de transfert ne fonctionne pas ?")
                    .section("Transferts")
                    .sectionRoute("/transferts")
                    .context("Les boutons de transfert peuvent ne pas répondre pour des raisons techniques ou de données.")
                    .steps(List.of(
                            "**Rechargez la page** : appuyez sur F5 ou Ctrl+R",
                            "**Vérifiez votre connexion** : l'icône de chargement tourne-t-elle ?",
                            "**Vérifiez que le patient existe** : le patient doit être admis pour créer un transfert",
                            "**Vérifiez le statut du transfert** : un transfert COMPLET ne peut pas être modifié",
                            "**Déconnectez-vous et reconnectez-vous** si l'erreur 403 apparaît dans la console"
                    ))
                    .tip("Pour créer un transfert, allez dans la section Transferts → cliquez sur '+ Nouveau mouvement'.")
                    .troubleshooting(List.of(
                            "Bouton '+ Nouveau mouvement' inactif → rechargez la page",
                            "Modal qui ne s'ouvre pas → désactivez le bloqueur de popups",
                            "Erreur lors de la sauvegarde → vérifiez que tous les champs obligatoires sont remplis",
                            "Statut ne se met pas à jour → rafraîchissez manuellement (F5)"
                    ))
                    .relatedActions(List.of("Créer un transfert", "Voir les transferts actifs"))
                    .build();

            case ERROR_LOGIN -> GuideResponse.builder()
                    .title("Problème de connexion — que faire ?")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .context("Si vous ne pouvez pas vous connecter, suivez ces étapes de dépannage.")
                    .steps(List.of(
                            "**Vérifiez vos identifiants** : nom d'utilisateur et mot de passe sont sensibles à la casse",
                            "**Identifiants par défaut** : admin/password, coord1/password, nurse1/password",
                            "**Videz le cache** : ouvrez un onglet privé (Ctrl+Shift+N) et réessayez",
                            "**Vérifiez que le serveur est actif** : accédez à http://localhost:8080/actuator/health",
                            "**Contactez l'administrateur** si aucune de ces étapes ne fonctionne"
                    ))
                    .tip("Si vous voyez 'Token expiré' ou êtes redirigé vers la page de connexion, reconnectez-vous simplement.")
                    .troubleshooting(List.of(
                            "Erreur 401 → identifiants incorrects",
                            "Erreur 403 → session expirée, reconnectez-vous",
                            "Page blanche après connexion → rechargez (F5)",
                            "Serveur inaccessible → vérifiez que le backend est démarré sur le port 8080"
                    ))
                    .relatedActions(List.of("Retourner à la page de connexion"))
                    .build();

            case ERROR_GENERAL -> GuideResponse.builder()
                    .title("Un bouton ne fonctionne pas — dépannage général")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .context("Si un bouton ou une fonctionnalité ne répond pas comme prévu, suivez ce guide.")
                    .steps(List.of(
                            "**Rechargez la page** : F5 résout 80% des problèmes d'interface",
                            "**Vérifiez votre session** : ouvrez la console (F12) — une erreur 401/403 signifie session expirée",
                            "**Vérifiez le serveur** : http://localhost:8080/actuator/health doit retourner {\"status\":\"UP\"}",
                            "**Vérifiez les données** : le patient ou lit impliqué existe-t-il encore ?",
                            "**Essayez un autre navigateur** : Chrome ou Firefox recommandés"
                    ))
                    .tip("Appuyez sur F12 pour ouvrir la console du navigateur. Les messages en rouge indiquent l'erreur exacte.")
                    .troubleshooting(List.of(
                            "Erreur réseau (net::ERR_*) → le backend n'est pas démarré",
                            "Erreur 401/403 → reconnectez-vous",
                            "Erreur 404 → la ressource a été supprimée",
                            "Erreur 500 → problème serveur, consultez les logs backend"
                    ))
                    .warnings(List.of("Ne rafraîchissez pas la page en pleine opération de sauvegarde"))
                    .relatedActions(List.of("Problème de connexion", "Problème attribution de lit", "Problème transfert"))
                    .build();

            case HYGIENE_STATUS -> GuideResponse.builder()
                    .title("État actuel du nettoyage des lits")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .context("Le nettoyage est une étape critique entre deux patients. Voici comment suivre l'état.")
                    .steps(List.of(
                            "Demandez au chatbot : 'lits en nettoyage' pour la liste en temps réel",
                            "Dans 'Gestion des Lits', les lits jaunes sont en cours de nettoyage",
                            "Le rapport de nettoyage est aussi disponible dans la **Station Matinale**",
                            "Un lit resté en nettoyage plus de 2h génère une alerte automatique"
                    ))
                    .tip("Le chatbot peut vous dire combien de lits sont en nettoyage par unité.")
                    .smartSuggestions(List.of(
                            "Combien de lits en nettoyage ?",
                            "Lits en nettoyage depuis trop longtemps",
                            "Unité avec le plus de lits en nettoyage"
                    ))
                    .relatedActions(List.of("Lits en nettoyage", "Voir les alertes de nettoyage"))
                    .build();

            case HYGIENE_ROTATION -> GuideResponse.builder()
                    .title("Cycle et protocole de nettoyage des lits")
                    .section("Gestion des Lits")
                    .sectionRoute("/gestion-lits")
                    .context("Le protocole de nettoyage suit un cycle précis pour garantir la sécurité des patients.")
                    .steps(List.of(
                            "**Déclenchement** : automatique au congé d'un patient (état → NETTOYAGE)",
                            "**Durée cible** : 45 minutes maximum par lit",
                            "**Validation** : changez l'état du lit à DISPONIBLE après nettoyage",
                            "**Alerte** : après 2h en nettoyage, une alerte est générée",
                            "**Rapport** : consultez la Station Matinale pour le bilan quotidien de nettoyage"
                    ))
                    .tip("Marquez le lit comme DISPONIBLE dès que le nettoyage est terminé pour libérer de la capacité.")
                    .decisionRules(List.of(
                            "< 45 min en nettoyage → normal",
                            "45 min - 2h → surveiller",
                            "> 2h en nettoyage → alerte, intervention requise"
                    ))
                    .relatedActions(List.of("Voir les lits en nettoyage", "Mettre un lit disponible"))
                    .build();

            case PATIENT_DISCHARGE -> GuideResponse.builder()
                    .title("Comment congédier un patient")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .context("Le congé d'un patient libère son lit et déclenche le processus de nettoyage.")
                    .steps(List.of(
                            "Allez dans 'Coordonnateur' → section 'Patients admis'",
                            "Trouvez le patient à congédier par nom ou MRD",
                            "Cliquez sur 'Congédier' sur la fiche du patient",
                            "Sélectionnez la raison du congé (NORMAL, DAMA, TRANSFERT, DÉCÈS)",
                            "Confirmez — le lit passe automatiquement en état NETTOYAGE"
                    ))
                    .tip("Le congé DAMA (Départ contre avis médical) doit être documenté avec une note.")
                    .warnings(List.of(
                            "Le congé est irréversible — vérifiez l'identité du patient avant de confirmer",
                            "Un patient avec un transfert EN_COURS ne peut pas être congédié directement"
                    ))
                    .smartSuggestions(List.of(
                            "Taux de DAMA cette semaine",
                            "Combien de congés prévus aujourd'hui ?",
                            "Lits qui vont se libérer"
                    ))
                    .relatedActions(List.of("Voir les patients admis", "Libérer un lit", "Prévisions de congés"))
                    .build();

            case PATIENT_CREATE -> GuideResponse.builder()
                    .title("Comment créer un dossier patient")
                    .section("Admissions")
                    .sectionRoute("/admissions")
                    .context("La création d'un dossier est la première étape pour tout nouveau patient.")
                    .steps(List.of(
                            "Allez dans 'Admissions' dans le menu principal",
                            "Cliquez sur '+ Nouveau patient'",
                            "Remplissez les champs obligatoires : **Prénom, Nom, MRD, Date de naissance**",
                            "Entrez le **diagnostic principal** (ex: Insuffisance cardiaque)",
                            "Sélectionnez le **niveau de risque** (ÉLEVÉ / MOYEN / FAIBLE)",
                            "Cliquez sur 'Enregistrer' pour créer la fiche"
                    ))
                    .tip("Le numéro MRD doit être unique (format recommandé: MRD-AAAA-XXX). Le système rejettera les doublons.")
                    .warnings(List.of(
                            "Le MRD doit être unique — une erreur apparaîtra si le numéro est déjà utilisé",
                            "Le niveau de risque affecte la priorité dans la liste d'attente — choisissez avec soin"
                    ))
                    .troubleshooting(List.of(
                            "Erreur 'MRD déjà existant' → utilisez un numéro MRD différent",
                            "Bouton 'Enregistrer' grisé → des champs obligatoires sont manquants",
                            "Formulaire qui ne s'ouvre pas → rechargez la page (F5)"
                    ))
                    .relatedActions(List.of("Ajouter à la liste d'attente", "Attribuer un lit", "Comment admettre un patient"))
                    .build();

            case MORNING_BRIEFING -> GuideResponse.builder()
                    .title("Station Matinale — Réunion de début de quart")
                    .section("Station Matinale")
                    .sectionRoute("/station-matinale")
                    .context("La Station Matinale centralise toutes les informations pour la réunion de début de quart (7h-8h).")
                    .steps(List.of(
                            "Accédez à **Station Matinale** dans le menu",
                            "Consultez le **résumé des lits** : disponibles, occupés, en nettoyage par unité",
                            "Revoyez le **recensement des transferts** : entrants, en cours, sortants",
                            "Consultez le **rapport d'hygiène** : lits en nettoyage et durées",
                            "Enregistrez les **problèmes opérationnels** par unité (onglets 2N, 3N, etc.)",
                            "Exportez en PDF pour les archives ou pour partager"
                    ))
                    .tip("Chaque chef d'unité peut noter ses problèmes directement dans l'onglet de son unité.")
                    .smartSuggestions(List.of(
                            "Combien de lits disponibles ce matin ?",
                            "Transferts prévus aujourd'hui",
                            "Lits en nettoyage depuis trop longtemps",
                            "Patients urgents en attente"
                    ))
                    .relatedActions(List.of("Voir la vue d'ensemble", "Lits en nettoyage", "Transferts du jour"))
                    .build();

            case DIAGNOSIS_LOOKUP -> GuideResponse.builder()
                    .title("Correspondance Diagnostic → Unité")
                    .section("Coordonnateur")
                    .sectionRoute("/coordonnateur")
                    .context("Chaque diagnostic correspond à une unité spécialisée. Utilisez ce guide pour orienter correctement les patients.")
                    .steps(List.of(
                            "**2N — Cardiologie** : insuffisance cardiaque, infarctus, angine, AVC, arythmie",
                            "**3N — Néphrologie** : insuffisance rénale, dialyse, néphropathie, pierre aux reins",
                            "**2S — Soins Intensifs** : patient instable, ventilé, post-réanimation, choc",
                            "**3S — Médecine Générale** : diabète, MPOC, infections, gériatrie, médecine interne",
                            "**URG — Urgence** : traumatisme, douleur aiguë, évaluation initiale",
                            "**CHIR — Chirurgie** : post-opératoire, appendicite, fracture, orthopédie"
                    ))
                    .tip("Demandez au chatbot 'quelle unité pour [diagnostic]' pour une recommandation IA personnalisée.")
                    .decisionRules(List.of(
                            "Patient instable → toujours Soins Intensifs (2S) en premier",
                            "Cardiaque mais stable → Cardiologie (2N)",
                            "Pas de lit disponible dans l'unité cible → consultez le chatbot pour alternatives",
                            "Diagnostic mixte → prioriser la pathologie la plus sévère"
                    ))
                    .smartSuggestions(List.of(
                            "Quelle unité pour insuffisance cardiaque ?",
                            "Lits disponibles en Cardiologie",
                            "Lits disponibles en Soins Intensifs"
                    ))
                    .relatedActions(List.of("Capacité par unité", "Voir les lits disponibles", "Recommandation IA pour un patient"))
                    .build();

            default -> GuideResponse.builder()
                    .title("Guide non disponible")
                    .section("Vue d'Ensemble")
                    .sectionRoute("/vue-ensemble")
                    .steps(List.of("Consultez la documentation ou contactez le support."))
                    .tip("Essayez de reformuler votre question.")
                    .relatedActions(List.of())
                    .build();
        };
    }
}
