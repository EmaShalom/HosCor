# HosCor — Complete Interface Documentation
## Frontend Development Prompt

> **Application**: HosCor  
> **Organization**: Application de gestion hospitalière  
> **Type**: Hospital bed and patient coordination dashboard  
> **Target Stack**: React + TypeScript + Tailwind CSS  
> **Language**: Canadian French (UI labels kept as-is from screenshots)  
> **Reference Period**: Week of April 7–13, 2025  
> **Number of interfaces**: 11 pages + 1 shared sidebar

---

## 1. GLOBAL DESIGN SYSTEM

### 1.1 Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary navy | `#1E3A5F` | Sidebar background, dark header |
| Blue accent | `#2563EB` | CTA buttons, Cardiology bars, active tab |
| Green accent | `#16A34A` | Available beds, Ready status, Low risk |
| Orange accent | `#EA580C` | Medium risk, DAMA, moderate alerts |
| Red accent | `#DC2626` | HIGH priority, critical saturation, high risk |
| Purple accent | `#7C3AED` | AI & predictions, risk scores, Nephrology |
| Teal accent | `#0D9488` | Intensive care bars, transfers |
| Yellow accent | `#CA8A04` | Warnings, cleaning in progress |
| Page background | `#F8F9FA` | General background for light pages |
| Card background | `#FFFFFF` | Cards and panels |
| Dark background | `#1A2535` | Floor Display (night mode) |
| Primary text | `#111827` | Titles, important data |
| Secondary text | `#6B7280` | Subtitles, metadata |
| Border | `#E5E7EB` | Card separators |

### 1.2 Typography

- **Font**: Inter (system sans-serif fallback)
- **Page titles**: 18px, font-weight 500, `#111827`
- **Page subtitle**: 13px, `#6B7280` (e.g. "Hôpital, semaine du 7 au 13 avril 2025")
- **Large KPI numbers**: 36–48px, font-weight 700, thematic color
- **Section labels**: 11px, UPPERCASE, font-weight 600, `#9CA3AF`, letter-spacing 0.08em
- **Body text**: 13–14px, font-weight 400
- **Badges**: 11px, font-weight 600, border-radius 4px, padding 2px 6px

### 1.3 Page Header (TopBar)

Present on all pages (except Floor Display which has its own header):

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ [Page Title] — Hôpital, semaine du 7 au 13 avril 2025   [⚠ 3 patients ÉLEVÉE]  [Lundi 13 avril 2025 · 08h14] │
└───────────────────────────────────────────────────────────────────────────────────┘
```

- White background, bottom border `1px #E5E7EB`, height 52px
- Title: 18px semi-bold black | Subtitle: 13px gray, separated by " — "
- Alert button: background `#FEF2F2`, border `#FCA5A5`, text `#DC2626`, icon ⚠️, border-radius 6px
- Date button: background `#F9FAFB`, border `#E5E7EB`, text `#374151`, border-radius 6px

### 1.4 KPI Card Component

Reused on almost every page, always in a horizontal row of 4 or 5:

```
┌───────────────────────────┐
│ LABEL (11px gray uppercase)│
│                           │
│  Value (40px bold colored) │
│                           │
│ sub-text (12px gray)      │
└───────────────────────────┘
```
- White background, border `1px #E5E7EB`, border-radius 12px, padding 20px
- Equal flex-grow between cards, gap 16px
- Value colored by context (blue, green, red, orange, purple)

### 1.5 Status Badges

| Badge (FR label) | Background | Text | Usage |
|-------|------|-------|-------|
| `Hospitalisé` (Admitted) | `#DBEAFE` | `#1D4ED8` | Admissions & records |
| `Congé` (Discharged) | `#F3F4F6` | `#374151` | Admissions & records |
| `À nettoyer` (To clean) | `#FEE2E2` | `#DC2626` | Hygiene |
| `En cours` (In progress) | `#FEF3C7` | `#CA8A04` | Hygiene |
| `Prêt` (Ready) | `#DCFCE7` | `#16A34A` | Hygiene |
| `ÉLEVÉ` (HIGH) | `#FEE2E2` | `#DC2626` | ER, AI |
| `MOYEN` (MEDIUM) | `#FEF3C7` | `#CA8A04` | ER |
| `FAIBLE` (LOW) | `#DCFCE7` | `#16A34A` | ER |
| `Quotidien` (Daily) | `#DBEAFE` | `#2563EB` | Reports center |
| `Temps réel` (Real-time) | `#F3E8FF` | `#7C3AED` | Reports center |
| `Hebdomadaire` (Weekly) | `#FEF9C3` | `#CA8A04` | Reports center |
| `En transit` (In transit) | `#FEF3C7` | `#CA8A04` | Transfers |
| `Planifié` (Planned) | `#F3F4F6` | `#374151` | Transfers |

---

## 2. SIDEBAR (Left Navigation)

- **Width**: 220px fixed, height 100vh
- **Background**: `#1E2D3D`
- **Position**: fixed left

### Structure

