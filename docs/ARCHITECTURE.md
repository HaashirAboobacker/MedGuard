# Architecture & Data Flow

MedGuard is a **single-page, client-side application** (`src/index.html`). There is no server, database or external API.

## Components

| Component | Responsibility |
|---|---|
| Auth module | Role (admin / clinical) + branch selection; demo accounts only |
| Asset store | Seed data per branch → `localStorage` (`hpr_assets_v1*`) |
| Risk engine | `isVulnerable` (current ≠ target) and `riskLevel` (explicit risk, else device-type defaults) |
| Policy gate | `needsApproval` = medical device AND critical risk |
| Approval queue | Requests from admin awaiting clinician decision (`hpr_queue_v1*`) |
| Audit log | Append-only (in-browser) events (`hpr_history_v1*`) |
| UI renderers | Sidebar, KPIs, toolbar, table, queue, audit panel |

## Data flow

1. User signs in → role decides which actions and views are available.
2. Admin selects a vulnerable asset:
   - **Routine asset** → `patchAsset()` → version updated → `logPatch()`.
   - **Critical medical device** → patch blocked → `requestApproval()` → queue + `logEvent("request")`.
3. Clinician opens the queue:
   - **Approve** → `approveFromQueue()` → patch simulated → `logPatch(..., approvedBy)`.
   - **Reject** → `rejectFromQueue()` → `logEvent("reject")`.
4. All views re-render from state (`renderAll()`).

## Trust boundaries

Everything runs in the user's browser; nothing leaves the device (other than optional Google Fonts CSS/font requests). There is no real device, network or patient-data boundary crossed.

