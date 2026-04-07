# CisssCoord — Chatbot System Documentation

> Complete technical documentation for the AI assistant embedded in the CisssCoord hospital coordination platform.  
> Based strictly on the actual implementation — no features are described that do not exist in the code.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [How a Message Is Processed — End to End](#3-how-a-message-is-processed--end-to-end)
4. [Backend Components](#4-backend-components)
   - [ChatbotController](#41-chatbotcontroller)
   - [IntentRouter](#42-intentrouter)
   - [Response Services](#43-response-services)
   - [GuideService](#44-guideservice)
   - [Action Execution](#45-action-execution)
5. [Frontend Components](#5-frontend-components)
   - [ChatbotWidget](#51-chatbotwidget)
   - [ChatbotMessages](#52-chatbotmessages)
   - [ResponseRenderer](#53-responserenderer)
   - [GuideCard](#54-guidecard)
   - [ActionConfirmCard](#55-actionconfirmcard)
6. [API Endpoints](#6-api-endpoints)
7. [Response Types](#7-response-types)
8. [Intent Classification System](#8-intent-classification-system)
9. [Complete Question Reference](#9-complete-question-reference)
10. [Diagnosis → Unit Mapping](#10-diagnosis--unit-mapping)
11. [GuideResponse Structure](#11-guideresponse-structure)
12. [Action Confirmation Flow](#12-action-confirmation-flow)
13. [Caching](#13-caching)
14. [Security](#14-security)
15. [Data Flow Diagram](#15-data-flow-diagram)

---

## 1. Overview

The CisssCoord chatbot is a French-language conversational assistant embedded in every page of the application. It is accessible via a floating button in the bottom-right corner of the screen.

**What it does:**
- Answers questions about bed availability, patient status, transfers, and alerts using live database data
- Provides step-by-step guides for any operation in the application
- Suggests intelligent next actions based on current hospital state
- Proposes and executes direct data mutations (bed assignment, transfer status updates) with a confirmation step
- Handles troubleshooting questions when buttons or features are not working

**What it does not do:**
- It does not maintain conversation context between messages (each message is processed independently)
- It does not learn or update from user interactions
- It does not produce responses from a language model — all responses are rule-based and data-driven

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                        │
│                                                                 │
│  ChatbotWidget.tsx          (floating panel, input field)       │
│       │                                                         │
│  ChatbotMessages.tsx        (message history, typing indicator) │
│       │                                                         │
│  ResponseRenderer.tsx       (routes response type to UI)        │
│   ├── TEXT       →  plain paragraph                             │
│   ├── METRIC     →  2-column card grid                          │
│   ├── TABLE      →  HTML table (auto-generates headers)         │
│   ├── ALERT      →  colored alert box                           │
│   ├── PATIENT_CARDS → table via PatientRow.tsx                  │
│   ├── CHART_DATA →  recharts BarChart or LineChart              │
│   ├── ACTION_CONFIRM → ActionConfirmCard.tsx                    │
│   └── GUIDE     →  GuideCard.tsx                                │
│                                                                 │
│  API layer: src/api/chatbot.ts                                  │
│   POST /api/chatbot/send                                        │
│   POST /api/chatbot/action/confirm                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │  JWT Bearer token (Axios interceptor)
                   │  Vite proxy: /api → http://localhost:8080
┌──────────────────▼──────────────────────────────────────────────┐
│  BACKEND  (Spring Boot 3.2 / Java 17)                           │
│                                                                 │
│  ChatbotController                                              │
│       │                                                         │
│  IntentRouter          (regex NLP — 24 priority levels)         │
│       │                                                         │
│       ├── BedIntelligenceService   (live SQL bed analytics)     │
│       ├── PatientFlowService       (patient & transfer queries) │
│       ├── DecisionEngineService    (forecasts, AI, strategy)    │
│       └── GuideService             (step-by-step guide cards)   │
│                                                                 │
│  ActionAuditLogRepository  (logs all confirmed mutations)       │
│  PostgreSQL 14+                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. How a Message Is Processed — End to End

```
User types: "patients urgents en attente"
         │
         ▼
ChatbotWidget.handleSend()
  → POST /api/chatbot/send  { "message": "patients urgents en attente" }
         │
         ▼
ChatbotController.send()
  → intentRouter.detectIntent("patients urgents en attente")
         │
         ▼
IntentRouter.detectIntent()
  Checks 24 priority groups of regex patterns in order.
  "urgent" + "patient" matches:
    Pattern: (urgent|critique|prioritaire).*(patient|civière)
    → Returns: WAITING_URGENT
         │
         ▼
ChatbotController.route(WAITING_URGENT, message)
  → patientFlowService.getMostUrgent()
         │
         ▼
PatientFlowService.getMostUrgent()
  Executes native SQL: top 5 patients ordered by priority score
  (riskLevel weight + wait minutes, capped at 60)
  → Returns IntelligenceResult { type: PATIENT_CARDS, message, data: [flat maps] }
         │
         ▼
ChatbotController serialises to ChatbotResponseDto
  → ApiResponse<ChatbotResponseDto> { data: { type, message, data } }
         │
         ▼
Frontend receives response
ResponseRenderer detects type = "PATIENT_CARDS"
  → Normalises flat SQL maps into Stretcher objects (adds nested patient{})
  → Renders table via PatientRow.tsx
         │
         ▼
User sees: table with top 5 urgent waiting patients
```

---

## 4. Backend Components

### 4.1 ChatbotController

**File:** `src/main/java/com/hoscor/controller/ChatbotController.java`

Two endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chatbot/send` | Accepts `{ message }`, detects intent, routes to service, returns response |
| POST | `/api/chatbot/action/confirm` | Accepts `{ actionType, params }`, executes mutation, logs audit |

The controller injects all five dependencies (IntentRouter, BedIntelligenceService, PatientFlowService, DecisionEngineService, GuideService) plus repositories for action execution.

The `route()` method is a single switch expression that maps every `ChatbotIntent` enum value to a service call. No business logic lives in the controller itself.

All confirmed actions are written to the `action_audit_log` table via `ActionAuditLogRepository`.

---

### 4.2 IntentRouter

**File:** `src/main/java/com/hoscor/service/IntentRouter.java`

The intent router is the NLP engine. It receives the lowercased, trimmed user message and evaluates it against regex patterns in strict priority order. The first match wins and returns a `ChatbotIntent` enum value.

**Technology:** Java `Pattern.compile()` with `CASE_INSENSITIVE | UNICODE_CASE` flags. No external NLP library.

**Language support:** French primary, English keywords accepted for technical terms (help, login, bed, status, forecast).

**Priority order (highest to lowest):**

| Priority | Category | Rationale |
|---|---|---|
| 1 | Actions (direct mutations) | Must not be misclassified as guides |
| 2 | Error / troubleshooting | "problème" must not fall through to OPS_BOTTLENECK |
| 3 | Onboarding / navigation | Short greetings caught before everything else |
| 4 | Morning coordination | Short keyword match, unambiguous |
| 5–12 | Guide patterns (how-to questions) | All start with "comment" or "étapes" |
| 13 | Diagnosis → unit lookup | Single keyword match (cardio, néphro, etc.) |
| 14 | Bed intelligence (data) | Live counts and saturation |
| 15 | Hygiene status (data) | Live cleaning bed data |
| 16 | Waiting patients (data) | Live stretcher list |
| 17 | Unit matching | AI unit recommendation |
| 18 | Transfers (data) | Transfer list and status |
| 19 | Alerts | Critical alert list |
| 20 | Statistics | Admission stats, LOS, DAMA |
| 21 | Forecasts | Today/tomorrow discharge predictions |
| 22 | Operational (bottleneck) | Narrowly defined — does NOT match generic "problème" |
| 23 | AI / advanced | Strategy, simulation, reorganization |
| 24 | Patient search | MRD number patterns |
| — | UNKNOWN (fallback) | Returns a categorized help menu |

---

### 4.3 Response Services

Three services produce `IntelligenceResult` objects from live database data:

#### BedIntelligenceService
**File:** `src/main/java/com/hoscor/service/BedIntelligenceService.java`

Uses native SQL via `EntityManager`. Results are cached with Caffeine (30-second TTL, max 500 entries).

| Method | Returns | Data source |
|--------|---------|-------------|
| `getAvailableBedCount()` | TABLE — per-unit counts (available/occupied/cleaning/total) | `beds` table |
| `getSaturationStatus()` | TABLE — saturation level per unit with thresholds | `beds` table |
| `getReservedUnoccupied()` | TABLE — reserved beds with no patient after N minutes | `beds` table |
| `getCleaningBeds()` | TABLE — beds in CLEANING state with duration in minutes | `beds` table |
| `forecast24h()` | METRIC — expected discharges in next 24h by unit | JOIN `patients` + `diagnosis_avg_los` |
| `getOccupancyRate()` | TABLE — occupancy rate % per unit | `beds` table |

Saturation thresholds (hardcoded):
- ≥ 95% → CRITIQUE
- ≥ 85% → ÉLEVÉE
- ≥ 70% → MODÉRÉE
- < 70% → NORMALE

#### PatientFlowService
**File:** `src/main/java/com/hoscor/service/PatientFlowService.java`

Uses native SQL via `EntityManager` and Spring Data JPA repositories.

| Method | Returns | Data source |
|--------|---------|-------------|
| `getWaitingCount()` | METRIC — total, high/medium/low risk, avg wait minutes | `stretchers` |
| `getMostUrgent()` | PATIENT_CARDS — top 5 by priority score | `stretchers` + `patients` |
| `getPriorityPatient()` | PATIENT_CARDS — top 1 by priority score | `stretchers` + `patients` |
| `getWaitingByDiagnosis()` | TABLE — patient count per diagnosis with avg wait | `stretchers` + `patients` |
| `getTransferStatus(message)` | TABLE — transfers for a specific MRD (extracted from text) | `transfers` + `patients` |
| `getTransferList()` | TABLE — today's and pending transfers | `transfers` |
| `getAdmissionStats()` | CHART_DATA — admissions per day, last 7 days | `patients` |
| `getAverageLOS()` | TABLE — avg LOS hours per unit (discharged patients only) | `patients` |
| `getDamaRate()` | METRIC — DAMA count, total discharged, DAMA % | `patients` |
| `getAdmissionTrends()` | CHART_DATA — admissions per day, last 30 days | `patients` |

**Priority score formula** (used for stretcher sorting):
```
score = (ELEVE → 100, MOYEN → 50, FAIBLE → 10) + MIN(wait_minutes, 60)
```

#### DecisionEngineService
**File:** `src/main/java/com/hoscor/service/DecisionEngineService.java`

Uses both JPA repositories and native SQL. No caching.

| Method | Returns | Logic |
|--------|---------|-------|
| `matchPatientToUnit(message)` | METRIC — recommended unit + bed availability | Keyword scan of message against DIAGNOSIS_UNIT_MAP |
| `getCriticalAlerts()` | ALERT — list of active critical situations | ELEVE patients waiting > 30min; units ≥ 95% saturation; beds cleaning > 2h |
| `getOverdueWaiting()` | ALERT — patients past their max wait threshold | ELEVE > 30min, MOYEN > 120min, FAIBLE > 240min |
| `forecastToday()` | METRIC — discharge predictions 0–24h | Pure JPA: admitted patients + `estimateLosHours()` |
| `forecastTomorrow()` | METRIC — discharge predictions 24–48h | Pure JPA: admitted patients + `estimateLosHours()` |
| `saturationRiskToday()` | TABLE — current saturation risk per unit | Native SQL on `beds` |
| `findBottleneck()` | TABLE — top 3 worst-performing units by composite score | Native SQL: occupancy + cleaning + waiting patient counts |
| `explainBlocker(message)` | METRIC — detailed analysis of most congested unit | JPA repositories + extracted unit from message |
| `generateStrategy()` | ALERT — prioritized action recommendations | JPA counts → rule-based recommendation list |
| `detectDeteriorationRisk()` | PATIENT_CARDS — top 5 admitted patients with risk scores | JPA: admitted patients scored by risk level, wait time, age, diagnosis |
| `optimizeBedAssignment()` | TABLE — proposed patient-to-bed assignments | JPA: match waiting stretchers to available beds by target unit |
| `simulateAdmissions(message)` | METRIC — impact of N new admissions on each unit | JPA + proportional distribution |
| `proposeReorganization()` | TABLE — proposals to move patients from overloaded to underloaded units | Native SQL on `beds` |

---

### 4.4 GuideService

**File:** `src/main/java/com/hoscor/service/GuideService.java`

Returns `GuideResponse` objects for all `GUIDE_*` intents and the new category intents (ONBOARDING, ERROR, HYGIENE, etc.). All content is hardcoded in a single switch expression — no database queries.

Each guide contains:
- `title` — heading shown in the card
- `section` — name of the application section
- `sectionRoute` — path for the "Go to section" button (e.g., `/gestion-lits`)
- `context` *(optional)* — when and why to use this guide
- `steps` — ordered list of steps to complete the task
- `tip` — a practical tip shown at the bottom
- `smartSuggestions` *(optional)* — clickable follow-up questions
- `decisionRules` *(optional)* — logic rules (e.g., saturation thresholds)
- `warnings` *(optional)* — things to avoid
- `troubleshooting` *(optional)* — what to do if errors occur
- `relatedActions` — clickable buttons that send a new chatbot question

**Total guides implemented:** 49 (37 original GUIDE_* cases + 12 new intent cases)

---

### 4.5 Action Execution

When a user confirms an action via `POST /api/chatbot/action/confirm`, the controller executes direct database mutations:

| `actionType` | What it does |
|---|---|
| `ACTION_ASSIGN_BED` | Finds bed by ID, sets state to OCCUPIED; finds patient by MRD, sets bedNumber/unit/status to ADMITTED |
| `ACTION_RESERVE_BED` | Finds bed by ID, sets state to READY |
| `ACTION_UPDATE_TRANSFER` | Finds transfer by ID, sets new status from params |
| `ACTION_MARK_CRITICAL` | Returns confirmation text; logs to audit table |
| `ACTION_CREATE_TRANSFER` | Returns redirect text — user is directed to the Transferts page |

All confirmed and failed actions are written to `action_audit_log` with: actionType, paramsJson, resultJson, timestamp, status ("SUCCESS" or "FAILED").

---

## 5. Frontend Components

### 5.1 ChatbotWidget

**File:** `src/components/chatbot/ChatbotWidget.tsx`

The root component. Renders as a fixed floating button (`bottom: 24px, right: 24px, z-index: 50`).

- Clicking the button toggles the chat panel (380 × 520 px)
- Maintains message history in local React state (`useState<ChatMessage[]>`)
- Sends messages via `sendMessage()` from `src/api/chatbot.ts`
- Confirms actions via `confirmAction()` from `src/api/chatbot.ts`
- Pressing **Enter** (without Shift) submits the message
- Related-action buttons in guide cards re-use `handleSend()` to auto-submit the suggestion
- Shows "Désolé, une erreur s'est produite. Veuillez réessayer." on any API failure

**State:**
```typescript
const [open, setOpen] = useState(false)
const [messages, setMessages] = useState<ChatMessage[]>([])
const [input, setInput] = useState('')
const [isLoading, setIsLoading] = useState(false)
```

---

### 5.2 ChatbotMessages

**File:** `src/components/chatbot/ChatbotMessages.tsx`

Renders the scrollable message history. Auto-scrolls to the latest message after each update using a `ref` and `scrollIntoView({ behavior: 'smooth' })`.

- User messages: right-aligned, brand-blue background
- Assistant messages: left-aligned, white card with shadow
- Shows a 3-dot animated typing indicator (`TypingIndicator`) while `isLoading` is true
- Timestamps displayed as `HH:mm` using `date-fns/format`

---

### 5.3 ResponseRenderer

**File:** `src/components/chatbot/ResponseRenderer.tsx`

A switch statement on `response.type` that renders one of 8 formats:

| Type | Renderer | Notes |
|---|---|---|
| `TEXT` | `<p>` | Plain text response |
| `METRIC` | 2-column card grid | Handles both array `[{label,value}]` and plain object `{key: value}` from backend; skips nested objects |
| `TABLE` | `<table>` | Auto-generates headers from object keys if backend sends raw list; shows message only if data is empty |
| `ALERT` | Colored alert box | Red for CRITICAL, orange for others |
| `PATIENT_CARDS` | `<table>` via `PatientRow` | Normalises flat SQL maps (3 different shapes) into nested `Stretcher` objects before rendering |
| `CHART_DATA` | Recharts `BarChart` or `LineChart` | Handles both raw list and wrapped `{data, nameKey, dataKey}` object; auto-detects axis keys from first item |
| `ACTION_CONFIRM` | `ActionConfirmCard` | Two-button confirm/cancel |
| `GUIDE` | `GuideCard` | Full structured guide |

**PATIENT_CARDS normalisation** handles three distinct backend shapes:
1. **PatientFlowService shape** — has `stretcherNumber`, `riskLevel`, `waitSince`, `mrdNumber`, `waitMinutes`
2. **Overdue waiting shape** — has `waitMin` (not `waitMinutes`), no `mrdNumber`
3. **Deterioration risk shape** — has `riskScore` (not `riskLevel`), no `stretcherNumber`, no `waitSince`

---

### 5.4 GuideCard

**File:** `src/components/chatbot/GuideCard.tsx`

Renders a `GuideResponse` object as a structured card with distinct visual sections:

| Section | Color | Icon | Content |
|---|---|---|---|
| Header | Blue | — | Title + "Go to section" link |
| Context | Light blue italic | ℹ️ | When and why to use this guide |
| Steps | White | Numbered list | Step-by-step instructions with `**bold**` rendering |
| Decision Rules | Purple | ⚡ | Logic-based rules |
| Warnings | Red | ⚠️ | What to avoid |
| Troubleshooting | Orange | 🔧 | Error causes and fixes |
| Tip | Amber | 💡 | Practical tip |
| Smart Suggestions | Green | ✨ | Clickable questions (auto-submitted) |
| Related Actions | Gray | — | Clickable follow-up questions |

Optional sections (context, smartSuggestions, decisionRules, warnings, troubleshooting) are only rendered if present in the response.

Bold text inside steps is rendered by splitting on `**text**` markers and wrapping in `<strong>`.

---

### 5.5 ActionConfirmCard

**File:** `src/components/chatbot/ActionConfirmCard.tsx`

A yellow warning card with a summary text and two buttons:
- **Confirmer** (green) — calls `onConfirm()` → `POST /api/chatbot/action/confirm`
- **Annuler** (gray) — calls `onCancel()` → adds "Action annulée." message to history

---

## 6. API Endpoints

Both endpoints require a valid JWT Bearer token in the `Authorization` header.

### POST `/api/chatbot/send`

**Request:**
```json
{ "message": "combien de lits disponibles" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "TABLE",
    "message": "12 lit(s) disponible(s) sur 92 au total (4 unités sous pression).",
    "data": [
      { "unit": "2N", "available": 3, "occupied": 15, "cleaning": 0, "total": 18 },
      ...
    ],
    "actionType": null
  }
}
```

### POST `/api/chatbot/action/confirm`

**Request:**
```json
{
  "actionType": "ACTION_ASSIGN_BED",
  "params": {
    "bedId": 42,
    "mrd": "MRD-2024-015"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "TEXT",
    "message": "Lit 2N-04 attribué à Jean Dupont ✓",
    "data": null,
    "actionType": null
  }
}
```

---

## 7. Response Types

Defined in `com.hoscor.domain.enums.ResponseType`:

| Type | Frontend rendering | Typical backend source |
|---|---|---|
| `TEXT` | Plain paragraph | `IntelligenceResult.text(message)` |
| `METRIC` | 2-column card grid | `IntelligenceResult.metric(message, data)` |
| `TABLE` | Scrollable HTML table | `IntelligenceResult.table(message, data)` |
| `ALERT` | Colored alert box | `IntelligenceResult.alert(message, data)` |
| `PATIENT_CARDS` | Patient table with risk badges | `IntelligenceResult.cards(message, data)` |
| `CHART_DATA` | Bar or line chart (recharts) | `IntelligenceResult.chart(message, data)` |
| `ACTION_CONFIRM` | Confirm/Cancel card | Built inline in controller |
| `GUIDE` | Full structured guide card | `GuideService.getGuide(intent)` |

---

## 8. Intent Classification System

The `ChatbotIntent` enum defines **79 intent values** across 16 categories:

| Category | Intents | Count |
|---|---|---|
| Bed intelligence (data) | BED_COUNT, BED_SATURATION, BED_RESERVED, BED_CLEANING, BED_FORECAST | 5 |
| Waiting patients | WAITING_COUNT, WAITING_URGENT, WAITING_BY_DIAG, WAITING_PRIORITY | 4 |
| Unit matching | UNIT_MATCHING, UNIT_CAPACITY | 2 |
| Transfers | TRANSFER_STATUS, TRANSFER_LIST, TRANSFER_DELAYS | 3 |
| Alerts | ALERT_CRITICAL, ALERT_SATURATION, ALERT_WAIT_TOO_LONG | 3 |
| Statistics | STATS_OCCUPANCY, STATS_ADMISSIONS, STATS_LOS, STATS_DAMA, STATS_TRENDS | 5 |
| Forecasts | FORECAST_TODAY, FORECAST_TOMORROW, FORECAST_RISK | 3 |
| Actions | ACTION_ASSIGN_BED, ACTION_RESERVE_BED, ACTION_CREATE_TRANSFER, ACTION_MARK_CRITICAL, ACTION_UPDATE_TRANSFER | 5 |
| Operational | OPS_BOTTLENECK, OPS_BLOCKER, OPS_WHO_INTERVENE | 3 |
| AI / advanced | AI_STRATEGY, AI_DETERIORATION, AI_OPTIMIZE, AI_SIMULATE, AI_REORGANIZE | 5 |
| Patient search | PATIENT_SEARCH | 1 |
| General / fallback | GENERAL_QUESTION, UNKNOWN | 2 |
| Guide — beds | GUIDE_ASSIGN_BED, GUIDE_ADMIT_PATIENT, GUIDE_CHANGE_BED, GUIDE_FREE_BED, GUIDE_MARK_OCCUPIED, GUIDE_VIEW_BEDS, GUIDE_RESERVE_BED, GUIDE_CANCEL_RESERVATION | 8 |
| Guide — waiting | GUIDE_ADD_WAITING, GUIDE_PRIORITIZE, GUIDE_ASSIGN_UNIT, GUIDE_VIEW_WAITING, GUIDE_FILTER_URGENCY, GUIDE_UPDATE_STATUS | 6 |
| Guide — transfers | GUIDE_CREATE_TRANSFER, GUIDE_OUTGOING_TRANSFER, GUIDE_ASSIGN_INCOMING, GUIDE_RESERVE_TRANSFER, GUIDE_CHANGE_TRANSFER, GUIDE_CANCEL_TRANSFER, GUIDE_CONFIRM_ARRIVAL | 7 |
| Guide — alerts | GUIDE_HANDLE_ALERT, GUIDE_VIEW_ALERTS, GUIDE_RESOLVE_ALERT, GUIDE_IDENTIFY_URGENT, GUIDE_CHECK_SATURATION | 5 |
| Guide — stats/dashboard | GUIDE_READ_DASHBOARD, GUIDE_WEEK_STATS, GUIDE_ANALYZE_ADMISSIONS, GUIDE_IDENTIFY_DIFFICULT, GUIDE_ANTICIPATE_BEDS | 5 |
| Guide — advanced | GUIDE_CRITICAL_WAIT, GUIDE_BED_SHORTAGE, GUIDE_MULTI_PRIORITY, GUIDE_CHOOSE_UNIT, GUIDE_OPTIMIZE | 5 |
| Onboarding | ONBOARDING_HELP, ONBOARDING_NAVIGATE | 2 |
| Error handling | ERROR_ASSIGN_BED, ERROR_TRANSFER, ERROR_LOGIN, ERROR_GENERAL | 4 |
| Hygiene | HYGIENE_STATUS, HYGIENE_ROTATION | 2 |
| Patient lifecycle | PATIENT_DISCHARGE, PATIENT_CREATE | 2 |
| Morning coordination | MORNING_BRIEFING | 1 |
| Diagnosis lookup | DIAGNOSIS_LOOKUP | 1 |

---

## 9. Complete Question Reference

### Getting Started

| User input | Intent | Response |
|---|---|---|
| `aide` / `help` / `bonjour` / `salut` | ONBOARDING_HELP | Guide: welcome + feature overview |
| `comment utiliser le système` | ONBOARDING_HELP | Guide: feature overview |
| `par où commencer` / `tutoriel` | ONBOARDING_HELP | Guide: feature overview |
| `que puis-je faire` / `quelles fonctionnalités` | ONBOARDING_HELP | Guide: feature overview |
| `je suis nouveau` / `je suis débutant` | ONBOARDING_HELP | Guide: feature overview |
| `comment naviguer` | ONBOARDING_NAVIGATE | Guide: menu sections |
| `où se trouve la section Transferts` | ONBOARDING_NAVIGATE | Guide: menu sections |
| `comment accéder à Gestion des Lits` | ONBOARDING_NAVIGATE | Guide: menu sections |

### Troubleshooting & Errors

| User input | Intent | Response |
|---|---|---|
| `mot de passe incorrect` / `login ne fonctionne pas` | ERROR_LOGIN | Guide: login troubleshooting |
| `impossible de me connecter` | ERROR_LOGIN | Guide: login troubleshooting |
| `je ne peux pas assigner un lit` | ERROR_ASSIGN_BED | Guide: bed assignment troubleshooting |
| `pourquoi impossible d'attribuer un lit` | ERROR_ASSIGN_BED | Guide: bed assignment troubleshooting |
| `bouton assigner grisé / ne répond pas` | ERROR_ASSIGN_BED | Guide: bed assignment troubleshooting |
| `je ne peux pas créer un transfert` | ERROR_TRANSFER | Guide: transfer troubleshooting |
| `transfert bloqué` / `erreur transfert` | ERROR_TRANSFER | Guide: transfer troubleshooting |
| `bouton ne fonctionne pas` | ERROR_GENERAL | Guide: general troubleshooting |
| `rien ne se passe` / `page blanche` / `application bloquée` | ERROR_GENERAL | Guide: general troubleshooting |
| `erreur 500` / `erreur 403` / `erreur réseau` | ERROR_GENERAL | Guide: general troubleshooting |
| `pourquoi ça ne fonctionne pas` | ERROR_GENERAL | Guide: general troubleshooting |

### Morning Coordination

| User input | Intent | Response |
|---|---|---|
| `station matinale` | MORNING_BRIEFING | Guide: morning meeting workflow |
| `briefing du matin` / `réunion matinale` | MORNING_BRIEFING | Guide: morning meeting workflow |
| `rapport de début de quart` / `bilan du matin` | MORNING_BRIEFING | Guide: morning meeting workflow |

### Bed Management — Live Data

| User input | Intent | Response |
|---|---|---|
| `combien de lits disponibles` | BED_COUNT | TABLE: per-unit available/occupied/cleaning/total |
| `lits libres` / `lits vides` | BED_COUNT | TABLE: per-unit counts |
| `saturation` / `taux d'occupation` / `unité pleine` | BED_SATURATION | TABLE: saturation level per unit |
| `lits réservés inoccupés` / `réservations inutiles` | BED_RESERVED | TABLE: reserved beds with no patient |
| `lits en nettoyage` / `ménage en cours` | BED_CLEANING | TABLE: beds in CLEANING state with duration |
| `état du nettoyage` / `liste des lits en ménage` | HYGIENE_STATUS | TABLE: beds in CLEANING state (same source) |
| `prévisions de lits` / `anticiper les disponibilités` | BED_FORECAST | METRIC: expected discharges next 24h by unit |
| `congés prévus demain` / `sorties planifiées` | BED_FORECAST | METRIC: expected discharges next 24h by unit |

### Bed Management — Guides

| User input | Intent | Response |
|---|---|---|
| `comment attribuer un lit` | GUIDE_ASSIGN_BED | Guide: 5 steps |
| `comment admettre un patient` | GUIDE_ADMIT_PATIENT | Guide: 5 steps |
| `comment changer un patient de lit` | GUIDE_CHANGE_BED | Guide: 5 steps |
| `comment libérer un lit` | GUIDE_FREE_BED | Guide: 3 steps |
| `comment marquer un lit occupé` | GUIDE_MARK_OCCUPIED | Guide: 4 steps |
| `comment voir les lits` | GUIDE_VIEW_BEDS | Guide: 3 steps |
| `comment réserver un lit` | GUIDE_RESERVE_BED | Guide: 4 steps |
| `comment annuler une réservation` | GUIDE_CANCEL_RESERVATION | Guide: 3 steps |

### Hygiene Protocol

| User input | Intent | Response |
|---|---|---|
| `comment gérer le nettoyage` / `protocole nettoyage` | HYGIENE_ROTATION | Guide: cleaning cycle (trigger, 45min target, validation, alert at 2h) |
| `cycle de nettoyage` / `rotation ménage` | HYGIENE_ROTATION | Guide: cleaning cycle with decision rules |

### Patients in Queue (Stretchers) — Live Data

| User input | Intent | Response |
|---|---|---|
| `combien de patients en attente` | WAITING_COUNT | METRIC: total, high/medium/low risk, avg wait |
| `liste des civières en attente` | WAITING_COUNT | METRIC: total counts |
| `patients urgents` / `patients critiques` | WAITING_URGENT | PATIENT_CARDS: top 5 by priority score |
| `patients à risque élevé` | WAITING_URGENT | PATIENT_CARDS: top 5 by priority score |
| `patients par diagnostic` / `grouper par pathologie` | WAITING_BY_DIAG | TABLE: count per diagnosis with avg wait |
| `qui prioriser` / `quel patient traiter en premier` | WAITING_PRIORITY | PATIENT_CARDS: top 1 by priority score |

### Patients in Queue — Guides

| User input | Intent | Response |
|---|---|---|
| `comment ajouter un patient en attente` | GUIDE_ADD_WAITING | Guide: 5 steps |
| `comment prioriser un patient` | GUIDE_PRIORITIZE | Guide: 4 steps |
| `comment assigner une unité à un patient` | GUIDE_ASSIGN_UNIT | Guide: 5 steps |
| `comment voir les patients en attente` | GUIDE_VIEW_WAITING | Guide: 3 steps |
| `comment filtrer par urgence` | GUIDE_FILTER_URGENCY | Guide: 3 steps |
| `comment mettre à jour le statut d'un patient` | GUIDE_UPDATE_STATUS | Guide: 4 steps |

### Patient Records

| User input | Intent | Response |
|---|---|---|
| `comment créer un nouveau patient` | PATIENT_CREATE | Guide: 6 steps with MRD format tip + warnings |
| `comment enregistrer un dossier patient` | PATIENT_CREATE | Guide: 6 steps |
| `comment congédier un patient` | PATIENT_DISCHARGE | Guide: 5 steps with DAMA warning |
| `où est le patient Dupont` | PATIENT_SEARCH | TEXT: explains MRD search |
| `quel lit pour MRD-2024-001` | PATIENT_SEARCH | TEXT: explains MRD search |

### Diagnosis → Unit Lookup

| User input | Intent | Response |
|---|---|---|
| `insuffisance cardiaque` / `infarctus` / `cardio` / `AVC` | DIAGNOSIS_LOOKUP | Guide: full diagnosis-unit mapping table |
| `insuffisance rénale` / `dialyse` / `néphro` | DIAGNOSIS_LOOKUP | Guide: full diagnosis-unit mapping table |
| `soins intensifs` / `patient instable` / `ventilé` / `intubé` | DIAGNOSIS_LOOKUP | Guide: full diagnosis-unit mapping table |
| `post-op` / `fracture` / `appendicite` / `orthopédie` | DIAGNOSIS_LOOKUP | Guide: full diagnosis-unit mapping table |
| `quelle unité pour ce diagnostic` | DIAGNOSIS_LOOKUP | Guide: full diagnosis-unit mapping table |
| `quelle unité pour insuffisance cardiaque` | UNIT_MATCHING | METRIC: recommended unit + available beds (live) |

### Transfers — Live Data

| User input | Intent | Response |
|---|---|---|
| `liste des transferts` / `voir tous les transferts` | TRANSFER_LIST | TABLE: today's and pending transfers |
| `transferts du jour` / `transferts en attente` | TRANSFER_LIST | TABLE: today's and pending transfers |
| `délai des transferts` / `retard de transfert` | TRANSFER_DELAYS | TABLE: same as TRANSFER_LIST |
| `statut du transfert du patient MRD-001` | TRANSFER_STATUS | TABLE: transfers for that specific patient |

### Transfers — Guides

| User input | Intent | Response |
|---|---|---|
| `comment créer un transfert` | GUIDE_CREATE_TRANSFER | Guide: 6 steps |
| `comment gérer un transfert sortant` | GUIDE_OUTGOING_TRANSFER | Guide: 5 steps |
| `comment accueillir un transfert entrant` | GUIDE_ASSIGN_INCOMING | Guide: 5 steps |
| `comment réserver un lit pour un transfert` | GUIDE_RESERVE_TRANSFER | Guide: 4 steps |
| `comment modifier un transfert` | GUIDE_CHANGE_TRANSFER | Guide: 5 steps |
| `comment annuler un transfert` | GUIDE_CANCEL_TRANSFER | Guide: 4 steps |
| `comment confirmer l'arrivée d'un patient` | GUIDE_CONFIRM_ARRIVAL | Guide: 5 steps |

### Alerts — Live Data

| User input | Intent | Response |
|---|---|---|
| `alertes critiques` / `situation critique` | ALERT_CRITICAL | ALERT: ELEVE patients waiting > 30min + units ≥ 95% |
| `unité en saturation` / `alerte saturation` | ALERT_SATURATION | ALERT: units at saturation |
| `patients qui attendent trop longtemps` | ALERT_WAIT_TOO_LONG | ALERT: patients past max wait threshold |

### Alerts — Guides

| User input | Intent | Response |
|---|---|---|
| `comment gérer une alerte` | GUIDE_HANDLE_ALERT | Guide: 4 steps |
| `comment voir les alertes` | GUIDE_VIEW_ALERTS | Guide: 3 steps |
| `comment résoudre une alerte` | GUIDE_RESOLVE_ALERT | Guide: 3 steps |
| `comment identifier les patients urgents` | GUIDE_IDENTIFY_URGENT | Guide: 3 steps |
| `comment vérifier la saturation` | GUIDE_CHECK_SATURATION | Guide: 3 steps |

### Statistics

| User input | Intent | Response |
|---|---|---|
| `taux d'occupation global` | STATS_OCCUPANCY | TABLE: occupancy % per unit |
| `nombre d'admissions cette semaine` | STATS_ADMISSIONS | CHART_DATA: bar chart — admissions per day (7 days) |
| `durée moyenne de séjour` / `LOS` | STATS_LOS | TABLE: avg LOS hours per unit (discharged patients) |
| `taux de DAMA` / `départs contre avis médical` | STATS_DAMA | METRIC: DAMA count, total discharged, DAMA % |
| `tendances` / `évolution des admissions` | STATS_TRENDS | CHART_DATA: line chart — admissions per day (30 days) |

### Dashboard — Guides

| User input | Intent | Response |
|---|---|---|
| `comment lire le tableau de bord` | GUIDE_READ_DASHBOARD | Guide: 4 steps |
| `comment voir les statistiques hebdomadaires` | GUIDE_WEEK_STATS | Guide: 4 steps |
| `comment analyser les admissions` | GUIDE_ANALYZE_ADMISSIONS | Guide: 4 steps |
| `comment identifier les cas difficiles` | GUIDE_IDENTIFY_DIFFICULT | Guide: 4 steps |
| `comment anticiper les besoins en lits` | GUIDE_ANTICIPATE_BEDS | Guide: 4 steps |

### Forecasts & Predictions

| User input | Intent | Response |
|---|---|---|
| `prévision pour aujourd'hui` / `estimer les besoins ce soir` | FORECAST_TODAY | METRIC: estimated discharges 0–24h, net bed balance |
| `prévision pour demain` | FORECAST_TOMORROW | METRIC: estimated discharges 24–48h, net bed balance |
| `risque de saturation bientôt` | FORECAST_RISK | TABLE: current saturation risk per unit |

### Operational Analysis

| User input | Intent | Response |
|---|---|---|
| `goulot d'étranglement` / `bottleneck` / `unité engorgée` | OPS_BOTTLENECK | TABLE: top 3 units by composite bottleneck score |
| `qu'est-ce qui bloque` / `cause du blocage` | OPS_BLOCKER | METRIC: detailed analysis of worst unit |
| `qui doit intervenir` / `qui contacter` | OPS_WHO_INTERVENE | TABLE: same as OPS_BOTTLENECK |

### Advanced Scenarios — Guides

| User input | Intent | Response |
|---|---|---|
| `que faire si patient critique en attente` | GUIDE_CRITICAL_WAIT | Guide: 4 steps |
| `que faire en cas de pénurie de lits` | GUIDE_BED_SHORTAGE | Guide: 5 steps |
| `comment gérer plusieurs patients urgents` | GUIDE_MULTI_PRIORITY | Guide: 4 steps |
| `comment choisir la bonne unité` | GUIDE_CHOOSE_UNIT | Guide: 4 steps |
| `comment optimiser la gestion des lits` | GUIDE_OPTIMIZE | Guide: 4 steps |

### AI & Advanced Analytics

| User input | Intent | Response |
|---|---|---|
| `générer une stratégie` / `plan d'action global` | AI_STRATEGY | ALERT: prioritized recommendation list |
| `risque de détérioration` / `patient qui se dégrade` | AI_DETERIORATION | PATIENT_CARDS: top 5 admitted patients with risk scores |
| `optimiser les attributions` / `meilleure répartition` | AI_OPTIMIZE | TABLE: proposed patient-to-bed assignments |
| `simuler l'admission de 5 patients` / `impact si on admet` | AI_SIMULATE | METRIC: per-unit impact of N new admissions |
| `proposer une réorganisation` / `redistribuer les patients` | AI_REORGANIZE | TABLE: proposals to move patients between units |

### Direct Actions (Require Confirmation)

| User input | Intent | Response |
|---|---|---|
| `assigner le lit 12 au patient MRD-001` | ACTION_ASSIGN_BED | ACTION_CONFIRM → on confirm: sets bed OCCUPIED + updates patient |
| `réserver un lit` | ACTION_RESERVE_BED | ACTION_CONFIRM → on confirm: sets bed to READY |
| `créer un nouveau transfert` | ACTION_CREATE_TRANSFER | ACTION_CONFIRM → on confirm: directs to Transferts page |
| `marquer la situation comme critique` | ACTION_MARK_CRITICAL | ACTION_CONFIRM → on confirm: logs to audit table |
| `modifier le statut du transfert` | ACTION_UPDATE_TRANSFER | ACTION_CONFIRM → on confirm: updates transfer status |

### Fallback

| User input | Intent | Response |
|---|---|---|
| Anything not matched | UNKNOWN | TEXT: categorized menu of all capabilities |

---

## 10. Diagnosis → Unit Mapping

Used by `UNIT_MATCHING` (live bed availability query) and `DIAGNOSIS_LOOKUP` (guide):

| Keyword | Unit | Unit Name |
|---|---|---|
| cardiaque, cardiologie, fibrillation, embolie | 2N | Cardiologie |
| aki, rénal, renal, néphro, nephro, insuffisance rénale | 3N | Néphrologie |
| sepsis, choc, soins intensifs, critique, réanimation | 2S | Soins Intensifs |
| avc, pneumonie, diabète, diabete, cellulite, médecine | 3S | Médecine Générale |
| fracture, chirurgie, post-op | CHIR | Chirurgie |

Urgence (URG) is not in this map — it is used as a triage/initial assessment unit, not matched by diagnosis keyword.

---

## 11. GuideResponse Structure

```java
// com.hoscor.dto.GuideResponse
public class GuideResponse {
    String title;             // Card heading
    String section;           // Application section name
    String sectionRoute;      // Navigation path (e.g. "/gestion-lits")
    String context;           // Optional: when/why to use this guide
    List<String> steps;       // Ordered step list (supports **bold** markers)
    String tip;               // Practical tip
    List<String> smartSuggestions;  // Optional: clickable follow-up questions
    List<String> decisionRules;     // Optional: logic-based rules
    List<String> warnings;          // Optional: things to avoid
    List<String> troubleshooting;   // Optional: error causes and fixes
    List<String> relatedActions;    // Clickable follow-up questions
}
```

```typescript
// src/types/chatbot.ts
interface GuideResponse {
  title: string
  section: string
  sectionRoute: string
  context?: string
  steps: string[]
  tip: string
  smartSuggestions?: string[]
  decisionRules?: string[]
  warnings?: string[]
  troubleshooting?: string[]
  relatedActions: string[]
}
```

---

## 12. Action Confirmation Flow

```
User: "assigner le lit 12 au patient MRD-2024-015"
         │
         ▼
IntentRouter → ACTION_ASSIGN_BED
         │
         ▼
ChatbotController.route() returns:
  { type: ACTION_CONFIRM,
    message: "Voulez-vous attribuer un lit? Précisez l'ID du lit et le numéro de civière.",
    actionType: "ACTION_ASSIGN_BED" }
         │
         ▼
Frontend: ActionConfirmCard renders summary + Confirmer / Annuler
         │
    ┌────┴────┐
    │         │
  Annuler   Confirmer
    │         │
    ▼         ▼
"Action   POST /api/chatbot/action/confirm
annulée."  { actionType: "ACTION_ASSIGN_BED",
             params: { bedId: 12, mrd: "MRD-2024-015" } }
              │
              ▼
         executeAction()
           bed.setState(OCCUPIED) → bedRepository.save(bed)
           patient.setBedNumber() → patientRepository.save(patient)
              │
              ▼
         logAudit(SUCCESS)  →  action_audit_log table
              │
              ▼
         TEXT: "Lit 2N-04 attribué à Jean Dupont ✓"
```

---

## 13. Caching

`BedIntelligenceService` uses Spring Cache with Caffeine:

```yaml
# application.yml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=500,expireAfterWrite=30s
```

Cached methods (key = method name):
- `getAvailableBedCount()`
- `getSaturationStatus()`
- `getReservedUnoccupied()`
- `getCleaningBeds()`
- `getOccupancyRate()`

Methods in `PatientFlowService` and `DecisionEngineService` are **not cached** — they execute fresh queries on every request.

---

## 14. Security

All chatbot endpoints require authentication:

```java
// SecurityConfig.java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
    .requestMatchers("/api/**").authenticated()
)
```

The frontend injects the JWT token automatically via Axios interceptor:

```typescript
// src/api/client.ts
client.interceptors.request.use(config => {
  const token = localStorage.getItem('hoscor_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

If a 401 or 403 is received, the interceptor removes the token from localStorage and redirects to `/login`.

---

## 15. Data Flow Diagram

```
┌──────────┐    POST /api/chatbot/send     ┌──────────────────────┐
│  User    │ ─────────────────────────────▶│  ChatbotController   │
│  Input   │    { message: "..." }         │                      │
└──────────┘                               │  1. intentRouter     │
                                           │     .detectIntent()  │
                                           │                      │
                                           │  2. route(intent)    │
                                           │     ├─ BedIntelligenceService  ──▶ PostgreSQL (beds)
                                           │     ├─ PatientFlowService      ──▶ PostgreSQL (patients, stretchers)
                                           │     ├─ DecisionEngineService   ──▶ PostgreSQL (all tables)
                                           │     └─ GuideService            ──▶ (no DB — hardcoded)
                                           │                      │
                                           │  3. toDto()          │
                                           │     IntelligenceResult → ChatbotResponseDto
                                           └──────────┬───────────┘
                                                      │
                                           ApiResponse<ChatbotResponseDto>
                                                      │
                                           ┌──────────▼───────────┐
                                           │  ResponseRenderer    │
                                           │  switch(type)        │
                                           │  ├─ TEXT    ──▶ <p>  │
                                           │  ├─ METRIC  ──▶ grid │
                                           │  ├─ TABLE   ──▶ <table>
                                           │  ├─ ALERT   ──▶ box  │
                                           │  ├─ PATIENT_CARDS ──▶ PatientRow
                                           │  ├─ CHART_DATA ──▶ recharts
                                           │  ├─ ACTION_CONFIRM ──▶ ActionConfirmCard
                                           │  └─ GUIDE  ──▶ GuideCard
                                           └──────────────────────┘
```