```
┌─────────────────────────┐
│ 🟣 HosCor           │  16px bold white
│    Application de gestion hospitalière │  11px light gray
├─────────────────────────┤
│ Semaine du 7–13 avr 2025│  13px bold light blue #60A5FA
├─────────────────────────┤
│ TABLEAUX DE BORD        │  10px uppercase #9CA3AF
│   (DASHBOARDS)          │
│ 📊 Vue d'ensemble       │  (Overview)
│ 👤 Coordonnateur        │  (Coordinator)
│ 🔄 Transferts &     [3] │  red circle badge
│    Rapatriements        │  (Transfers & Repatriations)
├─────────────────────────┤
│ INTERFACES MÉTIER       │  10px uppercase #9CA3AF
│   (CLINICAL INTERFACES) │
│ 📋 Admissions & dossiers│  (Admissions & Records)
│ 🚨 Urgence         [12] │  (Emergency) red circle badge
│ 🛏  Gestion des lits    │  (Bed Management)
│ 📺 Affichage étage      │  (Floor Display)
│ 🧹 Hygiène & salubrité  │  (Hygiene & Sanitation)
│ ☀️  Station matinale     │  (Morning Station)
├─────────────────────────┤
│ INTELLIGENCE            │  10px uppercase #9CA3AF
│ ARTIFICIELLE            │  (ARTIFICIAL INTELLIGENCE)
│                         │
│ 🤖 IA & prédictions     │  ← active item = bg #2563EB, radius 8px
│   (AI & Predictions)    │
├─────────────────────────┤
│ RAPPORTS                │  10px uppercase #9CA3AF
│   (REPORTS)             │
│ 📄 Centre de rapports   │  (Reports Center)
└─────────────────────────┘
```

- Active item: background `#2563EB`, border-radius 8px, white text
- Hover: background `rgba(255,255,255,0.08)`, transition 150ms
- Badges: circle `#DC2626`, 18px diameter, white text 11px bold
- Icons: 16px, left-aligned with 10px gap from text

---

## 3. PAGE: VUE D'ENSEMBLE (Overview)

**Purpose**: Main dashboard. First screen seen on load. Global weekly hospital summary.

### 5 KPI Cards (top row)

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| TAUX D'OCCUPATION (Occupancy rate) | 68% | `#2563EB` blue | 41 / 60 beds occupied |
| EN ATTENTE DE LIT (Waiting for bed) | 12 | `#EA580C` orange | ER stretchers |
| RISQUE ÉLEVÉ (High risk) | 6 | `#DC2626` red | Critical patients |
| CONGÉS CETTE SEMAINE (Discharges this week) | 19 | `#16A34A` green | Beds freed |
| DURÉE MOY. SÉJOUR (Avg. stay) | 6.4j | `#7C3AED` purple | Median: 5 days |

### 2-Column Layout (main section)

**Left column — Unit Occupancy**

Title: "Occupation par unité" + badge "4 unités" (gray, top right)

4 horizontal progress bars:
```
2e Nord — Cardio   ████████████░░░░░░░░  9 / 15
2e Sud — Soins int.████████████████░░░░ 10 / 15
3e Nord — Néphro   ████████████████████ 12 / 15
3e Sud — Méd. gén. █████████████░░░░░░░ 10 / 15
```
- Bar colors: Blue `#2563EB` (Cardio), Orange-red `#EF4444` (ICU), Purple `#7C3AED` (Nephro), Green `#16A34A` (Med. gen.)
- Bar background: `#E5E7EB`
- X/15 value shown right in gray 12px
- Card: white bg, border-radius 12px, border `1px #E5E7EB`, padding 20px

**Left column — Main Diagnoses**

Title: "Diagnostics principaux"

```
ACS           ████████████████░░░  39 cases
Heart Failure ██████░░░░░░░░░░░░░  17 cases
AKI           ███░░░░░░░░░░░░░░░░   3+ cases
Others        ██░░░░░░░░░░░░░░░░░   —
```
- Colors: Blue, Orange-red, Purple, Gray
- Values right-aligned, 12px gray

**Right column — Weekly Admissions**

Title: "Admissions — semaine" + badge "7 jours" (gray)

Vertical bar chart — 7 days (Mon → Sun):
```
         12
    9        7           8        10
                                       7    7
   [Mon][Tue][Wed]    [Thu][Fri]    [Sat][Sun]
```
- Bars: light blue `#BFDBFE`, hover blue `#2563EB`
- Values above bars, 12px gray
- Subtle axes, no aggressive gridlines
- Bottom row: Total admissions **60** (black bold) | Emergency **72%** (red) | OPD **28%** (blue)

**Right column — Weekly Results**

Title: "Résultats — semaine"

```
Congé / DISCHARGE    87%   ████████████████████
Décès / EXPIRY        7%   ██░░░░░░░░░░░░░░░░░░
DAMA                  6%   █░░░░░░░░░░░░░░░░░░░
```
- Yellow alert box at bottom: "⚠️ DAMA = Départ contre avis médical. 6% à surveiller — risque réadmission élevé."
  - Background `#FEFCE8`, border `#FDE047`, text `#CA8A04`, border-radius 8px, padding 12px

---

## 4. PAGE: COORDONNATEUR (Coordinator)

**Purpose**: Coordinator's operational view. Real-time supervision of all floors + inter-facility transfer management.

### 4 KPI Cards

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| LITS DISPONIBLES (Available beds) | 19 | `#2563EB` blue | out of 60 total |
| EN ATTENTE (CIVIÈRE) (Waiting - stretcher) | 12 | `#EA580C` orange | need assignment |
| CRITIQUES (Critical) | 6 | `#DC2626` red | high risk |
| CONGÉS PRÉVUS 24H (Planned discharges 24h) | 7 | `#16A34A` green | beds freed tomorrow |

### 4-Unit Grid (2×2)

Each unit card:
```
┌──────────────────────────────────────────────────┐
│ [icon] 2e Nord — Cardiologie        9/15 occupés │  ← colored badge top right
│                                                  │
│ 6 lits disponibles · Diagnostics: ACS, STEMI, AF, VT │
│                                                  │
│ Occupation  ████████████████░░░░░░░░░░░░░░  60%  │
└──────────────────────────────────────────────────┘
```

