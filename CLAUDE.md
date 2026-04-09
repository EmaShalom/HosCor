# HosCor — CLAUDE.md

Hospital bed and patient coordination system for Application de gestion hospitalière (Quebec).
All user-facing strings and UI labels are in **Canadian French**.

## Stack

| Layer | Tech |
|---|---|
| Backend | Java 17 · Spring Boot 3.2 · PostgreSQL 14 · JWT (JJWT) · Caffeine cache |
| Frontend | React 18 · TypeScript · Vite 5 · Tailwind CSS · TanStack Query · Axios |
| Database | PostgreSQL 16 (Docker), schema + seed auto-loaded on backend start |

## Running (Docker — simplest)

```bash
cp .env.example .env          # first time only
docker compose up --build
```

- Frontend → http://localhost
- Backend  → http://localhost:8080
- Login    → `admin` / `password`

## Running (local dev)

**Prerequisites:** Java 17+, Maven 3.9+, Node 20+, PostgreSQL running locally

```bash
# 1 — database (Docker shortcut)
docker run -d --name hoscor-pg \
  -e POSTGRES_DB=hoscor \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine

# 2 — backend (schema + seed auto-run on startup)
cd hoscor-backend
mvn spring-boot:run

# 3 — frontend (proxies /api → localhost:8080)
cd hoscor-frontend
npm install
npm run dev           # http://localhost:5173
```

## Seed credentials (all use password `password`)

| Username | Role | Access |
|---|---|---|
| `admin` | ROLE_ADMIN | Everything |
| `coord1` | ROLE_COORDONNATEUR | Dashboard, transfers, admissions, reports |
| `urgence1` | ROLE_URGENCE | Urgence page |
| `gestlit1` | ROLE_GESTIONNAIRE_LIT | Bed management |
| `hygiene1` | ROLE_HYGIENE | Hygiene page |
| `commis_2n` | ROLE_COMMIS_ETAGE | Bed management (unit 2N) |
| `chef_3n` | ROLE_CHEF_UNITE | Multi-page access (unit 3N) |

## Hospital units

| Code | Name | Beds |
|---|---|---|
| 2N | Cardiologie | 18 |
| 3N | Néphrologie | 16 |
| 2S | Soins Intensifs | 10 |
| 3S | Médecine Générale | 20 |
| URG | Urgence | 12 |
| CHIR | Chirurgie | 16 |

## Key paths

```
hoscor-backend/
  src/main/java/com/hoscor/
    controller/      # 11 REST controllers
    service/         # DashboardService, DecisionEngineService, BedIntelligenceService,
                     # PatientFlowService, ShiftReportService, GuideService, IntentRouter …
    domain/entity/   # Bed, Patient, Stretcher, Transfer, Attribution, AppUser …
    domain/repository/
    dto/
  src/main/resources/
    application.yml
    db/schema.sql    # idempotent, auto-run on startup
    db/seed.sql      # idempotent (ON CONFLICT DO NOTHING / DO UPDATE)

hoscor-frontend/
  src/
    api/             # client.ts + 7 typed API modules
    pages/           # 17 pages (Login, VueEnsemble, Coordonnateur, Transferts …)
    components/      # layout/, common/, chatbot/
    hooks/           # useAuth, useDashboard, useBeds, useAlerts
    types/           # TypeScript interfaces
    i18n/locales/    # fr.ts + en.ts
```

## API conventions

- All REST responses: `ApiResponse<T> { success, data, error }`
- Base URL in dev: `/api` (Vite proxies to `:8080`)
- Auth: `Authorization: Bearer <jwt>` header (set automatically by `api/client.ts`)
- Public endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/validate`

## TransferType enum

Use exactly `ENTRANT` or `SORTANT` (frontend and backend must match).

## Account validation / password reset (dev)

Tokens are printed to the backend **log** (no email in dev):
```
=== ACCOUNT VALIDATION TOKEN for 'jsmith': <uuid> ===
=== PASSWORD RESET TOKEN for 'jsmith': <uuid> ===
```
Pass the token to `POST /api/auth/validate` or `POST /api/auth/reset-password`.

## Chatbot intent system

`IntentRouter` matches text input to one of ~80 `ChatbotIntent` enum values and
dispatches to `BedIntelligenceService`, `PatientFlowService`, or `DecisionEngineService`.
`GuideService` provides 50+ step-by-step guides returned as `ResponseType.GUIDE`.

## Cache

Caffeine cache: 500 entries, 30 s TTL. Annotated with `@Cacheable(value = "bedStats", …)`.
Cache is auto-invalidated at expiry; no manual eviction needed for normal operations.

## Environment variables

| Variable | Default (local dev) | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/hoscor` | DB URL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `0000` | DB password |
| `JWT_SECRET` | `hoscor-super-secret-key-2024-cisss-outaouais-hospital-coord` | JWT signing key |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |
| `VITE_API_BASE` | *(unset)* | Render only — set to backend public URL |
