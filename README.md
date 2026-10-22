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
│   ├── entry-portal/       # Role selection and product entry
│   ├── citizen-portal/     # Citizen reporting and volunteering
│   ├── ngo-portal/         # NGO field operations
│   ├── csr-portal/         # CSR funding and impact
│   ├── admin-portal/       # Municipal administration
│   └── api/                # Shared API routes
├── packages/
│   ├── platform/           # Prisma schema and server integrations
│   └── ui/                 # Shared institutional UI primitives
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

### Run a portal in dev mode
```bash
npm run dev             # start every portal and the API together
# or start one service:
npm run dev:entry
npm run dev:citizen
npm run dev:ngo
npm run dev:csr
npm run dev:admin
npm run dev:api
```

---

## Apps

See [ARCHITECTURE.md](ARCHITECTURE.md) for ownership, ports, and the inter-app API boundary.

---

## Pilot

4-Month Delhi Pilot · 1 NGO partner · 1–2 wards · Real sanitation missions

---

## License

Private — All rights reserved.