| Unit | Badge | Bar color | % |
|------|-------|-----------|---|
| 2e Nord — Cardiologie | `9/15 occupés` blue | `#2563EB` | 60% |
| 2e Sud — Soins intensifs | `10/15 occupés` red | `#EF4444` | 67% |
| 3e Nord — Néphrologie | `12/15 occupés` orange | `#F97316` | 80% |
| 3e Sud — Médecine gén. | `10/15 occupés` green | `#16A34A` | 67% |

- Centered hint text below grid: "Cliquez sur une unité pour voir les lits en détail" (12px gray italic)
- Cards are clickable → hover light shadow, cursor pointer

### Section: Inter-Facility Transfers & Repatriations

Title + buttons on right:
- `3 rapatriements attendus` (blue text)
- `2 transferts sortants` (purple text)
- `+ Nouveau` (blue filled button)

**Tabs**:
- `🔄 Rapatriements entrants (3)` ← active, blue underline
- `🔄 Transferts sortants (2)`

**Table columns**:
`ÉTABLISSEMENT D'ORIGINE | PATIENT | ÂGE | DIAGNOSTIC | UNITÉ PRÉVUE | ARRIVÉE PRÉVUE | LIT RÉSERVÉ | STATUT | ACTION`

Row 1:
- CH Gatineau (blue link) | MRD-EXT-001 | 68 ans · M | ACS — STEMI | badge `2e Nord — Cardio` blue | Aujourd'hui 14h00 (bold) | green badge `Lit 7 réservé` | `En transit 🔄` orange | text button "Dossier"

Row 2:
- Hôp. Pontiac (blue link) | MRD-EXT-002 | 54 ans · F | AKI sévère — Créatinine ↑↑ | badge `3e Nord — Néphro` purple | Demain 09h00 (bold red) | red badge `Aucun lit dispo ⚠️` | `En attente lit` red | blue filled button "Réserver lit"

Row 3:
- CH Papineau (blue link) | MRD-EXT-003 | 77 ans · M | Heart Failure — décompensée | badge `2e Sud — Soins int.` red | Demain 15h30 | "Non assigné" gray | `Planifié` gray | text button "Planifier"

**Bottom alert**:
Background `#FEFCE8`, border `#FDE047`, icon ⚠️ orange:
"MRD-EXT-002 arrives tomorrow in Nephro — unit at 80% capacity. Check for early discharge or internal transfer before 5pm today."

---

## 5. PAGE: TRANSFERTS & RAPATRIEMENTS (Transfers & Repatriations)

**Purpose**: Dedicated detailed management of all inter-facility movements. Card-by-card view, more detailed than the Coordinator's table.

### 4 KPI Cards

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| RAPATRIEMENTS ENTRANTS (Incoming repatriations) | 3 | `#2563EB` blue | This week |
| TRANSFERTS SORTANTS (Outgoing transfers) | 2 | `#7C3AED` purple | To other facilities |
| LITS À RÉSERVER (Beds to reserve) | 1 | `#DC2626` red | Urgent action required |
| LITS LIBÉRÉS / SOIRÉE (Beds freed / evening) | 1 | `#16A34A` green | Following outgoing transfer |

### Main Section

Title: "🔄 Transferts & Rapatriements inter-établissements"
Top-right button: `+ Nouveau mouvement` (blue filled)

**Tabs**:
- `🔄 Rapatriements entrants 3` ← active, blue underline
- `🔄 Transferts sortants 2`

Descriptive italic gray text below tabs: "Patients rapatriés d'autres établissements vers notre hôpital — lit à réserver à l'avance avant l'arrivée"

### Repatriation Cards (one per patient, stacked vertically)

**Card 1 — MRD-EXT-001** (blue left border, white background):
```
┌──────────────────────────────────────────────────────────────────────┐
│ [🔄 Rapatriement] [✓ Lit 7 réservé] [🔄 En transit]   [Voir dossier]│
│                                                                      │
│ MRD-EXT-001 · Homme 68 ans                                          │
│                                                                      │
│ Établissement:      Diagnostic:            Unité de destination:     │
│ CH Gatineau         ACS — STEMI            2e Nord — Cardiologie     │
│                                                                      │
│ Arrivée prévue:     Lit assigné:           Contact coordo:           │
│ Aujourd'hui 14h00   Lit 7 — réservé        819-555-0101              │
│                     (green)                                          │
│                                                                      │
│ 📄 Notes: Patient stable, STEMI treated at CH Gatineau. Family       │
│    reunification in Outaouais. File sent by fax + secure email.      │
└──────────────────────────────────────────────────────────────────────┘
```
- Header badges: `Rapatriement` (blue), `Lit 7 réservé ✓` (green), `En transit` (orange)
- 3-column grid layout for info fields
- Notes section: very light gray background `#F9FAFB`, 12px italic

