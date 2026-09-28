# SAAF — Spot · Assess · Act · Follow-up

> **Urban sanitation coordination and impact platform** — converting citizen-reported problems into prioritised NGO missions, connecting eligible missions with funding, verifying the work through evidence and community feedback, and following locations over time to identify recurring hotspots.

---

## The SAAF Workflow

```
SPOT → ASSESS → FUND → ACT → VERIFY → FOLLOW-UP
```

| Stage | Who | What |
|-------|-----|-------|
| **SPOT** | Citizens, RWAs, volunteers | Report sanitation issues with photo + location |
| **ASSESS** | System (rule-based scoring) | Priority score (severity, recurrence, exposure…) |
| **FUND** | CSR / funding partners | Connect eligible missions with resources |
| **ACT** | NGOs / field teams | Accept missions, intervene on-ground |
| **VERIFY** | System + human review | Before/after photos, timestamps, community feedback |
| **FOLLOW-UP** | System | Recurrence detection, persistent hotspot classification |

---

## Repository Structure (Monorepo)

```
saaf/
├── apps/
│   └── citizen-portal/     # Next.js — citizen-facing portal
├── packages/               # Shared libraries (UI, types, utils — added progressively)
├── UI/                     # Design reference assets
├── package.json            # Root npm workspaces config
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install all dependencies
```bash
npm install
```

### Run the citizen portal in dev mode
```bash
npm run dev
# or directly:
npm run dev --workspace=apps/citizen-portal
```

---

## Apps

### `apps/citizen-portal`
Citizen-facing portal for SAAF. Built with **Next.js 15 (App Router)** and **TypeScript**.

Key features (MVP):
- Issue reporting with photo upload and GPS location
- Status tracking
- Community confirmation after NGO intervention
- Sanitation hotspot map (public view)

---

## Pilot

4-Month Delhi Pilot · 1 NGO partner · 1–2 wards · Real sanitation missions

---

## License

Private — All rights reserved.
