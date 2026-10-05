# 🛡️ MedGuard — Human-Approved Patch & Asset Security Console for Hospitals

> **ASTRA 2026 · Cyber in Healthcare** — submission for KMCT Centre of Excellence

| | |
|---|---|
| **Project Name** | MedGuard |
| **Team Name** | 404 Brain Not Found |
| **Selected Track** | 12 |
| **Challenge Number & Title** | 3 – Hospital Network + Infrastructure |
| **License** | [MIT](LICENSE) (open source) |
| **Final version for judging** | Tag `v1.0.0-astra2026` *(see [docs/SUBMISSION.md](docs/SUBMISSION.md))* |
| **Live demo** | [https://haashiraboobacker.github.io/MedGuard/](https://haashiraboobacker.github.io/MedGuard/) |

---

## 1. Problem Statement

Hospitals run a mix of ordinary IT (PCs, laptops, servers, databases, tablets) and **medical devices (IoMT)** such as infusion pumps, ventilators, pacemaker programmers and imaging systems. Many of these run outdated software/firmware, and attackers exploit unpatched assets. But healthcare cannot patch like a normal office:

- Patching a **life-critical device** without clinical sign-off can interrupt patient care.
- IT teams often have **no single view** of which assets are outdated and how risky each one is.
- Patch decisions are rarely recorded with **who requested, who approved, and when**.

## 2. Proposed Solution

MedGuard is a web console that gives a hospital a **single inventory of assets**, flags which are **vulnerable (running an out-of-date version)**, ranks them by **risk**, and enforces a **human-in-the-loop approval workflow** for consequential actions:

- **IT Admins** can patch routine assets (PCs, tablets, databases, non-critical devices) directly.
- **Critical medical devices cannot be patched by IT alone** — the admin must *request approval*; a **Clinical Approver** (doctor) reviews the queue and approves or rejects.
- Every request, approval, rejection, patch and device addition is written to an **audit trail** with actor, role, timestamp and version change.

> ⚠️ **This is a simulation.** Synthetic seed data only · no app data sent anywhere · no real devices contacted. MedGuard never connects to real devices. "Patching" updates the version string of a synthetic asset in the browser. See [Limitations](#12-limitations).

## 3. Key Features

- 📦 Asset inventory across 4 categories: Computers, Databases, Medical Devices, Tablets
- ⚠️ Vulnerability flag (current version ≠ target version) and risk levels: low / medium / high / critical
- 🩺 **Role-based access:** IT Admin vs Clinical Approver (different UI and permissions)
- ✋ **Mandatory clinical approval** for critical medical devices (infusion pump, ventilator, imaging, pacemaker, defibrillator)
- 🕐 Approval queue with approve / reject
- 📋 Full audit log (who, what, when, from→to version, approver)
- 🏥 Multi-branch data sets (3 synthetic hospital branches, each with separate stored state)
- ➕ Add-asset form with validation (required fields, duplicate IDs, IP format)
- 🔍 Search, filters, category tabs, KPIs (secure / vulnerable / compliance)
- 🔐 Input is HTML-escaped before rendering; **no backend, no secrets, and no app or patient data ever leaves the browser** (only optional Google Fonts are fetched)

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Front end | HTML5, CSS3, vanilla JavaScript (single file, no framework) |
| State | Browser `localStorage` (per branch) |
| Fonts | Inter, JetBrains Mono via Google Fonts (optional; system fonts as fallback) |
| Tests | Node.js ≥ 18 built-ins only (no dependencies) |
| CI / Hosting | GitHub Actions + GitHub Pages |
| AI / ML | **None used** (see [AI statement](#13-ai--ml-statement)) |

## 5. System Architecture

```
┌────────────────────────────── Browser (no server) ──────────────────────────────┐
│                                                                                  │
│  Login (role + branch)  ──►  Role-scoped views                                   │
│                                 │                                                │
│   IT Admin ──── patch routine asset ─────────────────────────┐                   │
│       │                                                      ▼                   │
│       └─ critical medical device ─► Approval Queue ─► Clinical Approver          │
│                                            │              approve / reject       │
│                                            ▼                    │                │
│                                      Audit Log  ◄───────────────┘                │
│                                            │                                     │
│                              localStorage (assets · queue · history)             │
└──────────────────────────────────────────────────────────────────────────────────┘
        Synthetic seed data only · no network I/O · no real devices contacted
```

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Security approach: [docs/SECURITY.md](docs/SECURITY.md).

## 6. Repository Structure

```
medguard/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example        # placeholders only (app needs no secrets)
├── .github/workflows/  # tests + GitHub Pages deploy
├── docs/               # architecture, security, testing, third-party, submission
├── src/index.html      # the application
├── tests/run-tests.js  # automated tests (no dependencies)
└── public/screenshots/ # demo screenshots
```

## 7. Setup / Installation

No build step and no dependencies.

```bash
git clone https://github.com/HaashirAboobacker/MedGuard.git
cd MedGuard

# Option A: just open the file
#   double-click src/index.html

# Option B: serve locally (recommended)
python3 -m http.server 8080 --directory src
# open http://localhost:8080
```

Environment variables are **not required** — see `.env.example`.

## 8. Usage Instructions

1. Open the app, choose a **Hospital / Branch** and a **role** (IT Admin or Clinical Approver).
2. Click a demo credential row to auto-fill, then **Sign in**.

**Demo accounts (fake, for the synthetic demo only — not real credentials):**

| Role | Username | Password |
|---|---|---|
| IT Admin | `admin.kozhikode` / `admin.malappuram` / `admin.kannur` | `admin123` |
| Clinical Approver | `doctor.kozhikode` / `doctor.malappuram` / `doctor.kannur` | `doctor123` |

## 9. Demo Instructions (≈3 minutes)

1. **Sign in as IT Admin** → note KPIs and vulnerable assets (red).
2. **Patch a routine asset** (e.g. a nurse-station PC) → status becomes *Up-to-date*; entry appears in the audit log.
3. **Try a critical device** (e.g. an Infusion Pump) → patch is blocked; click **Request approval**.
4. **Log out → sign in as Clinical Approver** → open the approval queue.
5. **Approve** one request (device is patched, approver recorded) and **Reject** another.
6. Open the **Audit Log** → every step shows actor, role, timestamp and version change.
7. Switch **branch** to show separate data sets.

Screenshots: `public/screenshots/`.

## 10. Testing / Evaluation Results

```bash
node tests/run-tests.js
```

Latest run (full output in [docs/test-results.txt](docs/test-results.txt)): **19 passed, 0 failed**

| Area | What is verified |
|---|---|
| Security/privacy | No network calls, no secret patterns, only demo credentials, only private `10.x` IPs, no patient-identifier fields, HTML-escaping, synthetic-data banner |
| Human oversight | Critical devices require approval; admin path blocked for them; only clinicians can approve/reject; clinicians cannot use admin patch path |
| Audit | Request / reject / add / patch events are logged |
| Data integrity | Required fields, unique IDs, valid categories, input validation |

**Note:** the automated tests combine static code checks (e.g. no network APIs, escaping present) with logic checks run on the risk and approval functions. End-to-end behaviour (login, patching, approval workflow, audit log) was verified manually; see the manual test cases and the screenshots above.

Methodology and manual test cases: [docs/TESTING.md](docs/TESTING.md). All testing was done locally against synthetic data only.

## 11. Security & Safety Statement

- ✅ 100% synthetic data — no real patients, hospitals, devices or networks (hospital/branch names and all assets in the demo are fictional)
- ✅ No scanning, exploitation or contact with any external system
- ✅ No API keys, tokens or real credentials in the repo
- ✅ Human approval required for consequential (critical-device) actions
- ✅ Assumptions and limitations documented below

## 12. Limitations

- **Simulation only:** no real device/patch integration; "patching" changes a version label.
- **Client-side authentication:** accounts and demo passwords live in the front-end code. This is for demonstration, **not** production security. A real deployment needs server-side auth (SSO/MFA), hashed credentials and an authorization API.
- **Audit log is not tamper-proof:** it is stored in the browser (`localStorage`) and can be edited by the user. Production would need append-only, server-side, signed logs.
- **Risk level on newly added assets is user-selected**, so an admin could label a critical device as low risk; production would derive risk from a device-type policy.
- Vulnerability = *current version ≠ target version*; there is no CVE feed or severity scoring.
- Data is per-browser; no multi-user sync.

## 13. AI / ML Statement

MedGuard **does not use AI or machine learning**. All decisions follow deterministic rules (version mismatch → vulnerable; critical medical device → requires clinical approval). No model, training data, false-positive/false-negative analysis or model limitations therefore apply.

## 14. Team Members & Contributions

| Member | Role / Contribution |
|---|---|
| Azeem Abbas | `Backend, Audit & Testing` |
| Haashir Aboobacker | `Backend & Security Logic` |
| Anamika E | `Frontend & Interaction` |
| Reema Sulthana | `Frontend & UI/UX Design` |

## 15. Third-Party Components

Full list in [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md). Summary: Inter and JetBrains Mono fonts (SIL Open Font License, loaded from Google Fonts), and GitHub Actions/Pages for CI and hosting. No frameworks, external APIs, AI models or datasets are used. All asset data is synthetic and created by the team.

## 16. License

Released under the **MIT License** — see [LICENSE](LICENSE).