**Card 2 — MRD-EXT-002** (red left border, very light pink background `#FFF5F5`):
```
┌──────────────────────────────────────────────────────────────────────┐
│ [🔄 Rapatriement] [⚠️ Aucun lit disponible]            [Réserver lit]│
│                                                         (blue btn)  │
│ MRD-EXT-002 · Femme 54 ans                                          │
│                                                                      │
│ Établissement:      Diagnostic:            Unité de destination:     │
│ Hôp. Pontiac        AKI sévère —           3e Nord — Néphrologie     │
│                     Créatinine ↑↑                                    │
│                                                                      │
│ Arrivée prévue:     Lit assigné:           Contact coordo:           │
│ Demain 09h00 (red)  Aucun — action requise 819-555-0202              │
│                     (red)                                            │
│                                                                      │
│ 🔴 Action requise: Néphro at 80% — check early discharges or        │
│    internal transfer before 5pm today to free a bed.                 │
└──────────────────────────────────────────────────────────────────────┘
```
- Card background: very light pink `#FFF5F5`
- Left border: 4px red `#DC2626`
- Bottom alert: background `#FEE2E2`, red text, icon 🔴

**Card 3 — MRD-EXT-003** (gray left border, white background):
```
[🔄 Rapatriement] [Non assigné] [Planifié]              [Planifier]
MRD-EXT-003 · Homme 77 ans
CH Papineau | Heart Failure décompensée | 2e Sud — Soins intensifs
Demain 15h30 | À planifier | 819-555-0303
```

---

## 6. PAGE: ADMISSIONS & DOSSIERS (Admissions & Records)

**Purpose**: Patient admission management and existing record editing. 3 modes via tabs.

### Tabs (no KPI cards on this page)

```
[🚨 Admission Urgence]  [🏥 Admission Étage]  [📁 Modifier un dossier ←active]
                                                ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
```
- Active tab: blue text `#2563EB`, 2px blue bottom underline
- Inactive tabs: gray text `#6B7280`

### Active Tab: Modifier un dossier (Edit a Record)

**Search block**:
Title: "🔍 Rechercher un patient à modifier"

```
┌───────────────────────┐ ┌──────────────────────────────────┐ ┌────────────┐ ┌────────┐
│ NO. MRD               │ │ NOM / PRÉNOM                     │ │ UNITÉ      │ │ STATUT │
│ [Ex : 316881    ]     │ │ [Ex : Tremblay            ]      │ │ [All  ▼]   │ │ [All ▼]│
└───────────────────────┘ └──────────────────────────────────┘ └────────────┘ └────────┘
```
- Inputs: white background, border `#D1D5DB`, border-radius 6px, gray placeholder
- Dropdowns: same style with ▼ chevron

**Results table**:

Column headers (uppercase 11px gray):
`MRD | ÂGE / SEXE | DIAGNOSTIC | UNITÉ · LIT | ADMISSION | STATUT | ACTION`

Rows (alternating white / `#F9FAFB`):

| MRD | Age/Sex | Diagnosis | Unit·Bed | Admission | Status | Action |
|-----|---------|-----------|----------|-----------|--------|--------|
| 316881 | 55a · F | HEART FAILURE | `2N` Bed 1 | 2025-04-07 | `Hospitalisé` | [Modifier] |
| 494270 | 58a · H | ACS | `2N` Bed 2 | 2025-04-08 | `Congé` | [Modifier] |
| 611713 | 61a · H | ACS | `2N` Bed 3 | 2025-04-09 | `Congé` | [Modifier] |
| 626855 | 75a · F | HEART FAILURE | `2S` Bed 1 | 2025-04-10 | `Hospitalisé` | [Modifier] |
| 439634 | 85a · H | VT | `2N` Bed 4 | 2025-04-11 | `Hospitalisé` | [Modifier] |

- Unit badge `2N` / `2S` / `3N` / `3S`: small, colored by floor, white text, border-radius 4px
- `Hospitalisé` badge: background `#DBEAFE`, text `#1D4ED8`
- `Congé` badge: background `#F3F4F6`, text `#374151`
- `Modifier` button: background `#2563EB`, white text, ✏️ icon, border-radius 6px, padding 6px 14px
- Row separator: `1px #E5E7EB`
- Row hover: background `#F0F9FF`

---

## 7. PAGE: URGENCE (Emergency)

**Purpose**: Real-time tracking of patients on stretchers waiting for a bed. Priority assignment.

### Status Bar (below header, above main section)

```
● 3 ÉLEVÉ   ● 3 MOYEN   ● 6 FAIBLE          12 patients sur civière · Semaine 7–13 avril
```
- Colored dots: red (HIGH), orange (MEDIUM), green (LOW)
- Right text: gray 13px

### Section: Zone civière — Patients en attente de lit

Title + button: `[Attribuer des lits →]` blue filled, top right

**Grid 4 columns × 3 rows** of stretcher cards:

Each card:
```
┌──────────────────────────────────────┐
│ Civière #X · MRD-XXXXXX              │  12px gray top
│                                      │
│ 🟡 XX years old                      │  emoji age icon
│ DIAGNOSIS                            │  14px bold
│ Target unit — Service                │  12px gray
│                                      │
│ [● HIGH / MEDIUM / LOW]              │  status badge
│ [🕐 Xh wait time]                   │  wait time badge
│                                      │
│ [    Attribuer un lit →    ]         │  outline blue button
└──────────────────────────────────────┘
```

**Card border color by priority**:
- HIGH → border `2px #DC2626`, background very light pink `#FFF5F5`
- MEDIUM → border `2px #CA8A04`, background very light yellow `#FFFBEB`
- LOW → border `2px #16A34A`, background very light green `#F0FDF4`

**Wait time badge**: background `#FEF3C7`, text `#92400E`, icon 🕐, border-radius 12px

**Assign button**: outline blue `#2563EB`, blue text, transparent background, hover → blue background, white text

