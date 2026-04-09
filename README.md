# HosCor — Système de coordination hospitalière

> Plateforme de coordination des lits et des flux patients pour le Application de gestion hospitalière (Québec).  
> Application full-stack Java/React avec intelligence artificielle intégrée, conçue pour les équipes de soins en milieu hospitalier.

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Prérequis et installation](#3-prérequis-et-installation)
4. [Configuration de la base de données](#4-configuration-de-la-base-de-données)
5. [Démarrage de l'application](#5-démarrage-de-lapplication)
6. [Structure du projet](#6-structure-du-projet)
7. [Modèle de données](#7-modèle-de-données)
8. [Fonctionnalités par module](#8-fonctionnalités-par-module)
9. [Système de contrôle d'accès](#9-système-de-contrôle-daccès)
10. [Référence API REST complète](#10-référence-api-rest-complète)
11. [Assistant conversationnel (Chatbot)](#11-assistant-conversationnel-chatbot)
12. [Sécurité](#12-sécurité)
13. [Performances et mise en cache](#13-performances-et-mise-en-cache)
14. [Comptes de démonstration](#14-comptes-de-démonstration)
15. [Glossaire](#15-glossaire)

---

## 1. Présentation du projet

**HosCor** est un système d'information hospitalier dédié à la coordination opérationnelle des lits, des patients et des transferts. Il centralise en temps réel l'ensemble des flux hospitaliers : admissions, congés, transferts inter-unités, gestion des civières et alertes cliniques.

L'application est conçue pour répondre aux besoins opérationnels des établissements de santé québécois, en particulier aux coordinatrices de lit, aux gestionnaires d'unité, au personnel d'urgence et aux équipes d'hygiène hospitalière.

### Unités couvertes

| Code | Nom de l'unité       | Capacité (lits) |
|------|----------------------|-----------------|
| 2N   | Cardiologie          | 18              |
| 3N   | Néphrologie          | 16              |
| 2S   | Soins Intensifs      | 10              |
| 3S   | Médecine Générale    | 20              |
| URG  | Urgence              | 12              |
| CHIR | Chirurgie            | 16              |
|      | **Total**            | **92 lits**     |

### Objectifs fonctionnels

- **Visibilité en temps réel** sur l'occupation des lits par unité et par chambre
- **Gestion des civières** : file d'attente priorisée par niveau de risque clinique
- **Coordination des transferts** intra- et inter-hospitaliers
- **Tableau de bord analytique** : taux d'occupation, admissions hebdomadaires, mix diagnostique
- **Intelligence artificielle** : détection des patients à risque de détérioration, prévision des congés
- **Assistant conversationnel** en français pour les requêtes opérationnelles
- **Rapports de quart** automatisés (matin / soir / nuit)

---

## 2. Architecture technique

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (navigateur)                        │
│               React 18 + TypeScript + Vite + Tailwind               │
│                   TanStack Query 5 · Axios · Recharts               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP/REST (JSON) — port 5173
                                │ Proxy Vite → localhost:8080
┌───────────────────────────────▼─────────────────────────────────────┐
│                        Backend (Spring Boot)                        │
│              Java 17 · Spring Boot 3.2.5 · Spring Security 6        │
│          JWT (JJWT 0.12.3) · Hibernate 6.4 · Caffeine Cache        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ JDBC (PostgreSQL Driver 42.6)
┌───────────────────────────────▼─────────────────────────────────────┐
│                      Base de données (PostgreSQL 14+)               │
│              Schéma initialisé via schema.sql + seed.sql            │
└─────────────────────────────────────────────────────────────────────┘
```

### Pile technologique — Backend

| Composant         | Technologie                   | Version |
|-------------------|-------------------------------|---------|
| Langage           | Java                          | 17      |
| Framework         | Spring Boot                   | 3.2.5   |
| Sécurité          | Spring Security + JWT         | 6.2 / JJWT 0.12.3 |
| Persistance       | Spring Data JPA + Hibernate   | 6.4     |
| Base de données   | PostgreSQL                    | 14+     |
| Cache             | Caffeine                      | 3.1     |
| Build             | Apache Maven                  | 3.9+    |
| Monitoring        | Spring Actuator               | 3.2.5   |

### Pile technologique — Frontend

| Composant         | Technologie                   | Version |
|-------------------|-------------------------------|---------|
| Langage           | TypeScript                    | 5.5     |
| Framework UI      | React                         | 18.3    |
| Build tool        | Vite                          | 5.4     |
| Style             | Tailwind CSS                  | 3.4     |
| Requêtes HTTP     | Axios                         | 1.7     |
| State / Cache     | TanStack React Query          | 5.55    |
| Graphiques        | Recharts                      | 2.12    |
| Routage           | React Router                  | 6.26    |
| Internationalisation | i18next                    | 23.16   |
| Icônes            | Lucide React                  | 0.441   |

---

## 3. Prérequis et installation

### Prérequis système

- **Java 17+** (OpenJDK ou Eclipse Temurin recommandé)
- **Apache Maven 3.9+** (ou utiliser le wrapper `./mvnw` inclus)
- **Node.js 20+** et **npm 10+**
- **PostgreSQL 14+** en fonctionnement local sur le port 5432

### Vérification des prérequis

```bash
java -version       # doit afficher: openjdk 17.x.x ou supérieur
mvn -version        # doit afficher: Apache Maven 3.9.x
node -version       # doit afficher: v20.x.x ou supérieur
psql --version      # doit afficher: psql (PostgreSQL) 14.x ou supérieur
```

### Installation du backend

```bash
cd hoscor-backend
./mvnw clean install -DskipTests   # première installation des dépendances Maven
```

### Installation du frontend

```bash
cd hoscor-frontend
npm install                        # installation des dépendances Node.js
```

---

## 4. Configuration de la base de données

### Création de la base de données

```bash
psql -U postgres -c "CREATE DATABASE hoscor;"
```

### Paramètres de connexion

Les paramètres de connexion sont définis dans `hoscor-backend/src/main/resources/application.yml` :

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hoscor
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate           # le schéma est géré par schema.sql
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  sql:
    init:
      mode: always                 # exécute schema.sql et seed.sql à chaque démarrage
      continue-on-error: false     # arrête le démarrage en cas d'erreur SQL
```

### Initialisation automatique

Au démarrage, Spring Boot exécute automatiquement :

1. **`schema.sql`** — création idempotente de toutes les tables (`CREATE TABLE IF NOT EXISTS`)
2. **`seed.sql`** — insertion des données de démonstration (`INSERT ... ON CONFLICT DO NOTHING/UPDATE`)

Ces fichiers sont situés dans `hoscor-backend/src/main/resources/db/`.

> **Note :** L'initialisation est idempotente. Il est sans risque de redémarrer le serveur sans perdre les données existantes.

---

## 5. Démarrage de l'application

### 1. Démarrer le backend

```bash
cd hoscor-backend
./mvnw spring-boot:run
```

Le serveur Spring Boot démarre sur **http://localhost:8080**.

Pour vérifier que le backend est opérationnel :

```bash
curl http://localhost:8080/actuator/health
# Réponse attendue: {"status":"UP"}
```

### 2. Démarrer le frontend

```bash
cd hoscor-frontend
npm run dev
```

L'interface est accessible sur **http://localhost:5173**.

Vite est configuré pour proxyer automatiquement toutes les requêtes `/api/*` vers `http://localhost:8080`, ce qui évite les problèmes CORS en développement.

### 3. Se connecter

Accéder à `http://localhost:5173` et utiliser l'un des comptes de démonstration (voir [section 14](#14-comptes-de-démonstration)).

---

## 6. Structure du projet

```
HosCor/
├── hoscor-backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/hoscor/
│       │   ├── config/
│       │   │   ├── SecurityConfig.java         # Configuration Spring Security + CORS
│       │   │   ├── JwtAuthFilter.java          # Filtre JWT par requête
│       │   │   ├── CacheConfig.java            # Configuration Caffeine (bedStats, alertsCache)
│       │   │   └── DataInitializer.java        # Ré-encodage BCrypt des mots de passe au démarrage
│       │   ├── controller/
│       │   │   ├── AuthController.java         # POST /api/auth/login, /register, /refresh
│       │   │   ├── BedController.java          # GET/PATCH /api/beds/**
│       │   │   ├── PatientController.java      # GET/POST/PATCH /api/patients/**
│       │   │   ├── TransferController.java     # GET/POST/PATCH /api/transfers/**
│       │   │   ├── DashboardController.java    # GET /api/dashboard/overview
│       │   │   ├── AnalyticsController.java    # GET /api/analytics/deterioration-risk
│       │   │   ├── ChatbotController.java      # POST /api/chatbot/send, /action/confirm
│       │   │   ├── ReportController.java       # GET /api/reports/shift
│       │   │   ├── AlertController.java        # GET /api/alerts/active
│       │   │   └── UserController.java         # GET/PATCH /api/users/**
│       │   ├── domain/
│       │   │   ├── entity/                     # Entités JPA (Bed, Patient, Stretcher, Transfer, ...)
│       │   │   ├── enums/                      # Énumérations métier (BedState, PatientStatus, ...)
│       │   │   └── repository/                 # Interfaces Spring Data JPA
│       │   ├── dto/                            # Objets de transfert (request/response)
│       │   └── service/
│       │       ├── BedIntelligenceService.java # Analytique lits : saturation, prévisions 24h
│       │       ├── PatientFlowService.java     # Flux patients : civières, admissions, DAMA
│       │       ├── DecisionEngineService.java  # Moteur de décision IA : alertes, risque détérioration
│       │       ├── DashboardService.java       # Agrégation des KPI du tableau de bord
│       │       ├── ShiftReportService.java     # Génération des rapports de quart
│       │       ├── BedAssignmentService.java   # Attribution de lit (transaction atomique)
│       │       ├── PatientDischargeService.java # Congé patient (transaction atomique)
│       │       ├── IntentRouter.java           # Routage des intentions du chatbot
│       │       ├── GuideService.java           # Réponses d'aide contextuelle du chatbot
│       │       └── AuthService.java            # Authentification JWT
│       └── resources/
│           ├── application.yml
│           └── db/
│               ├── schema.sql                  # Définition du schéma de base de données
│               └── seed.sql                    # Données de démonstration
│
└── hoscor-frontend/
    ├── vite.config.ts                          # Proxy /api → localhost:8080
    ├── tailwind.config.js
    └── src/
        ├── api/                                # Clients Axios par domaine
        │   ├── client.ts                       # Instance Axios avec intercepteur JWT
        │   ├── dashboard.ts
        │   ├── beds.ts
        │   ├── patients.ts
        │   ├── transfers.ts
        │   ├── chatbot.ts
        │   └── alerts.ts
        ├── components/
        │   ├── layout/                         # Sidebar, Header, AlertBanner
        │   ├── chatbot/                        # Interface chatbot flottante
        │   └── common/                         # KPICard, Spinner, Modal, Badge
        ├── hooks/                              # Hooks React Query (useDashboard, useBeds, ...)
        ├── pages/                              # Pages de l'application (17 pages)
        ├── types/                              # Interfaces TypeScript
        └── i18n/                              # Fichiers de traduction (fr/en)
```

---

## 7. Modèle de données

### Entités principales

| Entité        | Table           | Description                                              |
|---------------|-----------------|----------------------------------------------------------|
| `Bed`         | `beds`          | Lit hospitalier avec état et horodatage de mise à jour   |
| `Patient`     | `patients`      | Dossier patient avec statut, diagnostic, unité et lit    |
| `Stretcher`   | `stretchers`    | Civière d'urgence avec niveau de risque et temps d'attente |
| `Transfer`    | `transfers`     | Transfert intra/inter-hospitalier avec statut et transport |
| `Attribution` | `attributions`  | Réservation d'un lit pour une civière                    |
| `User`        | `users`         | Compte utilisateur avec rôle RBAC                        |
| `DiagnosisAvgLos` | `diagnosis_avg_los` | Durée de séjour moyenne par code diagnostic (prévisions) |

### États des lits (`BedState`)

| État        | Description                                    |
|-------------|------------------------------------------------|
| `AVAILABLE` | Lit disponible — peut accueillir un patient    |
| `OCCUPIED`  | Lit occupé par un patient admis                |
| `CLEANING`  | En cours de nettoyage par l'équipe d'hygiène   |
| `READY`     | Nettoyé et prêt à l'attribution                |
| `RESERVED`  | Réservé pour une civière en attente            |
| `OUT_OF_SERVICE` | Hors service (maintenance)               |

### Statuts des patients (`PatientStatus`)

| Statut      | Description                              |
|-------------|------------------------------------------|
| `WAITING`   | En attente sur civière                   |
| `ADMITTED`  | Admis dans une unité                     |
| `CONGEDIE`  | Congédié (sorti de l'hôpital)            |

### Niveaux de risque (`RiskLevel`)

| Niveau   | Description clinique                    |
|----------|-----------------------------------------|
| `ELEVE`  | Risque élevé — priorité maximale        |
| `MOYEN`  | Risque modéré — surveillance accrue     |
| `FAIBLE` | Risque faible — situation stable        |

---

## 8. Fonctionnalités par module

### 8.1 Tableau de bord — Vue d'ensemble (`/vue-ensemble`)

Page d'accueil du coordinateur. Affiche en temps réel :

- **5 indicateurs clés (KPI)** : taux d'occupation global, patients en attente de lit, patients à risque élevé, congés prévus sous 24h, durée moyenne de séjour
- **Occupation par unité** : barre de progression par unité avec code couleur et compteur lits occupés / total
- **Admissions hebdomadaires** : histogramme Recharts des 7 derniers jours
- **Mix diagnostique** : top 4 diagnostics avec pourcentage parmi les patients admis
- **Résultats de la semaine** : répartition Congé / Décès / DAMA

Les données sont rechargées automatiquement toutes les 30 secondes via React Query.

### 8.2 Gestion des lits (`/gestion-lits`)

Interface de gestion granulaire des lits par unité :

- Sélection de l'unité par onglet (2N, 3N, 2S, 3S, URG, CHIR)
- Vue en grille de toutes les chambres avec état coloré
- **Attribution** : assigner un patient (par numéro MRD) à un lit disponible, avec liaison optionnelle à une civière
- **Changement d'état** : marquer un lit comme En nettoyage, Prêt, Hors service
- Recherche et filtrage par état ou numéro de chambre

L'attribution est garantie atomique par `BedAssignmentService` (`@Transactional`) : bed + patient + stretcher sont mis à jour dans une seule transaction.

### 8.3 Gestion des patients — Admissions (`/admissions`)

- Liste paginée des patients admis avec diagnostic, unité, numéro de lit et date d'admission
- Filtres par unité, statut, niveau de risque
- **Congé patient** : déclenchement via `PatientDischargeService` (`@Transactional`) — met à jour simultanément le statut patient, la date de congé, la raison (Congé / Décès / DAMA) et libère le lit en état `CLEANING`

### 8.4 Urgences — Civières (`/urgence`)

Interface dédiée au personnel d'urgence :

- File d'attente triée par score de priorité (niveau de risque + durée d'attente)
- Affichage du temps d'attente en temps réel (calculé via `EXTRACT(EPOCH FROM ...)`)
- Attribution rapide d'un lit depuis la vue civière
- Indication de l'unité cible recommandée par l'IA

### 8.5 Transferts (`/transferts`)

- Liste des transferts du jour et en attente
- Création de transfert : type (entrant / sortant / interne), hôpital d'origine/destination, mode de transport (ambulance, hélicoptère, accompagnement)
- Mise à jour du statut : EN_ATTENTE → EN_COURS → TERMINE / ANNULE
- Affichage des informations patient associé

### 8.6 Intelligence artificielle — Prédictions (`/ia-predictions`)

Module d'aide à la décision clinique basé sur le `DecisionEngineService` :

- **Score de risque de détérioration** (0–100) par patient admis, calculé à partir de l'âge, du diagnostic et de la durée de séjour
- Liste des patients à risque classés par score décroissant
- Indicateurs visuels (rouge ≥ 70, orange ≥ 40, vert < 40)
- Raisons cliniques détaillées par patient
- Rechargement automatique toutes les 60 secondes

### 8.7 Station matinale (`/station-matinale`)

Vue synthétique de début de quart :

- Résumé des événements du quart précédent
- Alertes actives et patients prioritaires
- Congés prévus pour la journée
- Lits en nettoyage dépassant le seuil de 30 minutes

### 8.8 Rapports de quart (`/centre-rapports`)

Génération à la demande de rapports structurés par quart :

- **Quart de jour** : 08:00–16:00
- **Quart de soir** : 16:00–00:00
- **Quart de nuit** : 00:00–08:00

Chaque rapport contient : admissions, congés, transferts et civières en attente survenus durant le quart sélectionné.

### 8.9 Affichage d'étage (`/affichage-etage`)

Vue simplifiée destinée aux écrans d'affichage de couloir :

- Occupation par chambre en mode grands caractères
- Code couleur par état de lit
- Pas d'interaction utilisateur requise

### 8.10 Hygiène (`/hygiene`)

Interface dédiée aux préposés à l'hygiène hospitalière :

- Liste des lits en état `CLEANING` avec horodatage depuis le début du nettoyage
- Alerte visuelle si un lit dépasse 30 minutes de nettoyage
- Bouton de validation : passage de `CLEANING` à `READY`

### 8.11 Coordonnateur de lit (`/coordonnateur`)

Tableau de bord avancé pour la coordinatrice de lit :

- Vue consolidée sur toutes les unités
- KPI avancés : lits réservés non occupés, prévisions de congés 24h, taux DAMA
- Recommandations de transfert inter-unités

### 8.12 Administration des utilisateurs (`/admin-users`)

Gestion des comptes utilisateurs (ADMIN uniquement) :

- Liste des comptes avec rôle et statut
- Activation / désactivation de comptes
- Modification du rôle

### 8.13 Assistant conversationnel

Interface de chatbot en langue française. Voir [section 11](#11-assistant-conversationnel-chatbot) pour les détails.

---

## 9. Système de contrôle d'accès

### Rôles disponibles

| Rôle                | Description                                            |
|---------------------|--------------------------------------------------------|
| `ADMIN`             | Accès complet, gestion des utilisateurs                |
| `COORDONNATEUR`     | Coordination globale des lits et des flux              |
| `GESTIONNAIRE_LIT`  | Gestion opérationnelle des lits par unité              |
| `CHEF_UNITE`        | Supervision d'une unité clinique                       |
| `URGENCE`           | Personnel de l'unité des urgences                      |
| `COMMIS_ETAGE`      | Saisie et consultation au niveau de l'étage            |
| `HYGIENE`           | Gestion du nettoyage des lits                          |

### Matrice d'accès aux pages

| Page                | ADMIN | COORD | GEST_LIT | CHEF | URG | COMMIS | HYGIENE |
|---------------------|:-----:|:-----:|:--------:|:----:|:---:|:------:|:-------:|
| Vue d'ensemble      | ✓     | ✓     | ✓        | ✓    | ✓   | ✓      |         |
| Gestion des lits    | ✓     | ✓     | ✓        | ✓    |     |        |         |
| Admissions          | ✓     | ✓     | ✓        | ✓    | ✓   |        |         |
| Urgences            | ✓     | ✓     | ✓        |      | ✓   |        |         |
| Transferts          | ✓     | ✓     | ✓        | ✓    | ✓   |        |         |
| IA Prédictions      | ✓     | ✓     |          | ✓    |     |        |         |
| Station matinale    | ✓     | ✓     | ✓        | ✓    | ✓   | ✓      |         |
| Centre de rapports  | ✓     | ✓     | ✓        | ✓    |     |        |         |
| Affichage d'étage   | ✓     | ✓     | ✓        | ✓    | ✓   | ✓      | ✓       |
| Hygiène             | ✓     |       |          |      |     |        | ✓       |
| Coordonnateur       | ✓     | ✓     |          |      |     |        |         |
| Admin utilisateurs  | ✓     |       |          |      |     |        |         |

### Pages publiques (non authentifiées)

- `/login` — Connexion
- `/forgot-password` — Réinitialisation du mot de passe
- `/reset-password` — Saisie du nouveau mot de passe
- `/signup` — Inscription (soumise à validation administrative)
- `/validate-account` — Validation du compte par l'administrateur

---

## 10. Référence API REST complète

Toutes les routes sont préfixées par `/api`. L'authentification JWT est requise sauf mention contraire.

### Authentification

| Méthode | Chemin                  | Description                          | Auth |
|---------|-------------------------|--------------------------------------|------|
| POST    | `/auth/login`           | Connexion — retourne un JWT          | Non  |
| POST    | `/auth/register`        | Inscription (statut: en attente)     | Non  |
| POST    | `/auth/refresh`         | Renouvellement du token JWT          | JWT  |

**Exemple de connexion :**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Tableau de bord

| Méthode | Chemin                   | Description                                      |
|---------|--------------------------|--------------------------------------------------|
| GET     | `/dashboard/overview`    | KPI globaux, occupation par unité, admissions 7j |

**Réponse :**

```json
{
  "data": {
    "totalBeds": 92,
    "availableBeds": 24,
    "occupiedBeds": 61,
    "cleaningBeds": 7,
    "occupancyRate": 66.3,
    "waitingPatients": 16,
    "highRiskWaiting": 4,
    "activeTransfers": 3,
    "criticalAlerts": 2,
    "forecastDischarges24h": 8,
    "weeklyAdmissions": [{"day":"2026-04-06","admissions":12}],
    "diagnosisMix": [{"label":"ACS","count":18,"pct":30,"color":"#2563EB"}],
    "perUnit": [{"unit":"2N","name":"Cardiologie","available":4,"occupied":13,"cleaning":1,"total":18,"rate":72.2,"saturationLevel":"MODÉRÉE"}]
  }
}
```

### Lits

| Méthode | Chemin                      | Description                                    |
|---------|-----------------------------|------------------------------------------------|
| GET     | `/beds`                     | Résumé d'occupation par unité                  |
| GET     | `/beds/{unit}`              | Liste des lits d'une unité                     |
| PATCH   | `/beds/{id}/state`          | Mettre à jour l'état d'un lit                  |
| POST    | `/beds/{id}/assign`         | Attribuer un patient (MRD) à un lit            |

**Corps de la requête — attribution :**

```json
{
  "patientMrd": "MRD-2024-001",
  "stretcherId": 5
}
```

### Patients

| Méthode | Chemin                         | Description                             |
|---------|--------------------------------|-----------------------------------------|
| GET     | `/patients/waiting`            | Civières en attente (triées par priorité) |
| GET     | `/patients/admitted`           | Patients admis dans toutes les unités   |
| GET     | `/patients/{mrd}`              | Détail d'un patient par numéro MRD      |
| POST    | `/patients`                    | Créer un nouveau dossier patient        |
| PATCH   | `/patients/{mrd}/discharge`    | Congédier un patient                    |

**Corps de la requête — congé :**

```json
{
  "dischargeReason": "DAMA"
}
```

Valeurs acceptées : `DISCHARGE` (congé normal), `EXPIRY` (décès), `DAMA` (départ contre avis médical).

### Transferts

| Méthode | Chemin                         | Description                              |
|---------|--------------------------------|------------------------------------------|
| GET     | `/transfers`                   | Liste des transferts du jour et en cours |
| POST    | `/transfers`                   | Créer un nouveau transfert               |
| PATCH   | `/transfers/{id}/status`       | Mettre à jour le statut d'un transfert   |

### Alertes

| Méthode | Chemin                  | Description                         |
|---------|-------------------------|-------------------------------------|
| GET     | `/alerts/active`        | Alertes cliniques critiques actives |

### Analytique IA

| Méthode | Chemin                              | Description                                        |
|---------|-------------------------------------|----------------------------------------------------|
| GET     | `/analytics/deterioration-risk`     | Score de risque de détérioration par patient admis |

**Exemple de réponse :**

```json
[
  {
    "patientId": 42,
    "mrdNumber": "MRD-2024-015",
    "firstName": "Marie",
    "lastName": "Dupont",
    "age": 78,
    "diagnosis": "Insuffisance cardiaque",
    "unit": "2N",
    "riskScore": 84,
    "reasons": ["Âge > 75 ans", "Séjour > 7 jours", "Diagnostic cardiaque critique"]
  }
]
```

### Rapports de quart

| Méthode | Chemin                                        | Description                          |
|---------|-----------------------------------------------|--------------------------------------|
| GET     | `/reports/shift?date=YYYY-MM-DD&shift=DAY`    | Rapport du quart spécifié            |

Valeurs du paramètre `shift` : `DAY`, `EVENING`, `NIGHT`.

### Chatbot

| Méthode | Chemin                        | Description                               |
|---------|-------------------------------|-------------------------------------------|
| POST    | `/chatbot/send`               | Envoyer un message en français au chatbot |
| POST    | `/chatbot/action/confirm`     | Confirmer une action proposée par le bot  |

### Utilisateurs

| Méthode | Chemin                         | Description                                   |
|---------|--------------------------------|-----------------------------------------------|
| GET     | `/users`                       | Liste des comptes (ADMIN uniquement)          |
| PATCH   | `/users/{id}/role`             | Modifier le rôle d'un utilisateur             |
| PATCH   | `/users/{id}/active`           | Activer ou désactiver un compte               |

### Format des réponses

Toutes les réponses respectent l'enveloppe suivante :

```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

En cas d'erreur :

```json
{
  "success": false,
  "data": null,
  "message": "Description de l'erreur"
}
```

---

## 11. Assistant conversationnel (Chatbot)

### Architecture

Le chatbot repose sur un moteur de routage d'intentions (`IntentRouter`) en français. Chaque message est analysé par correspondance de mots-clés et de patterns réguliers, puis routé vers le service métier approprié.

### Intentions reconnues

| Intention                | Exemples de déclencheurs                                  | Service appelé              |
|--------------------------|-----------------------------------------------------------|-----------------------------|
| `BED_AVAILABILITY`       | "lits disponibles", "combien de lits libres"             | `BedIntelligenceService`    |
| `SATURATION_STATUS`      | "saturation", "taux d'occupation", "unité pleine"        | `BedIntelligenceService`    |
| `CLEANING_BEDS`          | "lits en nettoyage", "nettoyage en cours"                | `BedIntelligenceService`    |
| `FORECAST_24H`           | "prévision 24h", "congés prévus", "libérations demain"   | `BedIntelligenceService`    |
| `WAITING_COUNT`          | "civières en attente", "combien de patients attendent"   | `PatientFlowService`        |
| `MOST_URGENT`            | "patients urgents", "priorités", "top 5"                 | `PatientFlowService`        |
| `PRIORITY_PATIENT`       | "patient prioritaire", "qui est le plus urgent"          | `PatientFlowService`        |
| `TRANSFER_STATUS`        | "transfert MRD-XXXX-XXX", "statut du transfert"          | `PatientFlowService`        |
| `TRANSFER_LIST`          | "liste des transferts", "transferts du jour"             | `PatientFlowService`        |
| `ADMISSION_STATS`        | "admissions cette semaine", "statistiques admissions"    | `PatientFlowService`        |
| `AVERAGE_LOS`            | "durée de séjour", "DMS par unité"                       | `PatientFlowService`        |
| `DAMA_RATE`              | "taux DAMA", "départs contre avis"                       | `PatientFlowService`        |
| `CRITICAL_ALERTS`        | "alertes critiques", "situations critiques"              | `DecisionEngineService`     |
| `DETERIORATION_RISK`     | "risque détérioration", "patients à risque"              | `DecisionEngineService`     |
| `GUIDE`                  | "aide", "que peux-tu faire", "comment"                   | `GuideService`              |

### Types de réponse

Le chatbot retourne des réponses structurées selon le type de données :

- **`TEXT`** : message textuel simple
- **`METRIC`** : indicateur chiffré avec contexte
- **`TABLE`** : tableau de données (lits, patients, transferts)
- **`CARDS`** : fiches patients avec détails
- **`CHART`** : données prêtes pour visualisation graphique

### Exemple d'interaction

```
Utilisateur : "Combien de lits sont disponibles en 3N ?"

Chatbot : Il y a 5 lits disponibles (DISPONIBLE ou PRÊT) sur un total de 16 lits en unité 3N.
[TABLE] unit:3N | available:5 | occupied:10 | cleaning:1 | total:16
```

---

## 12. Sécurité

### Authentification JWT

- Les jetons JWT sont signés avec HMAC-SHA256 et ont une durée de validité configurable (défaut : 24h)
- Le filtre `JwtAuthFilter` intercepte chaque requête, valide le token et injecte l'identité dans le contexte Spring Security
- Les tokens expirés retournent HTTP 401 automatiquement

### Chiffrement des mots de passe

- Tous les mots de passe sont stockés en BCrypt avec un coût de 10 itérations
- Le composant `DataInitializer` re-encode les mots de passe de démonstration à chaque démarrage pour garantir la cohérence

### CORS

- En développement : Vite proxye `/api` vers le backend, aucune requête cross-origin n'est émise
- En production : les origines autorisées sont configurées dans `SecurityConfig.java`

### RBAC (contrôle d'accès par rôle)

- Chaque endpoint est protégé par `@PreAuthorize("hasAnyRole(...)")` au niveau du contrôleur
- Les rôles sont préfixés `ROLE_` en interne par Spring Security

---

## 13. Performances et mise en cache

### Cache Caffeine

Deux caches sont configurés dans `CacheConfig.java` :

| Cache         | TTL    | Clés mises en cache                                          |
|---------------|--------|--------------------------------------------------------------|
| `bedStats`    | 30 s   | `getAvailableBedCount`, `getSaturationStatus`, `getCleaningBeds`, `forecast24h`, `getOccupancyRate` |
| `alertsCache` | 10 s   | `getCriticalAlerts`, `detectDeteriorationRisk`               |

### React Query — revalidation côté client

| Requête         | Intervalle de revalidation |
|-----------------|----------------------------|
| Dashboard       | 30 secondes                |
| Alertes actives | 10 secondes                |
| Risque IA       | 60 secondes                |

### Transactions

- Toutes les opérations multi-entités utilisent `@Transactional` avec rollback automatique en cas d'erreur :
  - **Attribution de lit** : `BedAssignmentService` — bed + patient + stretcher en une seule transaction
  - **Congé patient** : `PatientDischargeService` — patient + bed en une seule transaction
- Le tableau de bord utilise `Propagation.SUPPORTS` pour éviter la contamination des transactions partagées en lecture

---

## 14. Comptes de démonstration

Les comptes suivants sont créés automatiquement lors de l'initialisation (`seed.sql`) :

| Nom d'utilisateur | Mot de passe | Rôle                | Accès principal                      |
|-------------------|--------------|---------------------|--------------------------------------|
| `admin`           | `password`   | ADMIN               | Administration complète              |
| `coord1`          | `password`   | COORDONNATEUR       | Coordination des lits et flux        |
| `coord2`          | `password`   | COORDONNATEUR       | Coordination des lits et flux        |
| `gestlit1`        | `password`   | GESTIONNAIRE_LIT    | Gestion opérationnelle des lits      |
| `chef2N`          | `password`   | CHEF_UNITE          | Supervision unité Cardiologie (2N)   |
| `chef3N`          | `password`   | CHEF_UNITE          | Supervision unité Néphrologie (3N)   |
| `urg1`            | `password`   | URGENCE             | Interface urgences et civières       |
| `urg2`            | `password`   | URGENCE             | Interface urgences et civières       |
| `hygiene1`        | `password`   | HYGIENE             | Validation du nettoyage des lits     |
| `commis1`         | `password`   | COMMIS_ETAGE        | Consultation et saisie d'étage       |

> **Sécurité :** Ces comptes sont destinés exclusivement aux environnements de développement et de démonstration. En production, tous les mots de passe doivent être remplacés avant le déploiement.

---

## 15. Glossaire

| Terme           | Définition                                                                                      |
|-----------------|-------------------------------------------------------------------------------------------------|
| **MRD**         | Numéro de dossier médical — identifiant unique d'un patient (format : `MRD-AAAA-NNN`)          |
| **Civière**     | Brancard d'urgence sur lequel un patient attend l'attribution d'un lit                         |
| **Quart**       | Période de travail du personnel soignant (jour / soir / nuit)                                   |
| **DAMA**        | Départ contre avis médical — patient quittant l'établissement sans autorisation médicale        |
| **DMS**         | Durée moyenne de séjour — indicateur de performance hospitalière en heures ou en jours          |
| **KPI**         | Key Performance Indicator — indicateur clé de performance                                       |
| **Saturation**  | État d'une unité dont le taux d'occupation dépasse un seuil clinique critique (≥ 85 %)         |
| **BCrypt**      | Algorithme de hachage adaptatif utilisé pour le stockage sécurisé des mots de passe            |
| **JWT**         | JSON Web Token — jeton signé utilisé pour l'authentification sans session serveur               |
| **RBAC**        | Role-Based Access Control — contrôle d'accès basé sur les rôles                                |
| **TTL**         | Time To Live — durée de validité d'une entrée en cache                                          |
| **CISSS**       | Centre intégré de santé et de services sociaux — établissement du réseau de santé québécois    |

---

*Système développé pour le Application de gestion hospitalière — Usage interne uniquement.*
