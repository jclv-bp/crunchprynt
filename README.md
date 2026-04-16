# Bluprynt Verified Issuer Registry — PoC

Implementation of the registry described in [`spec.md`](./spec.md). A four-issuer proof of concept that demonstrates the group → entity → asset model, three trust tiers (ESMA MiCA register, BMA manual verification, issuer-asserted), and the internal sourcing workflow including a MiCA CSV importer.

## Stack

- Next.js 16 (App Router) · TypeScript
- Tailwind CSS v4 · shadcn/ui (sharp corners, Bluprynt palette)
- Prisma 7 · SQLite (via `@prisma/adapter-better-sqlite3`)
- Vitest for unit tests (parsers, validators, reconciliation)

## Setup

Requires Node 20+.

```bash
npm install
cp .env.example .env          # then edit ADMIN_PASSWORD if you want
npm run db:migrate -- --name init   # already committed, but safe to re-run
npm run db:seed               # loads the four pilot issuers
npm run dev
```

The dev server picks an available port (3000 by default). The admin panel is at `/admin` and is gated by HTTP Basic auth with credentials `admin` / `$ADMIN_PASSWORD`.

## Demo walkthrough

With the dev server running and seed loaded, the spec §9 path:

1. `/groups/circle` — multi-entity group with US, EU, IE, BM entities.
2. `/entities/circle-internet-financial-europe-sas` — green ESMA MiCA EMT license card (sourced from the ESMA interim register).
3. `/entities/circle-internet-bermuda-limited` — amber BMA DABA Class F card (manually verified by a Bluprynt reviewer).
4. `/assets/ethereum/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` — USDC on Ethereum: issuer of record, issuance regime, related deployments on Solana + Base.
5. `/groups/tether` — non-authorization case; the Bluprynt commentary contextualizes it; entity page shows a coverage-limitation note and zero licenses.
6. `/groups/paxos` — partial-coverage case; Paxos Trust Company (NY) carries a coverage-limitation note; Paxos Issuance Europe OÜ holds a MiCA EMT license.
7. `/groups/apex-group` — service-provider case; entity page carries a BMA license and the assets section reads "… does not issue tokens."
8. `/how-claiming-works` — static explainer of the production claim flow.
9. `/data-sources` — methodology page: three trust tiers, ESMA + BMA paragraphs, coverage limitations, "what we do not scrape".
10. `/admin/imports` — with auth, upload any of `public/fixtures/esma-*-sample.csv`, review the reconciliation preview, and commit.

## Scripts

| Command | Effect |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm test` | Run all unit tests |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Clear + seed the four pilot issuers |
| `npm run db:reset` | Migrate-reset then re-seed |

## Repository layout

See the plan at `docs/superpowers/plans/2026-04-16-verified-issuer-registry.md` for the canonical file map and task decomposition.

## Out of scope

Per spec §3.3, the following are deliberately NOT implemented:
- Automated MiCA refresh / automated BMA scraping
- Public claim flow with working KYB
- User accounts / OAuth
- Multi-jurisdiction fuzzy entity matching
- Revocation / stale-state propagation
- NYDFS, FCA, MAS, FINMA, and other jurisdictions beyond MiCA and BMA

The Paxos entity page demonstrates the coverage-limitation UX for a jurisdiction (NYDFS) not yet covered.