**12 stretchers documented**:
- Row 1 (HIGH): #10 MRD-247375 60y ACS 18h | #5 MRD-647323 63y ACS 8h | #7 MRD-689618 80y ACS 5h | #4 MRD-621211 22y HF 9h MEDIUM
- Row 2 (MEDIUM): #6 MRD-675736 35y ACS 8h | #11 MRD-575969 38y ACS 3h | #9 MRD-497428 40y ACS 22h LOW | #1 MRD-145703 53y STABLE ANGINA 21h LOW
- Row 3 (LOW): #12 MRD-638391 69y CVA 19h | #2 MRD-259711 53y ACS 4h | #8 MRD-271124 62y HF 4h | #3 MRD-363352 60y Other 1h

### Section: Priority-Sorted List (table)

Columns: `CIVIÈRE | MRD | ÂGE | DIAGNOSTIC | RISQUE | ATTENTE | UNITÉ CIBLE | ACTION`

- Auto-sorted: HIGH first, then MEDIUM, then LOW
- `[Attribuer]` blue filled button per row
- Colored RISK badge by level
- WAIT badge: light yellow background, brown text

---

## 8. PAGE: GESTION DES LITS (Bed Management)

**Purpose**: Visual floor plan view. Large colored tiles by status. Light mode (unlike Floor Display). Clickable for assignment.

### 5 KPI Cards

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| LITS OCCUPÉS (Occupied beds) | 9 | `#374151` dark gray | out of 15 |
| LITS DISPONIBLES (Available beds) | 6 | `#16A34A` green | ready to receive |
| ARRIVÉES PRÉVUES (Expected arrivals) | 9 | `#2563EB` blue | from emergency |
| RISQUE ÉLEVÉ (High risk) | 1 | `#DC2626` red | critical patients |
| CONGÉS PRÉVUS (Planned discharges) | 1 | `#CA8A04` orange | within 24h |

### Floor Tabs

```
[🩺 2e Nord — Cardiologie 9/15]  [🏥 2e Sud — Soins int. 10/15]  [🔬 3e Nord — Néphro 12/15]  [💊 3e Sud — Méd. gén. 10/15]
```
- Active tab: blue text, 2px blue underline
- X/15 counter: gray 12px inside the label

### Legend (below tabs)

```
□ Occupé  □ Risque élevé  □ Risque moyen  □ Disponible  □ Arrivée prévue
```
Small colored squares + 12px gray labels

### Bed Grid — Large Tiles (5 columns × N rows)

Each tile is large (~200×200px), colored background by status:

**Occupied tile — High risk**:
- Background: light pink `#FEE2E2`
- Indicator dot top right: red `#DC2626`
- Centered content: "Lit 1" (12px gray) / "F·55a" (14px bold) / "HEART FAILURE" (12px gray-red)

**Available tile**:
- Background: very light green `#DCFCE7`
- No indicator dot (or green)
- Centered content: "Lit 2" (12px gray) / "Disponible" (14px bold green `#16A34A`)

**Occupied tile — Medium risk**:
- Background: very light yellow `#FEF9C3`
- Indicator dot: orange `#CA8A04`
- Content: bed ID / sex·age / diagnosis (gray)

**Expected arrival tile**:
- Background: very light blue `#DBEAFE`
- Indicator dot: blue `#2563EB`
- Same content structure

- Tile hover: light box-shadow, cursor pointer
- Click → modal or side panel for assignment

---

## 9. PAGE: AFFICHAGE ÉTAGE (Floor Display)

**Purpose**: **Kiosk/wall-mounted** interface for the nursing station. Large screen, dark background, real-time. No sidebar visible (fullscreen).

### Specific Header (background `#1A2535`)

```
🟣 HosCor  |  2e Nord – Cardiologie                    |  13 h 36 min 18 s  | [Updates 15]
                   Affichage poste infirmier · Temps réel  |  mardi 31 mars 2026 |  [  5  ] ←green
```
- HH:MM:SS timer: 32px bold white, updated every second
- "Actus" (Updates) badge: green background `#16A34A`, white text, 14px

### Bed Status Bar (below header)

```
🛏 LITS   [6 LIBRES]   [9 OCCUPÉS]
```
- LIBRES badge: background `#16A34A`, white text, border-radius 6px
- OCCUPÉS badge: background `#2563EB`, white text

### Bed Grid — 5 columns × 3 rows (15 beds)

Global dark background `#1A2535`, bed cards with themed dark backgrounds:

**OCCUPIED BED card — High risk**:
- Background: very dark bordeaux `#4A1515`
- Indicator: red dot `#DC2626` top right
- Content: "LIT 1" (11px light gray) / partial MRD (14px bold white) / "F – 55 ans" (12px gray) / diagnosis badge on dark red background

**FREE BED card**:
- Background: very dark green `#14532D`
- Centered empty bed SVG icon (white, 24px)
- Text: "LIBRE" (12px light green `#86EFAC` bold)

**OCCUPIED BED card — Medium risk**:
- Background: dark brown/olive `#3D2B00`
- Indicator: orange dot `#F97316`
- Patient content visible

**OCCUPIED BED card — Stable**:
- Background: dark blue-gray `#1E3A5F`
- Indicator: blue dot or none
- Patient content

**Recent Assignment card**:
- Background: dark purple `#2D1B5E`
- Indicator: purple dot `#7C3AED`

### Right Panel: Available Beds (background `#0F1E2E`)

```
■ LITS DISPONIBLES

[Bed 2   Disponible]   ← green filled button
[Bed 3   Disponible]
[Bed 7   Disponible]
[Bed 11  Disponible]
[Bed 13  Disponible]
[Bed 14  Disponible]
```
- Buttons: background `#16A34A`, white text, border-radius 6px, full width

### Right Panel: Assignments (background `#0F1E2E`)

```
▲ ATTRIBUTIONS

    🛏 [animated bed icon]
    En attente
    Les attributions de lits
    apparaîtront ici
```
- Centered text, light gray, 12px italic

### Floor Navigation Bar (bottom, background `#0F1E2E`)

```
[● 2e Nord]  [● 2e Sud]  [● 3e Nord]  [● 3e Sud]
```
- Active: white background, `#1A2535` text, border-radius 20px
- Inactive: background `rgba(255,255,255,0.12)`, white text

### Legend (bottom left)

```
□ Libre  □ Occupé stable  □ Risque moyen  □ Risque élevé  □ Attribution récente
```
Dark background, light gray text 11px

---

## 10. PAGE: HYGIÈNE & SALUBRITÉ (Hygiene & Sanitation)

**Purpose**: Tracking post-discharge bed cleaning. Interface for the housekeeping team.

### 3 KPI Cards (not 4)

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| À NETTOYER (To clean) | 5 | `#DC2626` red | Beds waiting |
| EN COURS (In progress) | 2 | `#CA8A04` orange | Active cleaning |
| PRÊTS (Ready) | 3 | `#16A34A` green | Available |

### Main Section

Title: "✏️ Suivi des lits — Post-congé"
Right badge: "10 lits à traiter" (orange `#EA580C`)

**Bed list — each row**:

```
[Bed code] [MRD · age · Discharge YYYY-MM-DD          ] [Badge]  [Dropdown ▼]
           [Floor — Unit · Diagnosis: XXXXX             ]
```

Columns:
- **Bed code** (80px): e.g. `2N·L2`, `3S·L4` — gray 12px, left-aligned
- **Patient info** (flex):
  - L1: `MRD-XXXXXX · Xxa · Congé YYYY-MM-DD` — 14px semi-bold
  - L2: `Floor — Unit · Diagnostic: XXXXX` — 12px gray `#6B7280`
- **Status badge** (100px): colored by state
- **Dropdown** (140px): same value as badge, with ▼, editable

10 entries in the list:

| Code | Patient | Unit | Diagnosis | Status |
|------|---------|------|-----------|--------|
| 2N·L2 | MRD-494270 · 58a · Discharge 2025-04-10 | 2e Nord — Cardiologie | ACS | À nettoyer |
| 2N·L3 | MRD-611713 · 61a · Discharge 2025-04-12 | 2e Nord — Cardiologie | ACS | À nettoyer |
| 2S·L2 | MRD-238364 · 67a · Discharge 2025-04-09 | 2e Sud — Soins intensifs | HEART FAILURE | En cours |
| 3S·L4 | MRD-204703 · 71a · Discharge 2025-04-12 | 3e Sud — Médecine gén. | Other | En cours |
| 2N·L7 | MRD-401634 · 50a · Discharge 2025-04-11 | 2e Nord — Cardiologie | ACS | Prêt |
| 2N·L11 | MRD-387048 · 47a · Discharge 2025-04-10 | 2e Nord — Cardiologie | ACS | À nettoyer |
| 2S·L7 | MRD-344749 · 69a · Discharge 2025-04-12 | 2e Sud — Soins intensifs | HEART FAILURE | À nettoyer |
| 2N·L13 | MRD-409241 · 71a · Discharge 2025-04-12 | 2e Nord — Cardiologie | ACS | Prêt |
| 2N·L14 | MRD-294578 · 72a · Discharge 2025-04-13 | 2e Nord — Cardiologie | ACS | En cours |
| 2S·L9 | MRD-543789 · 55a · Discharge 2025-04-11 | 2e Sud — Soins intensifs | HEART FAILURE | Prêt |

---

## 11. PAGE: STATION MATINALE (Morning Station)

**Purpose**: Morning coordination meeting screen. Projectable view. Information-dense.

### Banner Header (blue gradient background)

```
┌──────────────────────────────────────────────────────────────────┐
│ ☀️ Réunion de coordination matinale                               │
│ Lundi 13 avril 2025 · 08h00 · Application de gestion hospitalière               │
│                                                                  │
│   60              41           68%            7                  │
│   Patients        Present      Occupancy      Planned            │
│   (week)          today        rate           discharges tmrw    │
└──────────────────────────────────────────────────────────────────┘
```
- Background: `#1E3A5F` → `#2563EB` (horizontal gradient)
- Title: 24px bold white
- Subtitle: 13px white semi-transparent
- Numbers: 36px bold white
- Labels: 12px white `opacity: 0.75`
- Border-radius 12px, padding 24px

### Section: Bed Availability — Current Status

Title: "🛏 Disponibilité des lits — État actuel"
Right badges: `19 lits libres au total` (green) | `12 en attente urgence` (red)

**4 side-by-side unit cards**:

```
┌──────────────────────┐
│ [icon] 2E NORD —    │  11px uppercase, unit color
│ CARDIOLOGIE         │
│                     │
│        6            │  36px bold unit color
│ lits disponibles    │  12px gray
│                     │
│ ████████░░░░░░░░░   │  unit-colored bar
│ 9 occupés   15 total│  11px gray
└──────────────────────┘
```

| Unit | Color | Available | Occupied |
|------|-------|-----------|----------|
| 2E NORD — CARDIOLOGIE | Pink `#EC4899` | 6 | 9/15 |
| 2E SUD — SOINS INT. | Red `#EF4444` | 5 | 10/15 |
| 3E NORD — NÉPHRO | Orange `#F97316` | 3 ⚠️ | 12/15 |
| 3E SUD — MÉD. GÉN. | Green `#16A34A` | 5 | 10/15 |

**3 summary cards** (below unit cards):
- `19 Lits libres total — sur 60 lits dans l'hôpital` → very light green `#F0FDF4`
- `12 Patients en attente — Sur civière à l'urgence` → light yellow `#FEFCE8`
- `3 Priorité ÉLEVÉE — Attribution urgente requise` → light red `#FEF2F2`

### Lower Section — 2 Columns

**Left — Previous Night Report**:
```
Admissions  ████████████████░░░░  +7 yesterday
Congés      ████████░░░░░░░░░░░░   5 yesterday
Transferts  ████░░░░░░░░░░░░░░░░       2
```
Green box: `✅ Bilan stable. Aucune saturation critique enregistrée hier.`

**Right — Unit Issues** (3 stacked colored boxes):
- Pink `#FFF5F5`: "3e Nord Néphro — 80% occupied. Only 3 beds available. 4 AKI patients waiting."
- Yellow `#FEFCE8`: "12 patients on ER stretchers. 3 high priority — urgent assignment needed."
- Green `#F0FDF4`: "7 discharges planned today. Releases throughout the day — alert hygiene team."

### Section: Daily Transfers (partially visible)

Title: "🔄 Recensement — Transferts & Rapatriements du jour"
Badges: `3 rapatriements` (blue) | `2 transferts sortants` (purple)
Grid of 4 cards (content to confirm)

---

## 12. PAGE: IA & PRÉDICTIONS (AI & Predictions)

**Purpose**: Hospital artificial intelligence. Automatic alerts, recommendations, and individual risk scores based on the HDHI model (15,757 patients, 56 variables).

### 4 KPI Cards

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| DURÉE SÉJOUR PRÉDITE (Predicted LOS) | 6.8j | `#7C3AED` purple | HDHI model (15,757 patients) |
| RISQUE RÉADMISSION (Readmission risk) | 18% | `#DC2626` red | DAMA patients at risk |
| SATURATION 48H (48h saturation) | 3e N | `#EA580C` orange | Nephro — projected overload |
| SCORE FIABILITÉ IA (AI reliability score) | 82% | `#16A34A` green | Based on 56 variables |

### 2-Column Layout

**Left Column**

**Critical Alerts block** (title with blue left bar):

Red alert card:
```
┌─────────────────────────────────────────────────────┐
│ 🔴 Saturation imminente — 3e Nord Néphrologie       │
│    80% current occupancy + 4 ACS patients waiting   │
│    with secondary AKI.                              │
│    Forecast: 93% within 24h.                        │
└─────────────────────────────────────────────────────┘
```
Background `#FEF2F2`, left border 4px `#DC2626`, border-radius 8px

Orange alert card:
```
┌─────────────────────────────────────────────────────┐
│ 🟡 3 patients DAMA — risque réadmission élevé       │
│    Patients 494270, 401634, 294578 left against      │
│    medical advice.                                  │
│    7-day readmission probability: 34%.              │
└─────────────────────────────────────────────────────┘
```
Background `#FFFBEB`, left border 4px `#F59E0B`

**AI Recommendations block**:

3 colored cards (green, blue, purple):

Green:
```
🎯 Prioritize patient MRD-647323 (ACS, 63y, HIGH risk)
   Wait time: 8h. Available bed: 2e Nord bed #7.
   Assignment recommended immediately.
```
Background `#F0FDF4`, left border 4px `#16A34A`

Blue:
```
🔄 Consider internal transfer — 3e Nord → 3e Sud
   2 stabilized AKI patients in Nephro could be
   transferred to Med. gen. to free capacity.
```
Background `#EFF6FF`, left border 4px `#2563EB`

Purple:
```
📅 7 discharges planned today — schedule housekeeping
   Alert hygiene team from 10:00 AM.
   Beds 2N-2, 2N-3, 3N-1, 3N-3 as priority.
```
Background `#F5F3FF`, left border 4px `#7C3AED`

**Right Column — Individual Predictions**

Title: "Prédictions individuelles — patients à risque"

Each patient row:
```
● MRD-316881 · 55y · 2e Nord — Cardiologie              2/10
  HEART FAILURE · Risk score: 2/10 · 13d ICU
  Predicted discharge: 2025-04-21 · ✅ Stable discharge
────────────────────────────────────────────────────────────
● MRD-494270 · 58y · 2e Nord — Cardiologie              8/10
  ACS · Risk score: 8/10 · 2d ICU
  Predicted discharge: 2025-04-11 · 🔴 Death
```

Row structure:
- Colored circle (red if score ≥7, orange if 4-6, green if ≤3)
- ID + age + location: 14px semi-bold
- Diagnosis + score + ICU duration: 12px gray
- Predicted discharge + outcome badge: 12px
- Score X/10: 18px bold purple `#7C3AED`, right-aligned
- Separator: `1px #E5E7EB`

8 patients listed:
- MRD-316881 55y Cardio HF → 2/10 ✅ Stable discharge
- MRD-494270 58y Cardio ACS → 8/10 🔴 Death
- MRD-238364 67y ICU HF → 4/10 ⚠️ DAMA risk
- MRD-387048 47y Cardio ACS → 4/10 ✅ Stable discharge
- MRD-409241 71y Cardio ACS → 8/10 ⚠️ DAMA risk
- MRD-336140 75y ICU HF → 4/10 ✅ Stable discharge
- MRD-465517 60y Nephro AKI → 4/10 ✅ Stable discharge
- (+ others)

---

## 13. PAGE: CENTRE DE RAPPORTS (Reports Center)

**Purpose**: Centralized library. Generation and PDF download of 12 report types.

### 4 KPI Cards

| Label (FR) | Value | Color | Sub-text |
|------------|-------|-------|----------|
| RAPPORTS DISPONIBLES (Available reports) | 12 | `#2563EB` blue | report types |
| GÉNÉRÉS AUJOURD'HUI (Generated today) | 4 | `#16A34A` green | PDFs produced |
| PÉRIODE COURANTE (Current period) | 7j | `#EA580C` orange | April 7–13, 2025 |
| PATIENTS COUVERTS (Patients covered) | 60 | `#7C3AED` purple | Simulated HDHI dataset |

### Report Grid — 3 columns × 4 rows

**Each card structure**:
```
┌─────────────────────────────────────────────────────┐
│ [icon] Report name                    [Frequency]   │  ← colored badge
│                                                     │
│ 2–3 line description (13px gray)                   │
│                                                     │
│ 📄 Last generated: today 07:30                      │
│ 📄 Format: PDF · ~2 pages                           │
│                                                     │
│ [■ Download PDF]                     [◎ Preview]    │
└─────────────────────────────────────────────────────┘
```
- White background, border-radius 12px, 4px colored left border by frequency
- Light shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
- Download button: background `#2563EB`, white text, full width, height 36px, border-radius 6px
- Preview button: gray text `#6B7280`, transparent background, 👁 icon

**12 reports**:

| # | Name (FR) | Frequency | Border color | Content |
|---|-----------|-----------|--------------|---------|
| 1 | Rapport journalier des lits | Daily | `#2563EB` blue | All beds by unit: occupied, available, cleaning. Overall and per-floor occupancy rate. |
| 2 | Rapport des admissions | Daily | `#2563EB` blue | Daily admission list: ER, OPD, repatriations. Diagnosis, receiving unit, arrival time. |
| 3 | Rapport des congés | Daily | `#2563EB` blue | Day's signed discharges. Patient, unit, diagnosis, LOS, outcome (DISCHARGE/DAMA/EXPIRY). |
| 4 | Rapport patients en attente | Real-time | `#EA580C` orange | ER stretcher patients waiting for a bed. Wait time, diagnosis, priority, target unit. |
| 5 | Rapport transferts & rapatriements | Daily | `#2563EB` blue | All inter-facility movements: incoming repatriations, outgoing transfers, statuses. |
| 6 | Rapport patients critiques | Real-time | `#DC2626` red | High-risk patients (score ≥4). Critical lab data, diagnoses, AI prediction. |
| 7 | Rapport hebdomadaire d'occupation | Weekly | `#16A34A` green | Occupancy rate by unit over 7 days. Curves, saturation peaks, vs. previous week. |
| 8 | Rapport hygiène & salubrité | Daily | `#2563EB` blue | Cleaning tracking: beds processed, turnaround time, team comments. |
| 9 | Rapport IA & prédictions | Daily | `#7C3AED` purple | LOS predictions, readmission risks, 48h saturation alerts, AI recommendations. |
| 10 | Rapport station matinale | Daily | `#2563EB` blue | Morning summary: occupancy, planned discharges, transfers, day's issues. |
| 11 | Rapport DAMA & réadmissions | Weekly | `#16A34A` green | Patients who left against medical advice. 7- and 30-day readmission tracking. |
| 12 | Rapport complet de la semaine | Weekly | `#16A34A` green | Full consolidated weekly report: all indicators, charts, trends. |

---

## 14. GLOBAL BEHAVIORS & INTERACTIONS

### Navigation
- SPA (Single Page Application) — no page reloads
- Transition: 150ms fade between pages
- Sidebar always visible except on Floor Display (fullscreen kiosk mode)

### Real-Time Data
- **Floor Display**: timer updated every second, beds every 30s
- **Emergency**: priority badges and wait times updated continuously
- **"Real-time" reports**: continuous data
- **Sidebar badges** (Urgence [12], Transferts [3]): WebSocket or 30s polling

### Responsive
- Desktop only (min-width 1280px)
- Floor Display: optimized for 1920×1080, kiosk mode (F11)

### Component Structure

```
/components
  /layout
    Sidebar.tsx           ← fixed left navigation
    TopBar.tsx            ← common header all pages
    AlertBanner.tsx       ← red alert button + timestamp
  /common
    KPICard.tsx           ← reusable metric card
    StatusBadge.tsx       ← colored badges by type
    ProgressBar.tsx       ← occupancy bars
    PatientRow.tsx        ← patient table row
    UnitCard.tsx          ← hospital unit card
  /pages
    VueEnsemble.tsx       ← Overview
    Coordonnateur.tsx     ← Coordinator
    Transferts.tsx        ← Transfers & Repatriations
    Admissions.tsx        ← Admissions & Records
    Urgence.tsx           ← Emergency
    GestionLits.tsx       ← Bed Management
    AffichageEtage.tsx    ← Floor Display (dark mode, fullscreen, real-time)
    HygieneInsalubrite.tsx← Hygiene & Sanitation
    StationMatinale.tsx   ← Morning Station
    IAPredictions.tsx     ← AI & Predictions
    CentreRapports.tsx    ← Reports Center
```

---

*Complete documentation — 11/11 interfaces documented — HosCor, Application de gestion hospitalière, 2025*
