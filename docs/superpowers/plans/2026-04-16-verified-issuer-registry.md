# Verified Issuer Registry PoC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a four-issuer PoC of the Bluprynt verified issuer registry — a Next.js app that exposes group/entity/asset pages anchored in register-sourced data, plus an internal admin panel with a MiCA CSV importer, per `spec.md`.

**Architecture:** Single Next.js 15 (App Router) TypeScript application. Prisma + SQLite for persistence (single file, zero ops, easy to seed; production will swap for Postgres without model changes). Tailwind v4 + shadcn/ui styled to the Bluprynt design system (sharp corners, monochrome + accent blue, Inter, opacity-based hierarchy). Server Components for all public pages (no client data fetching); Server Actions for admin mutations. Admin panel gated behind a single-password HTTP Basic middleware. ESMA CSV importer is a pluggable parser per file-type with a reconciliation preview step the reviewer confirms before any rows persist.

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Prisma ORM + SQLite (`file:./dev.db`)
- Zod (request/form validation, CSV row validation)
- `papaparse` (CSV parsing)
- Vitest + Testing Library (unit tests on parser, slugs, validators; not on UI)
- `next/font/google` Inter
- Node 20+

**Repository layout (after Task 1):**
```
compliance-hub/
├── app/
│   ├── layout.tsx                      # root layout, Inter, header
│   ├── page.tsx                        # registry directory
│   ├── globals.css                     # Tailwind v4 @theme + shadcn vars
│   ├── groups/[slug]/page.tsx
│   ├── entities/[slug]/page.tsx
│   ├── assets/[chain]/[address]/page.tsx
│   ├── how-claiming-works/page.tsx
│   ├── data-sources/page.tsx
│   └── admin/
│       ├── layout.tsx                  # admin chrome + sign-out
│       ├── page.tsx                    # admin dashboard
│       ├── groups/page.tsx
│       ├── groups/new/page.tsx
│       ├── groups/[id]/page.tsx
│       ├── entities/page.tsx
│       ├── entities/new/page.tsx
│       ├── entities/[id]/page.tsx
│       ├── assets/page.tsx
│       ├── assets/new/page.tsx
│       ├── assets/[id]/page.tsx
│       └── imports/page.tsx            # MiCA CSV import entry
├── components/
│   ├── ui/                             # shadcn primitives
│   ├── registry/
│   │   ├── license-card.tsx
│   │   ├── source-badge.tsx
│   │   ├── entity-card.tsx
│   │   ├── asset-card.tsx
│   │   └── count-rollup.tsx
│   └── admin/
│       ├── group-form.tsx
│       ├── entity-form.tsx
│       ├── license-subform-mica.tsx
│       ├── license-subform-bma.tsx
│       ├── license-subform-asserted.tsx
│       ├── asset-form.tsx
│       └── import-review-table.tsx
├── lib/
│   ├── db.ts                           # prisma client singleton
│   ├── auth.ts                         # admin auth check (basic)
│   ├── slugs.ts                        # canonical id + slug resolver
│   ├── rollups.ts                      # group/entity summary computations
│   ├── validators/
│   │   ├── group.ts
│   │   ├── entity.ts
│   │   ├── asset.ts
│   │   └── license.ts
│   └── esma/
│       ├── schemas.ts                  # zod schemas per ESMA file type
│       ├── parse.ts                    # papaparse wrapper
│       ├── map.ts                      # row → registry diff
│       └── import.ts                   # server action: preview + commit
├── prisma/
│   ├── schema.prisma
│   ├── migrations/                     # generated
│   └── seed.ts                         # four pilot issuers
├── middleware.ts                       # basic-auth gate for /admin/*
├── tests/
│   ├── esma/                           # parser + mapping tests
│   ├── slugs.test.ts
│   └── validators.test.ts
├── public/
│   ├── logos/                          # issuer logos + bluprynt
│   └── fixtures/                       # sample ESMA CSVs (committed)
├── .env.example
├── tailwind.config is NOT used (Tailwind v4 = CSS-first)
├── postcss.config.mjs
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1 — Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.env.example`, `.gitignore`, `README.md`
- Create: `vitest.config.ts`

- [ ] **Step 1: Initialize repo and install dependencies**

From `/Users/bluprynt/Documents/Projects/compliance-hub`:
```bash
git init
npm init -y
npm i next@latest react react-dom
npm i -D typescript @types/react @types/node @types/react-dom
npm i tailwindcss@next @tailwindcss/postcss postcss
npm i -D vitest @vitejs/plugin-react
npm i zod papaparse
npm i -D @types/papaparse
npm i prisma @prisma/client
npm i -D tsx
```

- [ ] **Step 2: Write `package.json` scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force && npm run db:seed"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next.config.ts` and `postcss.config.mjs`**

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { reactStrictMode: true };
export default nextConfig;
```

`postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 5: Write `app/globals.css` with Bluprynt tokens**

```css
@import "tailwindcss";

@theme {
  --color-accent-blue: #007bff;
  --color-accent-blue-alt: #3B82F6;
  --color-surface: #F8F8F9;
  --color-input-bg: #f3f3f5;
  --color-muted-fg: #717182;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}

:root {
  --background: #ffffff;
  --foreground: #030213;
  --primary: #030213;
  --primary-foreground: #ffffff;
  --secondary: #F8F8F9;
  --secondary-foreground: #030213;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --border: rgba(0, 0, 0, 0.1);
  --input: #f3f3f5;
  --ring: #007bff;
  --radius: 0;
}

html, body { background: var(--background); color: var(--foreground); }
```

- [ ] **Step 6: Write `app/layout.tsx`**

```tsx
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bluprynt Verified Issuer Registry",
  description: "Group, entity, and asset registry for regulated digital asset issuers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Write a placeholder `app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="max-w-[1200px] mx-auto px-8 py-12">
      <h1 className="text-3xl font-semibold tracking-[-0.02em]">Verified Issuer Registry</h1>
      <p className="text-black/60 mt-2">Scaffolding OK.</p>
    </main>
  );
}
```

- [ ] **Step 8: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["tests/**/*.test.ts"] } });
```

- [ ] **Step 9: `.env.example`, `.gitignore`**

`.env.example`:
```
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="change-me"
```

`.gitignore` includes `node_modules/`, `.next/`, `dev.db*`, `.env`.

- [ ] **Step 10: Boot dev server and verify**

```bash
cp .env.example .env
npm run dev
```
Expected: page loads at http://localhost:3000 with "Scaffolding OK." in Inter.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "chore: scaffold next.js + tailwind v4 + vitest"
```

---

## Task 2 — Install shadcn/ui primitives

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/*`

- [ ] **Step 1: Initialize shadcn**

```bash
npx shadcn@latest init -y --base-color neutral --css-variables
```
When prompted about root layout or CSS path, accept defaults. Confirm that generated `components.json` uses `"radius": "0rem"` and `"cssVariables": true`. If not, edit it.

- [ ] **Step 2: Add the primitives we need**

```bash
npx shadcn@latest add button input label select textarea table badge card separator dialog form tabs sonner
```

- [ ] **Step 3: Ensure sharp corners survive the install**

Open `app/globals.css` — confirm `--radius: 0` is still present below the shadcn additions. Open `components/ui/button.tsx` — if shadcn wrote `rounded-md` literals, replace with `rounded-none`.

- [ ] **Step 4: Smoke-check**

Edit `app/page.tsx` temporarily to import `Button` and render one; reload the browser; confirm sharp corners and Bluprynt-primary color. Revert the import when done.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: add shadcn/ui with sharp-corner overrides"
```

---

## Task 3 — Prisma schema and database

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model Group {
  id          String   @id @default(cuid())
  slug        String   @unique
  displayName String
  description String
  website     String?
  logoPath    String?
  commentary  String?  // Bluprynt-authored context, shown on group page
  entities    Entity[]
  slugAliases SlugAlias[] @relation("GroupAliases")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Entity {
  id                         String   @id @default(cuid())
  slug                       String   @unique
  legalName                  String
  lei                        String?  @unique
  jurisdictionCountry        String   // ISO-3166-1 alpha-2
  jurisdictionSubdivision    String?  // e.g. "US-NY"
  registrationNumber         String?
  groupId                    String
  group                      Group    @relation(fields: [groupId], references: [id])
  status                     String   @default("active") // active | wound_down | revoked
  coverageLimitationNote     String?  // e.g. "NYDFS coverage not included in this PoC"
  licenses                   License[]
  controlledWallets          ControlledWallet[]
  issuedAssets               Asset[]
  slugAliases                SlugAlias[] @relation("EntityAliases")
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
}

model License {
  id                  String   @id @default(cuid())
  entityId            String
  entity              Entity   @relation(fields: [entityId], references: [id])
  source              String   // esma_mica_register | bma_manual | issuer_asserted
  sourceRetrievedAt   DateTime
  regulator           String
  jurisdictionCountry String
  licenseType         String
  licenseReference    String?
  permittedActivities String?  // JSON-encoded string[]
  passporting         String?  // JSON-encoded string[]
  status              String   @default("active") // active | withdrawn | suspended
  reviewerName        String?  // bma_manual only
  reviewerVerifiedAt  DateTime? // bma_manual only
  documentPath        String?  // issuer_asserted only
  documentHash        String?
  importBatchId       String?
  importBatch         ImportBatch? @relation(fields: [importBatchId], references: [id])
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model ControlledWallet {
  id              String   @id @default(cuid())
  entityId        String
  entity          Entity   @relation(fields: [entityId], references: [id])
  chain           String
  address         String
  attestationRef  String?
  createdAt       DateTime @default(now())
  @@unique([chain, address])
}

model Asset {
  id                  String   @id @default(cuid())
  chain               String
  address             String
  symbol              String
  name                String
  issuerEntityId      String
  issuerEntity        Entity   @relation(fields: [issuerEntityId], references: [id])
  issuanceRegime      String   // MiCA-EMT | MiCA-ART | MiCA-Other | DABA | None
  linkedWhitePaperId  String?
  linkedWhitePaper    License? @relation("AssetWhitePaper", fields: [linkedWhitePaperId], references: [id])
  relatedGroupId      String?  // lets us group deployments of the same branded asset
  attestationRef      String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  @@unique([chain, address])
}

model SlugAlias {
  id            String  @id @default(cuid())
  alias         String  @unique
  kind          String  // group | entity
  groupId       String?
  group         Group?  @relation("GroupAliases", fields: [groupId], references: [id])
  entityId      String?
  entity        Entity? @relation("EntityAliases", fields: [entityId], references: [id])
  createdAt     DateTime @default(now())
}

model ImportBatch {
  id                String   @id @default(cuid())
  fileName          String
  esmaFileType      String   // emt | art | casp_authorized | casp_noncompliant | whitepapers
  reviewer          String
  importedAt        DateTime @default(now())
  rowsConfirmed     Int
  rowsRejected      Int
  licenses          License[]
}
```

> Note: the Prisma `@relation("AssetWhitePaper"...)` on `Asset.linkedWhitePaper` needs a back-relation on `License` — add `assetsUsingAsWhitePaper Asset[] @relation("AssetWhitePaper")` inside the `License` block.

- [ ] **Step 2: Fix the back-relation**

Inside `License`, add:
```prisma
assetsUsingAsWhitePaper Asset[] @relation("AssetWhitePaper")
```

- [ ] **Step 3: Create initial migration**

```bash
npm run db:migrate -- --name init
```
Expected: `prisma/migrations/*_init/` directory created; `dev.db` appears.

- [ ] **Step 4: Write `lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): prisma schema + sqlite setup"
```

---

## Task 4 — Slug / ID resolver + redirect

**Files:**
- Create: `lib/slugs.ts`, `tests/slugs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/slugs.test.ts
import { describe, it, expect } from "vitest";
import { isCanonicalId } from "@/lib/slugs";

describe("isCanonicalId", () => {
  it("recognizes cuid-shaped canonical ids", () => {
    expect(isCanonicalId("clz3x8a0e0000xyzabc123456")).toBe(true);
  });
  it("rejects human slugs", () => {
    expect(isCanonicalId("circle")).toBe(false);
    expect(isCanonicalId("circle-internet-financial")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
npm test -- tests/slugs.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// lib/slugs.ts
import { db } from "@/lib/db";

export function isCanonicalId(input: string): boolean {
  // cuid1: starts with 'c', 25 chars, lowercase alphanumerics
  return /^c[a-z0-9]{24}$/.test(input);
}

export async function resolveGroup(input: string) {
  if (isCanonicalId(input)) return db.group.findUnique({ where: { id: input } });
  const byAlias = await db.slugAlias.findUnique({ where: { alias: input } });
  if (byAlias?.groupId) return db.group.findUnique({ where: { id: byAlias.groupId } });
  return db.group.findUnique({ where: { slug: input } });
}

export async function resolveEntity(input: string) {
  if (isCanonicalId(input)) return db.entity.findUnique({ where: { id: input } });
  const byAlias = await db.slugAlias.findUnique({ where: { alias: input } });
  if (byAlias?.entityId) return db.entity.findUnique({ where: { id: byAlias.entityId } });
  return db.entity.findUnique({ where: { slug: input } });
}
```

- [ ] **Step 4: Pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(slugs): canonical id detection + resolver"
```

---

## Task 5 — Zod validators

**Files:**
- Create: `lib/validators/{group,entity,asset,license}.ts`, `tests/validators.test.ts`

- [ ] **Step 1: Write the validators**

```ts
// lib/validators/group.ts
import { z } from "zod";
export const groupInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(64),
  displayName: z.string().min(1).max(128),
  description: z.string().max(1000),
  website: z.string().url().optional().or(z.literal("")),
  logoPath: z.string().optional(),
  commentary: z.string().max(4000).optional(),
});
export type GroupInput = z.infer<typeof groupInput>;
```

```ts
// lib/validators/entity.ts
import { z } from "zod";
export const entityInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(96),
  legalName: z.string().min(1),
  lei: z.string().length(20).regex(/^[A-Z0-9]{20}$/).optional().or(z.literal("")),
  jurisdictionCountry: z.string().length(2),
  jurisdictionSubdivision: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
  groupId: z.string(),
  status: z.enum(["active", "wound_down", "revoked"]).default("active"),
  coverageLimitationNote: z.string().optional().or(z.literal("")),
});
```

```ts
// lib/validators/asset.ts
import { z } from "zod";
export const assetInput = z.object({
  chain: z.enum(["solana", "ethereum", "base", "polygon", "tron", "arbitrum", "optimism"]),
  address: z.string().min(1),
  symbol: z.string().min(1).max(16),
  name: z.string().min(1),
  issuerEntityId: z.string(),
  issuanceRegime: z.enum(["MiCA-EMT", "MiCA-ART", "MiCA-Other", "DABA", "None"]),
  attestationRef: z.string().optional().or(z.literal("")),
});
```

```ts
// lib/validators/license.ts
import { z } from "zod";

const common = z.object({
  entityId: z.string(),
  regulator: z.string().min(1),
  jurisdictionCountry: z.string().length(2),
  licenseType: z.string().min(1),
  licenseReference: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "withdrawn", "suspended"]).default("active"),
});

export const licenseMica = common.extend({
  source: z.literal("esma_mica_register"),
  sourceRetrievedAt: z.coerce.date(),
  permittedActivities: z.array(z.string()).default([]),
  passporting: z.array(z.string()).default([]),
});

export const licenseBma = common.extend({
  source: z.literal("bma_manual"),
  sourceRetrievedAt: z.coerce.date(),
  reviewerName: z.string().min(1),
  reviewerVerifiedAt: z.coerce.date(),
  permittedActivities: z.array(z.string()).default([]),
});

export const licenseAsserted = common.extend({
  source: z.literal("issuer_asserted"),
  sourceRetrievedAt: z.coerce.date(),
  documentPath: z.string().min(1),
  documentHash: z.string().min(1),
});

export const licenseInput = z.discriminatedUnion("source", [licenseMica, licenseBma, licenseAsserted]);
```

- [ ] **Step 2: Write `tests/validators.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { groupInput } from "@/lib/validators/group";
import { entityInput } from "@/lib/validators/entity";
import { licenseInput } from "@/lib/validators/license";

describe("groupInput", () => {
  it("accepts valid slug + name", () => {
    expect(() => groupInput.parse({
      slug: "circle", displayName: "Circle", description: "x"
    })).not.toThrow();
  });
  it("rejects invalid slug", () => {
    expect(() => groupInput.parse({
      slug: "Circle!", displayName: "Circle", description: ""
    })).toThrow();
  });
});

describe("entityInput", () => {
  it("accepts a 20-char LEI", () => {
    expect(() => entityInput.parse({
      slug: "circle-eu", legalName: "Circle Internet Financial Europe SAS",
      lei: "549300ABCDEFG1234567", jurisdictionCountry: "FR", groupId: "g1"
    })).not.toThrow();
  });
  it("rejects a malformed LEI", () => {
    expect(() => entityInput.parse({
      slug: "x", legalName: "x", lei: "not-an-lei", jurisdictionCountry: "FR", groupId: "g1"
    })).toThrow();
  });
});

describe("licenseInput discriminated union", () => {
  it("requires reviewerName for bma_manual", () => {
    expect(() => licenseInput.parse({
      source: "bma_manual", entityId: "e1", regulator: "BMA",
      jurisdictionCountry: "BM", licenseType: "DABA Class F",
      sourceRetrievedAt: "2026-04-10T00:00:00Z", reviewerVerifiedAt: "2026-04-10T00:00:00Z"
    })).toThrow();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(validators): zod schemas for group/entity/asset/license"
```

---

## Task 6 — ESMA CSV schemas and parser

**Files:**
- Create: `lib/esma/schemas.ts`, `lib/esma/parse.ts`, `tests/esma/parse.test.ts`, `public/fixtures/esma-emt-sample.csv`, `public/fixtures/esma-art-sample.csv`, `public/fixtures/esma-casp-authorized-sample.csv`, `public/fixtures/esma-casp-noncompliant-sample.csv`, `public/fixtures/esma-whitepapers-sample.csv`

**Context:** ESMA publishes five interim-register files on their MiCA page. Exact columns drift; the PoC targets the documented schema as of Q1 2026. Every parser here is driven by a zod schema — unknown columns are ignored, required columns missing = parse error surfaced to the reviewer.

- [ ] **Step 1: Author fixture CSVs**

Create `public/fixtures/esma-emt-sample.csv`. Two rows — Circle Europe, Paxos Estonia — exactly as they'd appear in the ESMA EMT issuers CSV. Columns (from ESMA's interim EMT register):

```
LEI,Legal Name,Home Member State,Competent Authority,Authorisation Date,Token Name,Token Symbol,Passporting Member States
549300XFFE1Z1R9ZDY90,Circle Internet Financial Europe SAS,FR,AMF,2024-07-01,EURC,EURC,"FR,DE,IE,NL"
549300A7ABCDEF123456,Paxos Issuance Europe OÜ,EE,Finantsinspektsioon,2024-10-15,pyUSD,pyUSD,"EE,FI,IE,NL"
```

Create analogous two-row fixtures for the other four file types. Column sets:
- **ART:** `LEI,Legal Name,Home Member State,Competent Authority,Authorisation Date,Token Name,Token Symbol,Passporting Member States`
- **CASP authorised:** `LEI,Legal Name,Home Member State,Competent Authority,Authorisation Date,Services Authorised,Passporting Member States` (services as comma-joined codes, e.g. `CASP-1,CASP-3,CASP-5`)
- **CASP non-compliant:** `Legal Name,Country,Notice Date,Summary` (no LEI required — these are public warnings)
- **White papers:** `LEI,Issuer Legal Name,Home Member State,Notification Date,Token Name,Token Symbol,White Paper URL`

Any two realistic-looking rows per file; keep them short.

- [ ] **Step 2: Write `lib/esma/schemas.ts`**

```ts
import { z } from "zod";

export const esmaFileTypes = [
  "emt", "art", "casp_authorized", "casp_noncompliant", "whitepapers",
] as const;
export type EsmaFileType = (typeof esmaFileTypes)[number];

const memberStates = z.string().transform(s =>
  s ? s.split(",").map(x => x.trim()).filter(Boolean) : []
);

const iso = z.coerce.date();

const emtOrArt = z.object({
  LEI: z.string().length(20),
  "Legal Name": z.string().min(1),
  "Home Member State": z.string().length(2),
  "Competent Authority": z.string().min(1),
  "Authorisation Date": iso,
  "Token Name": z.string().optional().default(""),
  "Token Symbol": z.string().optional().default(""),
  "Passporting Member States": memberStates.optional().default(""),
});

const caspAuthorized = z.object({
  LEI: z.string().length(20),
  "Legal Name": z.string().min(1),
  "Home Member State": z.string().length(2),
  "Competent Authority": z.string().min(1),
  "Authorisation Date": iso,
  "Services Authorised": memberStates.optional().default(""),
  "Passporting Member States": memberStates.optional().default(""),
});

const caspNonCompliant = z.object({
  "Legal Name": z.string().min(1),
  Country: z.string().length(2),
  "Notice Date": iso,
  Summary: z.string().optional().default(""),
});

const whitepapers = z.object({
  LEI: z.string().length(20),
  "Issuer Legal Name": z.string().min(1),
  "Home Member State": z.string().length(2),
  "Notification Date": iso,
  "Token Name": z.string().min(1),
  "Token Symbol": z.string().min(1),
  "White Paper URL": z.string().url(),
});

export const rowSchemas = {
  emt: emtOrArt,
  art: emtOrArt,
  casp_authorized: caspAuthorized,
  casp_noncompliant: caspNonCompliant,
  whitepapers,
} as const;
```

- [ ] **Step 3: Write `lib/esma/parse.ts`**

```ts
import Papa from "papaparse";
import { rowSchemas, type EsmaFileType } from "./schemas";
import { ZodError } from "zod";

export type ParseResult =
  | { ok: true; rows: unknown[] }
  | { ok: false; errors: { row: number; message: string }[] };

export function parseEsmaCsv(csv: string, fileType: EsmaFileType): ParseResult {
  const schema = rowSchemas[fileType];
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return { ok: false, errors: parsed.errors.map(e => ({ row: e.row ?? -1, message: e.message })) };
  }
  const errors: { row: number; message: string }[] = [];
  const rows: unknown[] = [];
  parsed.data.forEach((raw, i) => {
    const res = schema.safeParse(raw);
    if (!res.success) {
      errors.push({ row: i + 2, message: (res.error as ZodError).issues.map(x => `${x.path.join(".")}: ${x.message}`).join("; ") });
    } else {
      rows.push(res.data);
    }
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, rows };
}
```

- [ ] **Step 4: Test against fixtures**

```ts
// tests/esma/parse.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseEsmaCsv } from "@/lib/esma/parse";

const load = (name: string) => readFileSync(`public/fixtures/${name}`, "utf8");

describe("parseEsmaCsv", () => {
  it("parses EMT fixture", () => {
    const r = parseEsmaCsv(load("esma-emt-sample.csv"), "emt");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rows).toHaveLength(2);
  });
  it("parses all five fixture types", () => {
    const files: Array<[string, any]> = [
      ["esma-emt-sample.csv", "emt"],
      ["esma-art-sample.csv", "art"],
      ["esma-casp-authorized-sample.csv", "casp_authorized"],
      ["esma-casp-noncompliant-sample.csv", "casp_noncompliant"],
      ["esma-whitepapers-sample.csv", "whitepapers"],
    ];
    for (const [f, t] of files) {
      const r = parseEsmaCsv(load(f), t);
      expect(r.ok, `${f}`).toBe(true);
    }
  });
  it("flags malformed LEIs", () => {
    const bad = "LEI,Legal Name,Home Member State,Competent Authority,Authorisation Date\nXX,Test,FR,AMF,2024-01-01";
    const r = parseEsmaCsv(bad, "emt");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(esma): CSV schemas + parser with fixtures"
```

---

## Task 7 — ESMA row → registry mapping + reconciliation

**Files:**
- Create: `lib/esma/map.ts`, `tests/esma/map.test.ts`

- [ ] **Step 1: Types and mapping**

```ts
// lib/esma/map.ts
import type { EsmaFileType } from "./schemas";

export type EntityDiff = {
  matchedEntityId: string | null;       // null = will create new
  matchKind: "lei" | "none";
  licenseIncoming: {
    source: "esma_mica_register";
    regulator: string;
    jurisdictionCountry: string;
    licenseType: string;
    licenseReference: string | null;
    permittedActivities: string[];
    passporting: string[];
    sourceRetrievedAt: Date;
  };
  entityIncoming: {
    legalName: string;
    lei: string | null;
    jurisdictionCountry: string;
  } | null;                              // null for casp_noncompliant rows with no LEI
  fieldDiffs: { field: string; before: string | null; after: string | null }[];
};

export async function reconcileRows(rows: unknown[], fileType: EsmaFileType, retrievedAt: Date): Promise<EntityDiff[]> {
  const { db } = await import("@/lib/db");
  const diffs: EntityDiff[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, any>;
    const lei = r.LEI ?? null;
    const legalName = r["Legal Name"] ?? r["Issuer Legal Name"] ?? null;
    const homeState = r["Home Member State"] ?? r.Country ?? null;
    const matched = lei ? await db.entity.findUnique({ where: { lei } }) : null;
    const licenseType =
      fileType === "emt" ? "MiCA EMT authorization"
      : fileType === "art" ? "MiCA ART authorization"
      : fileType === "casp_authorized" ? "MiCA CASP authorization"
      : fileType === "casp_noncompliant" ? "MiCA non-compliant CASP notice"
      : "MiCA white paper notification";
    diffs.push({
      matchedEntityId: matched?.id ?? null,
      matchKind: matched ? "lei" : "none",
      licenseIncoming: {
        source: "esma_mica_register",
        regulator: r["Competent Authority"] ?? "ESMA",
        jurisdictionCountry: homeState,
        licenseType,
        licenseReference: r.LEI ?? null,
        permittedActivities: r["Services Authorised"] ?? [],
        passporting: r["Passporting Member States"] ?? [],
        sourceRetrievedAt: retrievedAt,
      },
      entityIncoming: legalName ? { legalName, lei, jurisdictionCountry: homeState } : null,
      fieldDiffs: computeFieldDiffs(matched, legalName),
    });
  }
  return diffs;
}

function computeFieldDiffs(matched: { legalName: string } | null, incomingName: string | null) {
  if (!matched || !incomingName) return [];
  if (matched.legalName !== incomingName) {
    return [{ field: "legalName", before: matched.legalName, after: incomingName }];
  }
  return [];
}
```

- [ ] **Step 2: Test reconciliation**

```ts
// tests/esma/map.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { reconcileRows } from "@/lib/esma/map";
import { db } from "@/lib/db";

describe("reconcileRows", () => {
  let groupId: string;
  beforeAll(async () => {
    const g = await db.group.create({ data: { slug: "testco", displayName: "TestCo", description: "" } });
    groupId = g.id;
    await db.entity.create({
      data: { slug: "testco-eu", legalName: "TestCo EU S.A.", lei: "TESTLEI1234567890XXX",
              jurisdictionCountry: "FR", groupId },
    });
  });
  afterAll(async () => {
    await db.entity.deleteMany({ where: { groupId } });
    await db.group.delete({ where: { id: groupId } });
  });

  it("matches on LEI", async () => {
    const rows = [{ LEI: "TESTLEI1234567890XXX", "Legal Name": "TestCo EU S.A.",
                    "Home Member State": "FR", "Competent Authority": "AMF",
                    "Authorisation Date": new Date("2024-07-01"), "Passporting Member States": [] }];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].matchKind).toBe("lei");
    expect(diffs[0].matchedEntityId).toBeTruthy();
  });

  it("creates new when LEI unknown", async () => {
    const rows = [{ LEI: "UNKNOWN00000000000XX", "Legal Name": "Other S.A.",
                    "Home Member State": "DE", "Competent Authority": "BaFin",
                    "Authorisation Date": new Date("2024-07-01"), "Passporting Member States": [] }];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].matchKind).toBe("none");
    expect(diffs[0].matchedEntityId).toBeNull();
  });
});
```

- [ ] **Step 3: Run**

```bash
npm run db:push
npm test
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(esma): row→registry reconciliation with LEI matching"
```

---

## Task 8 — Admin auth middleware

**Files:**
- Create: `middleware.ts`, `lib/auth.ts`

- [ ] **Step 1: Write `middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return new NextResponse("ADMIN_PASSWORD not set", { status: 500 });
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [user, pw] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === "admin" && pw === pass) return NextResponse.next();
  }
  return new NextResponse("Authorization required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}
```

- [ ] **Step 2: Helper for server actions**

```ts
// lib/auth.ts
import { headers } from "next/headers";

export async function requireAdmin() {
  const h = await headers();
  const auth = h.get("authorization");
  if (!auth?.startsWith("Basic ")) throw new Error("unauthorized");
  const [user, pw] = Buffer.from(auth.slice(6), "base64").toString().split(":");
  if (user !== "admin" || pw !== process.env.ADMIN_PASSWORD) throw new Error("unauthorized");
  return { user };
}
```

- [ ] **Step 3: Smoke**

Boot dev server, visit `/admin` — expect browser prompt for credentials. With `admin` / value of `ADMIN_PASSWORD` from `.env`, 404 (no page yet) is the expected state. Wrong password → 401.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(admin): basic-auth middleware on /admin/*"
```

---

## Task 9 — Design-system primitives (registry)

**Files:**
- Create: `components/registry/source-badge.tsx`, `components/registry/license-card.tsx`, `components/registry/entity-card.tsx`, `components/registry/asset-card.tsx`, `components/registry/count-rollup.tsx`, `components/site-header.tsx`, `components/site-footer.tsx`

- [ ] **Step 1: `site-header.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-white">
      <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logos/bluprynt.png" alt="Bluprynt" width={28} height={28} />
          <span className="text-sm tracking-[0.15em] font-semibold">BLUPRYNT · VERIFIED REGISTRY</span>
        </Link>
        <nav className="flex gap-8 text-sm">
          <Link href="/data-sources" className="text-black/60 hover:text-black">Data sources</Link>
          <Link href="/how-claiming-works" className="text-black/60 hover:text-black">How claiming works</Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `source-badge.tsx`**

```tsx
type Source = "esma_mica_register" | "bma_manual" | "issuer_asserted";
const labels: Record<Source, string> = {
  esma_mica_register: "ESMA MiCA Register",
  bma_manual: "Bermuda Monetary Authority",
  issuer_asserted: "Uploaded by issuer",
};
const styles: Record<Source, string> = {
  esma_mica_register: "bg-emerald-50 text-emerald-800 border-emerald-200",
  bma_manual: "bg-amber-50 text-amber-800 border-amber-200",
  issuer_asserted: "bg-black/5 text-black/70 border-black/10",
};
export function SourceBadge({ source }: { source: Source }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-[10px] tracking-[0.15em] font-semibold border ${styles[source]}`}>
      SOURCE · {labels[source].toUpperCase()}
    </span>
  );
}
```

- [ ] **Step 3: `license-card.tsx`**

```tsx
import { SourceBadge } from "./source-badge";

type Props = {
  source: "esma_mica_register" | "bma_manual" | "issuer_asserted";
  regulator: string;
  jurisdictionCountry: string;
  licenseType: string;
  licenseReference?: string | null;
  permittedActivities?: string[];
  passporting?: string[];
  sourceRetrievedAt: Date;
  reviewerName?: string | null;
  reviewerVerifiedAt?: Date | null;
};

const accent: Record<Props["source"], string> = {
  esma_mica_register: "border-l-emerald-500",
  bma_manual: "border-l-amber-500",
  issuer_asserted: "border-l-black/30",
};

export function LicenseCard(p: Props) {
  const updated = p.sourceRetrievedAt.toISOString().slice(0, 10);
  const subline =
    p.source === "esma_mica_register"
      ? `Source: ESMA MiCA Register · updated ${updated}`
      : p.source === "bma_manual"
      ? `Source: BMA · manually verified by ${p.reviewerName} on ${p.reviewerVerifiedAt?.toISOString().slice(0, 10)}`
      : `Source: uploaded by issuer · hash verified but content not independently confirmed`;
  return (
    <div className={`bg-white border border-black/10 border-l-4 ${accent[p.source]} p-6`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="text-lg font-semibold">{p.licenseType}</h4>
          <p className="text-sm text-black/60 mt-1">{p.regulator} · {p.jurisdictionCountry}</p>
        </div>
        <SourceBadge source={p.source} />
      </div>
      {p.licenseReference && (
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">REFERENCE · {p.licenseReference}</p>
      )}
      {p.permittedActivities?.length ? (
        <div className="mb-2">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-1">PERMITTED ACTIVITIES</p>
          <ul className="text-sm">{p.permittedActivities.map(a => <li key={a}>{a}</li>)}</ul>
        </div>
      ) : null}
      {p.passporting?.length ? (
        <div className="mb-2">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-1">PASSPORTED TO</p>
          <p className="text-sm">{p.passporting.join(", ")}</p>
        </div>
      ) : null}
      <p className="text-xs text-black/60 mt-4">{subline}</p>
    </div>
  );
}
```

- [ ] **Step 4: `entity-card.tsx`, `asset-card.tsx`, `count-rollup.tsx`, `site-footer.tsx`**

Implement each as small, server-rendered presentational components following the design system (sharp corners, `border-black/10`, opacity-based text hierarchy, wide-tracked uppercase labels). Full implementations:

```tsx
// components/registry/entity-card.tsx
import Link from "next/link";
export function EntityCard({ slug, legalName, jurisdiction, licenseCount }:
  { slug: string; legalName: string; jurisdiction: string; licenseCount: number }) {
  return (
    <Link href={`/entities/${slug}`} className="block bg-white border border-black/10 p-6 hover:border-black/30 transition-colors">
      <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">LEGAL ENTITY</p>
      <h3 className="text-lg font-semibold">{legalName}</h3>
      <p className="text-sm text-black/60 mt-1">{jurisdiction}</p>
      <p className="text-xs tracking-[0.15em] text-black/40 mt-4 font-semibold">
        {licenseCount} {licenseCount === 1 ? "LICENSE" : "LICENSES"}
      </p>
    </Link>
  );
}
```

```tsx
// components/registry/asset-card.tsx
import Link from "next/link";
export function AssetCard({ chain, address, symbol, name, issuanceRegime }:
  { chain: string; address: string; symbol: string; name: string; issuanceRegime: string }) {
  return (
    <Link href={`/assets/${chain}/${address}`} className="block bg-white border border-black/10 p-6 hover:border-black/30 transition-colors">
      <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">{chain.toUpperCase()}</p>
      <h3 className="text-lg font-semibold">{symbol} · {name}</h3>
      <p className="text-xs text-black/40 mt-2 font-mono">{address.slice(0, 8)}…{address.slice(-6)}</p>
      <p className="text-xs tracking-[0.15em] text-black/60 mt-4 font-semibold">REGIME · {issuanceRegime}</p>
    </Link>
  );
}
```

```tsx
// components/registry/count-rollup.tsx
export function CountRollup({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-8 mb-8">
      {items.map(i => (
        <div key={i.label}>
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">{i.label.toUpperCase()}</p>
          <p className="text-2xl font-semibold mt-1">{i.value}</p>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// components/site-footer.tsx
export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 mt-24 py-12">
      <div className="max-w-[1200px] mx-auto px-8 text-xs tracking-[0.15em] text-black/40 font-semibold">
        BLUPRYNT · VERIFIED ISSUER REGISTRY · POC
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(ui): registry presentational primitives"
```

---

## Task 10 — Rollup helpers

**Files:**
- Create: `lib/rollups.ts`

- [ ] **Step 1: Implement**

```ts
// lib/rollups.ts
import { db } from "./db";

export async function groupSummary(groupId: string) {
  const entities = await db.entity.findMany({
    where: { groupId },
    include: { licenses: true, issuedAssets: true },
  });
  const jurisdictions = new Set<string>();
  entities.forEach(e => e.licenses.forEach(l => jurisdictions.add(l.jurisdictionCountry)));
  const assetBySymbol = new Map<string, Set<string>>();
  entities.forEach(e => e.issuedAssets.forEach(a => {
    const chains = assetBySymbol.get(a.symbol) ?? new Set();
    chains.add(a.chain); assetBySymbol.set(a.symbol, chains);
  }));
  return {
    entityCount: entities.length,
    licensedJurisdictionCount: jurisdictions.size,
    assetSummaries: Array.from(assetBySymbol.entries()).map(([symbol, chains]) => ({
      symbol, chainCount: chains.size, chains: Array.from(chains),
    })),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(rollups): group-level summary computations"
```

---

## Task 11 — Registry homepage

**Files:**
- Create: `app/page.tsx` (replace placeholder)

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function Home() {
  const groups = await db.group.findMany({
    orderBy: { displayName: "asc" },
    include: { entities: { include: { licenses: true, issuedAssets: true } } },
  });
  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-2">Verified Issuer Registry</h1>
        <p className="text-black/60 mb-12 max-w-2xl">
          Primary-register–anchored profiles for regulated digital asset issuers.
          Each group exposes its legal entities, their licenses by jurisdiction, and the assets they issue on-chain.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map(g => {
            const entCount = g.entities.length;
            const licJurisdictions = new Set(g.entities.flatMap(e => e.licenses.map(l => l.jurisdictionCountry)));
            const assetCount = g.entities.reduce((n, e) => n + e.issuedAssets.length, 0);
            return (
              <Link key={g.id} href={`/groups/${g.slug}`} className="bg-white border border-black/10 p-8 hover:border-black/30 transition-colors">
                <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-3">GROUP</p>
                <h2 className="text-2xl font-semibold">{g.displayName}</h2>
                <p className="text-sm text-black/60 mt-2">{g.description}</p>
                <p className="text-xs tracking-[0.15em] text-black/40 mt-6 font-semibold">
                  {entCount} ENTITIES · {licJurisdictions.size} LICENSED JURISDICTIONS · {assetCount} ASSETS
                </p>
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(ui): registry homepage with group tiles"
```

---

## Task 12 — Group page

**Files:**
- Create: `app/groups/[slug]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { notFound } from "next/navigation";
import { resolveGroup } from "@/lib/slugs";
import { groupSummary } from "@/lib/rollups";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EntityCard } from "@/components/registry/entity-card";
import { CountRollup } from "@/components/registry/count-rollup";
import { AssetCard } from "@/components/registry/asset-card";
import Image from "next/image";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = await resolveGroup(slug);
  if (!group) notFound();
  const entities = await db.entity.findMany({
    where: { groupId: group.id },
    include: { licenses: true, issuedAssets: true },
    orderBy: { legalName: "asc" },
  });
  const summary = await groupSummary(group.id);
  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <div className="flex items-center gap-6 mb-8">
          {group.logoPath && <Image src={group.logoPath} alt="" width={64} height={64} />}
          <div>
            <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">GROUP</p>
            <h1 className="text-4xl font-semibold tracking-[-0.02em]">{group.displayName}</h1>
          </div>
        </div>
        <p className="text-lg text-black/70 max-w-3xl mb-8">{group.description}</p>
        <CountRollup items={[
          { label: "Legal entities", value: String(summary.entityCount) },
          { label: "Licensed jurisdictions", value: String(summary.licensedJurisdictionCount) },
          { label: "Assets deployed", value: summary.assetSummaries.map(a => `${a.symbol} · ${a.chainCount} chains`).join(", ") || "none" },
        ]} />

        <section className="mb-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">MEMBER ENTITIES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.map(e => (
              <EntityCard key={e.id} slug={e.slug} legalName={e.legalName}
                          jurisdiction={e.jurisdictionCountry} licenseCount={e.licenses.length} />
            ))}
          </div>
          <p className="text-xs text-black/40 mt-4">
            Licenses held by member entities: see entity pages. Groups do not hold licenses directly.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">ASSETS ACROSS THE GROUP</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.flatMap(e => e.issuedAssets).map(a => (
              <AssetCard key={a.id} chain={a.chain} address={a.address}
                         symbol={a.symbol} name={a.name} issuanceRegime={a.issuanceRegime} />
            ))}
          </div>
        </section>

        {group.commentary && (
          <section className="bg-surface border border-black/10 p-8">
            <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-3">WRITTEN BY BLUPRYNT</p>
            <div className="text-black/80 whitespace-pre-line">{group.commentary}</div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Manually verify once seed data exists.** Deferred — see Task 19.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(ui): group page"
```

---

## Task 13 — Entity page

**Files:**
- Create: `app/entities/[slug]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveEntity } from "@/lib/slugs";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LicenseCard } from "@/components/registry/license-card";
import { AssetCard } from "@/components/registry/asset-card";

export default async function EntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await resolveEntity(slug);
  if (!entity) notFound();
  const full = await db.entity.findUnique({
    where: { id: entity.id },
    include: { group: true, licenses: true, controlledWallets: true, issuedAssets: true },
  });
  if (!full) notFound();

  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <Link href={`/groups/${full.group.slug}`}
              className="text-xs tracking-[0.15em] text-black/60 font-semibold hover:text-black">
          ← {full.group.displayName.toUpperCase()}
        </Link>
        <h1 className="text-4xl font-semibold tracking-[-0.02em] mt-2">{full.legalName}</h1>
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-black/60">
          <span>Jurisdiction: {full.jurisdictionCountry}{full.jurisdictionSubdivision ? ` (${full.jurisdictionSubdivision})` : ""}</span>
          {full.lei && <span>LEI: <span className="font-mono">{full.lei}</span></span>}
          {full.registrationNumber && <span>Reg. no: {full.registrationNumber}</span>}
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.15em] font-semibold bg-blue-50 text-accent-blue">
            KYB · VERIFIED
          </span>
        </div>

        {full.coverageLimitationNote && (
          <div className="mt-6 bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <strong className="tracking-[0.15em] text-xs font-semibold block mb-1">COVERAGE LIMITATION</strong>
            {full.coverageLimitationNote}
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">LICENSES</h2>
          {full.licenses.length === 0 ? (
            <div className="bg-surface border border-black/10 p-6 text-sm text-black/70">
              No licenses recorded for this entity in the registry's covered jurisdictions.
              {full.coverageLimitationNote ? " See coverage limitation above." : ""}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {full.licenses.map(l => (
                <LicenseCard key={l.id}
                  source={l.source as any}
                  regulator={l.regulator}
                  jurisdictionCountry={l.jurisdictionCountry}
                  licenseType={l.licenseType}
                  licenseReference={l.licenseReference}
                  permittedActivities={l.permittedActivities ? JSON.parse(l.permittedActivities) : []}
                  passporting={l.passporting ? JSON.parse(l.passporting) : []}
                  sourceRetrievedAt={l.sourceRetrievedAt}
                  reviewerName={l.reviewerName}
                  reviewerVerifiedAt={l.reviewerVerifiedAt}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">CONTROLLED WALLETS</h2>
          {full.controlledWallets.length === 0 ? (
            <p className="text-sm text-black/60">No wallets bound.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {full.controlledWallets.map(w => (
                <li key={w.id} className="bg-white border border-black/10 px-4 py-3 flex justify-between">
                  <span className="font-mono">{w.chain} · {w.address}</span>
                  {w.attestationRef && <span className="text-black/40 text-xs">{w.attestationRef}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">ISSUED ASSETS</h2>
          {full.issuedAssets.length === 0 ? (
            <p className="text-sm text-black/60">{full.legalName} does not issue tokens.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {full.issuedAssets.map(a => (
                <AssetCard key={a.id} chain={a.chain} address={a.address}
                           symbol={a.symbol} name={a.name} issuanceRegime={a.issuanceRegime} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(ui): entity page with source-tiered license cards"
```

---

## Task 14 — Asset page

**Files:**
- Create: `app/assets/[chain]/[address]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function AssetPage({ params }: { params: Promise<{ chain: string; address: string }> }) {
  const { chain, address } = await params;
  const asset = await db.asset.findUnique({
    where: { chain_address: { chain, address } },
    include: { issuerEntity: { include: { group: true, licenses: true } }, linkedWhitePaper: true },
  });
  if (!asset) notFound();

  const related = asset.relatedGroupId
    ? await db.asset.findMany({
        where: { relatedGroupId: asset.relatedGroupId, NOT: { id: asset.id } },
      })
    : [];

  const regimeLabel =
    asset.issuanceRegime === "None"
      ? `No MiCA authorization · issuer not registered with ESMA as of ${new Date().toISOString().slice(0, 10)}`
      : asset.issuanceRegime === "DABA"
      ? `DABA (issuer licensed by BMA)`
      : `${asset.issuanceRegime} (${asset.issuerEntity.legalName})`;

  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">{asset.chain.toUpperCase()} · ASSET</p>
        <h1 className="text-4xl font-semibold tracking-[-0.02em] mt-2">{asset.symbol} · {asset.name}</h1>
        <p className="font-mono text-sm text-black/60 mt-2">{asset.address}</p>

        <section className="mt-10 bg-white border border-black/10 p-6">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">ISSUER OF RECORD</p>
          <Link href={`/entities/${asset.issuerEntity.slug}`}
                className="text-2xl font-semibold hover:text-accent-blue">
            {asset.issuerEntity.legalName}
          </Link>
          <p className="text-sm text-black/60 mt-1">
            Group: <Link href={`/groups/${asset.issuerEntity.group.slug}`} className="hover:text-accent-blue">
              {asset.issuerEntity.group.displayName}
            </Link>
          </p>
        </section>

        <section className="mt-6 bg-white border border-black/10 p-6">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">ISSUANCE REGIME</p>
          <p className="text-lg">{regimeLabel}</p>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">RELATED DEPLOYMENTS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/assets/${r.chain}/${r.address}`}
                      className="bg-white border border-black/10 p-4 hover:border-black/30 transition-colors">
                  <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">{r.chain.toUpperCase()}</p>
                  <p className="font-semibold mt-1">{r.symbol} · {r.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(ui): asset page with issuer-of-record + regime block"
```

---

## Task 15 — How claiming works page

**Files:**
- Create: `app/how-claiming-works/page.tsx`

- [ ] **Step 1: Implement**

Per spec §11, a static explainer page. No forms that submit. Sections:
1. Who can claim a profile (entity-level, group-level, wallet binding)
2. The three-step flow (KYB → binding → claimed)
3. What claiming changes on the page (badge, issuer-asserted document uploads)
4. What claiming does not change (register-derived data stays register-derived)
5. Dispute and correction

Use the Bluprynt type scale: hero `text-5xl font-semibold tracking-[-0.02em]`, section headers `text-2xl font-semibold`, numbered flow as three stacked cards. Include three PNG mockups placed under `public/mockups/claim-*.png` (Task 20 generates these; for now, link `alt` text + gray placeholder div with `bg-surface border border-black/10 aspect-[16/9]`).

Full page template:

```tsx
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function HowClaimingWorks() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-[900px] mx-auto px-8 py-16">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">EXPLAINER</p>
        <h1 className="text-5xl font-semibold tracking-[-0.02em] mt-3 mb-8">How claiming a registry profile works</h1>
        <p className="text-lg text-black/70 leading-[1.6] mb-12">
          This page describes the production claim flow. Claiming is not live during the PoC.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Who can claim</h2>
          <p className="text-black/70 leading-[1.6] mb-3">
            <strong>Entity-level claim</strong> — requires authority to represent the legal entity: officer, general counsel, or equivalent sign-off.
          </p>
          <p className="text-black/70 leading-[1.6] mb-3">
            <strong>Group-level claim</strong> — requires corporate authorization to represent the whole group.
          </p>
          <p className="text-black/70 leading-[1.6]">
            <strong>Wallet binding</strong> — requires an on-chain signature from the wallet, attributable to a claimed entity.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">The three-step flow</h2>
          <ol className="space-y-6">
            {[
              ["KYB verification", "Bluprynt verifies the claimant's authority to represent the entity."],
              ["Entity and wallet binding", "Signature challenge links the claimed wallet(s) to the verified entity."],
              ["Profile becomes claimed", "The registry profile switches from unclaimed to claimed across every page that references the entity or its assets."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-6">
                <span className="text-xs tracking-[0.15em] text-black/40 font-semibold mt-1 w-6">0{i + 1}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-black/70 mt-1">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What claiming changes</h2>
          <p className="text-black/70 leading-[1.6] mb-3">
            A <em>Claimed by issuer</em> badge appears on the entity page. The issuer-asserted documents section becomes available — white papers, authorization information documents, and policies can be uploaded, hashed, and timestamped by Bluprynt.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What claiming does not change</h2>
          <p className="text-black/70 leading-[1.6]">
            Register-derived data is not modifiable by the issuer. Licenses sourced from ESMA, BMA, or other regulators are the regulators' to correct. The issuer owns their narrative on issuer-asserted artifacts but not on regulator-sourced facts — that distinction is the registry's authority posture.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Disputes and corrections</h2>
          <p className="text-black/70 leading-[1.6]">
            A dispute process exists for contested register-derived data (for example, an issuer believes a license is mis-attributed). Contact <a href="mailto:registry@bluprynt.com" className="text-accent-blue">registry@bluprynt.com</a> with the specific field, the issuer of record, and the alternative reading of the primary register.
          </p>
        </section>

        <section>
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">FLOW MOCKUPS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Claim entry", "KYB step", "Post-claim profile"].map(label => (
              <div key={label}>
                <div className="bg-surface border border-black/10 aspect-[16/10]" aria-label={label} />
                <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mt-2">{label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(ui): how-claiming-works explainer"
```

---

## Task 16 — Data sources page

**Files:**
- Create: `app/data-sources/page.tsx`

- [ ] **Step 1: Implement**

Per spec §12. Sections:
1. Three trust tiers restated (ESMA, BMA, issuer-asserted — with the colored source pills)
2. MiCA / ESMA paragraph
3. BMA paragraph (manual verification framing)
4. Coverage limitations (explicit list of jurisdictions not covered)
5. What we do not scrape

```tsx
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SourceBadge } from "@/components/registry/source-badge";

export default function DataSources() {
  const notCovered = ["NYDFS (US)", "FCA (UK)", "MAS (Singapore)", "FINMA (Switzerland)", "FSA (Japan)",
                      "VARA (UAE)", "SEC (US, where distinct from state-level)", "BaFin direct (beyond MiCA)",
                      "ADGM / FSRA (Abu Dhabi)", "CNMV (Spain direct, beyond MiCA)", "Gibraltar GFSC"];
  return (
    <>
      <SiteHeader />
      <main className="max-w-[900px] mx-auto px-8 py-16">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">METHODOLOGY</p>
        <h1 className="text-5xl font-semibold tracking-[-0.02em] mt-3 mb-8">Data sources</h1>
        <p className="text-lg text-black/70 leading-[1.6] mb-12">
          Where this registry's data comes from, how current it is, and what we do — and do not — do to collect it.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">The three trust tiers</h2>
          <div className="space-y-5">
            {[
              ["esma_mica_register", "Register-derived", "We redisplay what a primary regulatory register publishes, as of the retrieval date."],
              ["bma_manual", "Bluprynt-verified", "Bluprynt's own attestation — KYB, wallet control, and (today) manual license confirmation."],
              ["issuer_asserted", "Issuer-asserted", "Issuer-provided artifacts that Bluprynt hashes and timestamps. We host; the issuer represents."],
            ].map(([src, title, body]) => (
              <div key={src} className="bg-white border border-black/10 p-5 flex items-start gap-4">
                <SourceBadge source={src as any} />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-black/70 mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">MiCA (ESMA interim register)</h2>
          <p className="text-black/70 leading-[1.6] mb-3">
            Source: ESMA's interim MiCA register, published as weekly CSVs covering white papers, ART issuers, EMT issuers, authorised CASPs, and non-compliant CASPs. ESMA's transition to an integrated IT system is expected by mid-2026.
          </p>
          <p className="text-black/70 leading-[1.6]">
            In the PoC, data is hand-curated into pilot seed files via our internal CSV importer. In production, this importer runs automatically with "last synced" timestamps shown per entity.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">BMA (Bermuda Monetary Authority)</h2>
          <p className="text-black/70 leading-[1.6]">
            BMA licensing data is sourced from the BMA's public register search at <a className="text-accent-blue" href="https://bma.bm/regulated-entities" target="_blank" rel="noreferrer">bma.bm/regulated-entities</a>. During the PoC, each BMA entry was manually verified by a Bluprynt reviewer against the public register and is labeled on every entity page with reviewer name and verification date. We are in active conversation with the Authority regarding a structured data feed for production.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Coverage limitations</h2>
          <p className="text-black/70 leading-[1.6] mb-4">
            Licenses held in the following jurisdictions are <strong>not</strong> currently reflected in the registry. The Paxos entity page demonstrates this concretely.
          </p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-black/80">
            {notCovered.map(j => <li key={j}>· {j}</li>)}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What we do not scrape</h2>
          <p className="text-black/70 leading-[1.6]">
            Bluprynt does not operate automated crawlers against regulator websites that restrict crawling. Where a regulator's public data is available only through a human-browsable interface and the regulator has not provided a structured feed, we perform manual verification by a human reviewer and label the data accordingly. We prefer to build regulator relationships and request structured data directly.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(ui): data-sources methodology page"
```

---

## Task 17 — Admin chrome + list views

**Files:**
- Create: `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/groups/page.tsx`, `app/admin/entities/page.tsx`, `app/admin/assets/page.tsx`

- [ ] **Step 1: Admin layout**

```tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    ["/admin", "Overview"],
    ["/admin/groups", "Groups"],
    ["/admin/entities", "Entities"],
    ["/admin/assets", "Assets"],
    ["/admin/imports", "MiCA import"],
  ];
  return (
    <div className="min-h-screen flex">
      <aside className="w-[260px] bg-primary text-white/80 p-6 flex flex-col gap-2">
        <div className="text-xs tracking-[0.15em] font-semibold text-white mb-6">BLUPRYNT · ADMIN</div>
        {nav.map(([href, label]) => (
          <Link key={href} href={href}
                className="text-sm px-3 py-2 hover:bg-white/10 hover:text-white">{label}</Link>
        ))}
        <Link href="/" className="text-xs tracking-[0.15em] text-white/40 mt-auto hover:text-white">← PUBLIC SITE</Link>
      </aside>
      <main className="flex-1 bg-surface p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Overview, groups list, entities list, assets list**

Each list view uses the shared pattern:
- Page title (`text-3xl font-semibold tracking-[-0.02em]`)
- Subtitle
- "New" button linking to `[resource]/new`
- Table via the shadcn `<Table>` primitive, with the design-system header cell styling

Example `app/admin/groups/page.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
export default async function AdminGroups() {
  const rows = await db.group.findMany({ orderBy: { displayName: "asc" }, include: { _count: { select: { entities: true } } } });
  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Groups</h1>
          <p className="text-black/60 mt-1">{rows.length} groups in registry.</p>
        </div>
        <Link href="/admin/groups/new" className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90">NEW GROUP</Link>
      </div>
      <table className="w-full bg-white border border-black/10">
        <thead><tr className="border-b border-black/5">
          {["NAME", "SLUG", "ENTITIES", ""].map(h =>
            <th key={h} className="text-left px-6 py-4 text-xs tracking-[0.15em] text-black/60 font-semibold">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-black/5 hover:bg-black/[0.02]">
              <td className="px-6 py-4 text-sm font-semibold">{r.displayName}</td>
              <td className="px-6 py-4 text-sm font-mono text-black/60">{r.slug}</td>
              <td className="px-6 py-4 text-sm">{r._count.entities}</td>
              <td className="px-6 py-4"><Link href={`/admin/groups/${r.id}`} className="text-accent-blue text-sm">Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

Repeat the same pattern for `entities` (columns: legal name, LEI, jurisdiction, group, licenses) and `assets` (columns: symbol, name, chain, address, issuer entity, regime).

Overview page (`app/admin/page.tsx`): a four-stat grid (Groups, Entities, Assets, Imports) pulling from `_count` queries, linking each to its list view.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(admin): chrome + list views"
```

---

## Task 18 — Admin forms: group, entity (source-aware), asset

**Files:**
- Create: `components/admin/group-form.tsx`, `components/admin/entity-form.tsx`, `components/admin/license-subform-mica.tsx`, `components/admin/license-subform-bma.tsx`, `components/admin/license-subform-asserted.tsx`, `components/admin/asset-form.tsx`
- Create: `app/admin/groups/new/page.tsx`, `app/admin/groups/[id]/page.tsx`
- Create: `app/admin/entities/new/page.tsx`, `app/admin/entities/[id]/page.tsx`
- Create: `app/admin/assets/new/page.tsx`, `app/admin/assets/[id]/page.tsx`
- Create: `app/admin/_actions.ts` (server actions)

**Form UX requirements (spec §10.3):**
- Source selector is prominent (not tucked inside an "advanced" accordion).
- Changing source swaps the subform; unsaved entries on the old subform are dropped (with a confirm).
- Live preview of the resulting license card renders next to the form.
- BMA subform: `reviewerName` and `reviewerVerifiedAt` are editable at creation and become read-only once saved. Re-verification creates a new license record.

- [ ] **Step 1: Server actions**

```ts
// app/admin/_actions.ts
"use server";
import { db } from "@/lib/db";
import { groupInput } from "@/lib/validators/group";
import { entityInput } from "@/lib/validators/entity";
import { assetInput } from "@/lib/validators/asset";
import { licenseInput } from "@/lib/validators/license";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGroup(form: FormData) {
  await requireAdmin();
  const parsed = groupInput.parse(Object.fromEntries(form));
  const g = await db.group.create({ data: parsed });
  revalidatePath("/admin/groups");
  redirect(`/admin/groups/${g.id}`);
}

export async function updateGroup(id: string, form: FormData) {
  await requireAdmin();
  const parsed = groupInput.parse(Object.fromEntries(form));
  await db.group.update({ where: { id }, data: parsed });
  revalidatePath(`/admin/groups/${id}`);
  revalidatePath(`/groups/${parsed.slug}`);
}

// Analogous createEntity / updateEntity / createAsset / updateAsset / createLicense
// Each calls requireAdmin(), validates with the appropriate zod schema, writes, revalidates.
```

Implement `createEntity`, `updateEntity`, `createAsset`, `updateAsset`, `createLicense`, `deleteLicense` following the same shape. License mutations store `permittedActivities` and `passporting` as `JSON.stringify(arr)`.

- [ ] **Step 2: GroupForm**

```tsx
// components/admin/group-form.tsx
import { createGroup, updateGroup } from "@/app/admin/_actions";

type Props = { mode: "new" | "edit"; initial?: { id: string; slug: string; displayName: string; description: string; website?: string | null; commentary?: string | null } };

export function GroupForm({ mode, initial }: Props) {
  const action = mode === "edit" && initial ? updateGroup.bind(null, initial.id) : createGroup;
  return (
    <form action={action as any} className="bg-white border border-black/10 p-8 max-w-[720px]">
      {["slug", "displayName", "description", "website"].map(f => (
        <div key={f} className="mb-6">
          <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{f.toUpperCase()}</label>
          <input name={f} defaultValue={(initial as any)?.[f] ?? ""} className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
        </div>
      ))}
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">COMMENTARY (WRITTEN BY BLUPRYNT)</label>
        <textarea name="commentary" defaultValue={initial?.commentary ?? ""} rows={6}
                  className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
      </div>
      <button type="submit" className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold">SAVE</button>
    </form>
  );
}
```

- [ ] **Step 3: EntityForm with source-aware license subforms**

Build `components/admin/entity-form.tsx` as a client component. It renders base entity fields plus a **license editor** with a radio source selector (`esma_mica_register | bma_manual | issuer_asserted`) that conditionally renders the corresponding subform. Next to the form, render a live `<LicenseCard>` preview using the current form state.

```tsx
"use client";
import { useState } from "react";
import { LicenseCard } from "@/components/registry/license-card";
import { LicenseSubformMica } from "./license-subform-mica";
import { LicenseSubformBma } from "./license-subform-bma";
import { LicenseSubformAsserted } from "./license-subform-asserted";

type Source = "esma_mica_register" | "bma_manual" | "issuer_asserted";

export function EntityLicenseEditor({ entityId, existing }: { entityId: string; existing: any[] }) {
  const [source, setSource] = useState<Source>("esma_mica_register");
  const [preview, setPreview] = useState({
    regulator: "ESMA/AFM", jurisdictionCountry: "FR",
    licenseType: "MiCA EMT authorization", licenseReference: "",
    permittedActivities: [] as string[], passporting: [] as string[],
    sourceRetrievedAt: new Date(), reviewerName: null as string | null, reviewerVerifiedAt: null as Date | null,
  });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">SOURCE</label>
        <div className="flex gap-2 mb-6">
          {(["esma_mica_register", "bma_manual", "issuer_asserted"] as Source[]).map(s => (
            <button key={s} type="button" onClick={() => setSource(s)}
                    className={`px-4 py-2 text-xs tracking-[0.15em] font-semibold border ${source === s ? "bg-primary text-white border-primary" : "border-black/10 text-black/60"}`}>
              {s.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
        {source === "esma_mica_register" && <LicenseSubformMica entityId={entityId} onChange={setPreview} />}
        {source === "bma_manual" && <LicenseSubformBma entityId={entityId} onChange={setPreview} />}
        {source === "issuer_asserted" && <LicenseSubformAsserted entityId={entityId} onChange={setPreview} />}
      </div>
      <div>
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">LIVE PREVIEW</p>
        <LicenseCard source={source} {...preview} />
      </div>
    </div>
  );
}
```

Each subform component is a thin uncontrolled form with explicit fields per the validator in `lib/validators/license.ts`. On change, it calls `onChange` with the current field set (so the parent preview stays in sync). On submit, it posts to `createLicense` with the right shape.

- [ ] **Step 4: AssetForm**

Similar shape to GroupForm. Select boxes for `chain`, `issuerEntityId` (populated from a Prisma query passed as prop), `issuanceRegime`.

- [ ] **Step 5: Hook up pages**

`app/admin/groups/new/page.tsx` → renders `<GroupForm mode="new" />`.
`app/admin/groups/[id]/page.tsx` → fetches the group and renders `<GroupForm mode="edit" initial={...} />`.
Same for entities (plus the license editor below the form) and assets.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(admin): source-aware entity forms with live preview"
```

---

## Task 19 — MiCA CSV import UI + server flow

**Files:**
- Create: `app/admin/imports/page.tsx`, `app/admin/imports/_preview.tsx`, `app/admin/imports/_actions.ts`, `components/admin/import-review-table.tsx`, `lib/esma/import.ts`

- [ ] **Step 1: Server flow — parse, reconcile, stash in memory**

Because the preview is reviewer-gated, persist the parsed diffs in an ephemeral table keyed by a session id rather than global state, so a refresh doesn't lose work but a server restart does. Create a lightweight `PendingImport` Prisma model:

```prisma
model PendingImport {
  id            String   @id @default(cuid())
  fileName      String
  esmaFileType  String
  diffsJson     String   // serialized EntityDiff[]
  reviewer      String
  createdAt     DateTime @default(now())
}
```

Run `npm run db:migrate -- --name pending-imports`.

- [ ] **Step 2: `lib/esma/import.ts` (server)**

```ts
"use server";
import { db } from "@/lib/db";
import { parseEsmaCsv } from "./parse";
import { reconcileRows } from "./map";
import type { EsmaFileType } from "./schemas";
import { requireAdmin } from "@/lib/auth";

export async function previewImport(fileName: string, fileType: EsmaFileType, csv: string, reviewer: string) {
  await requireAdmin();
  const parsed = parseEsmaCsv(csv, fileType);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const diffs = await reconcileRows(parsed.rows, fileType, new Date());
  const pending = await db.pendingImport.create({
    data: { fileName, esmaFileType: fileType, diffsJson: JSON.stringify(diffs), reviewer },
  });
  return { ok: true as const, pendingId: pending.id, diffs };
}

export async function commitImport(pendingId: string, acceptedIndexes: number[]) {
  await requireAdmin();
  const pending = await db.pendingImport.findUnique({ where: { id: pendingId } });
  if (!pending) throw new Error("not found");
  const diffs = JSON.parse(pending.diffsJson) as Array<any>;
  const batch = await db.importBatch.create({
    data: {
      fileName: pending.fileName,
      esmaFileType: pending.esmaFileType,
      reviewer: pending.reviewer,
      rowsConfirmed: acceptedIndexes.length,
      rowsRejected: diffs.length - acceptedIndexes.length,
    },
  });
  for (const i of acceptedIndexes) {
    const d = diffs[i];
    let entityId = d.matchedEntityId;
    if (!entityId && d.entityIncoming) {
      // Create entity without a group — reviewer must assign it afterwards.
      const orphanGroup = await ensureOrphanGroup();
      const e = await db.entity.create({
        data: {
          slug: slugifyNew(d.entityIncoming.legalName),
          legalName: d.entityIncoming.legalName,
          lei: d.entityIncoming.lei,
          jurisdictionCountry: d.entityIncoming.jurisdictionCountry,
          groupId: orphanGroup.id,
        },
      });
      entityId = e.id;
    }
    if (!entityId) continue;
    const li = d.licenseIncoming;
    await db.license.create({
      data: {
        entityId,
        source: "esma_mica_register",
        regulator: li.regulator,
        jurisdictionCountry: li.jurisdictionCountry,
        licenseType: li.licenseType,
        licenseReference: li.licenseReference,
        permittedActivities: JSON.stringify(li.permittedActivities),
        passporting: JSON.stringify(li.passporting),
        sourceRetrievedAt: new Date(li.sourceRetrievedAt),
        importBatchId: batch.id,
      },
    });
  }
  await db.pendingImport.delete({ where: { id: pendingId } });
  return { batchId: batch.id };
}

async function ensureOrphanGroup() {
  return db.group.upsert({
    where: { slug: "unassigned" },
    create: { slug: "unassigned", displayName: "Unassigned", description: "Entities created by CSV import awaiting manual group assignment.", },
    update: {},
  });
}
function slugifyNew(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
```

- [ ] **Step 3: `app/admin/imports/page.tsx`**

A client form: file input, file-type select (`emt | art | casp_authorized | casp_noncompliant | whitepapers`), reviewer text input. On submit, read the file in the browser as text and call `previewImport` as a server action. On success, redirect to `/admin/imports/[pendingId]/review`.

Actually, keep the route flat — the page shows:
- Upload form (top)
- If a `pendingId` query param is present, fetch the pending import and render the review table below

Use `searchParams` to switch views.

```tsx
import { previewImport, commitImport } from "@/lib/esma/import";
import { db } from "@/lib/db";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ pending?: string }> }) {
  const { pending } = await searchParams;
  if (pending) {
    const p = await db.pendingImport.findUnique({ where: { id: pending } });
    if (!p) return <p>Pending import not found.</p>;
    const diffs = JSON.parse(p.diffsJson);
    return <ImportReview pendingId={p.id} fileName={p.fileName} diffs={diffs} onCommit={commitImport} />;
  }
  return <UploadPanel onPreview={previewImport} />;
}
```

`UploadPanel` is a small client component. `ImportReview` (in `_preview.tsx` as a client component) renders a table with one row per diff showing:
- Matched entity (or "NEW" pill)
- Incoming legal name, LEI, jurisdiction
- Field-level diffs column (stringified)
- Accept/reject checkbox

A "Commit selected" button at the bottom calls `commitImport` with the accepted index array; on success, redirects to `/admin/imports?batch=<id>` which shows a confirmation.

- [ ] **Step 4: Manually QA with a fixture**

With dev server running and seed data loaded: navigate to `/admin/imports`, upload `public/fixtures/esma-emt-sample.csv` with type `emt`, confirm the preview shows Circle Europe matched and Paxos Estonia matched (after seed), commit, confirm licenses appear on the respective entity pages with the ESMA green source pill.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(admin): MiCA CSV import with reconciliation preview + commit"
```

---

## Task 20 — Seed data for four pilot issuers

**Files:**
- Create: `prisma/seed.ts`
- Create: `public/logos/{circle,tether,paxos,apex,bluprynt}.png` (hand-sourced; see note below)

**Logo sourcing:** each pilot group's logo is hand-sourced from its brand page (Circle, Tether, Paxos, Apex) + Bluprynt's own logo. If a specific brand asset is unavailable at seed time, commit a 256×256 placeholder PNG with the group initial on a neutral background — the registry functions either way.

- [ ] **Step 1: Author `prisma/seed.ts`**

The seed creates all four groups, their entities, their licenses, their controlled wallets, their assets, slug aliases, and `relatedGroupId`s for cross-chain groupings. Use real-ish data cross-referenced against spec §8:

```ts
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  await db.license.deleteMany();
  await db.controlledWallet.deleteMany();
  await db.asset.deleteMany();
  await db.entity.deleteMany();
  await db.slugAlias.deleteMany();
  await db.group.deleteMany();

  // CIRCLE
  const circle = await db.group.create({ data: {
    slug: "circle", displayName: "Circle",
    description: "Issuer of USDC and EURC; multi-entity group with EU, US, Irish, and Bermudian operations.",
    website: "https://www.circle.com", logoPath: "/logos/circle.png",
    commentary: null,
  }});
  const circleUS = await db.entity.create({ data: {
    slug: "circle-internet-financial-llc", legalName: "Circle Internet Financial, LLC",
    jurisdictionCountry: "US", jurisdictionSubdivision: "US-DE", registrationNumber: "5234567",
    groupId: circle.id,
  }});
  const circleEU = await db.entity.create({ data: {
    slug: "circle-internet-financial-europe-sas", legalName: "Circle Internet Financial Europe SAS",
    lei: "549300XFFE1Z1R9ZDY90", jurisdictionCountry: "FR", registrationNumber: "879237548",
    groupId: circle.id,
  }});
  const circleIE = await db.entity.create({ data: {
    slug: "circle-internet-financial-limited", legalName: "Circle Internet Financial Limited",
    jurisdictionCountry: "IE", registrationNumber: "636450", groupId: circle.id,
    coverageLimitationNote: "Central Bank of Ireland coverage not included in this PoC.",
  }});
  const circleBM = await db.entity.create({ data: {
    slug: "circle-internet-bermuda-limited", legalName: "Circle Internet Bermuda Limited",
    jurisdictionCountry: "BM", registrationNumber: "54321", groupId: circle.id,
  }});

  await db.license.create({ data: {
    entityId: circleEU.id, source: "esma_mica_register",
    sourceRetrievedAt: new Date("2026-04-10"),
    regulator: "AMF", jurisdictionCountry: "FR",
    licenseType: "MiCA EMT authorization", licenseReference: "549300XFFE1Z1R9ZDY90",
    permittedActivities: JSON.stringify(["Issuance of e-money tokens"]),
    passporting: JSON.stringify(["FR", "DE", "IE", "NL", "IT", "ES", "AT", "BE", "LU"]),
  }});

  await db.license.create({ data: {
    entityId: circleBM.id, source: "bma_manual",
    sourceRetrievedAt: new Date("2026-04-10"),
    regulator: "Bermuda Monetary Authority", jurisdictionCountry: "BM",
    licenseType: "DABA Class F", licenseReference: "DABA-2021-001",
    permittedActivities: JSON.stringify(["Full digital asset business activities"]),
    reviewerName: "Bluprynt Compliance", reviewerVerifiedAt: new Date("2026-04-10"),
  }});

  const usdcSymbolGroupId = "usdc-group";
  const usdcSol = await db.asset.create({ data: {
    chain: "solana", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC", name: "USD Coin", issuerEntityId: circleUS.id,
    issuanceRegime: "None", relatedGroupId: usdcSymbolGroupId,
  }});
  const usdcEth = await db.asset.create({ data: {
    chain: "ethereum", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC", name: "USD Coin", issuerEntityId: circleUS.id,
    issuanceRegime: "None", relatedGroupId: usdcSymbolGroupId,
  }});
  const usdcBase = await db.asset.create({ data: {
    chain: "base", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC", name: "USD Coin", issuerEntityId: circleUS.id,
    issuanceRegime: "None", relatedGroupId: usdcSymbolGroupId,
  }});

  // Slug aliases (old slug → same entity)
  await db.slugAlias.create({ data: { alias: "circle-inc", kind: "group", groupId: circle.id } });

  // TETHER
  const tether = await db.group.create({ data: {
    slug: "tether", displayName: "Tether",
    description: "Issuer of USDT, the largest stablecoin by supply.",
    website: "https://tether.to", logoPath: "/logos/tether.png",
    commentary: "Tether is not authorized under MiCA. Following MiCA's application in December 2024, USDT was removed from major EU-regulated exchange venues. Tether has publicly stated it is pursuing compliance in other jurisdictions.",
  }});
  const tetherOps = await db.entity.create({ data: {
    slug: "tether-operations-limited", legalName: "Tether Operations Limited",
    jurisdictionCountry: "VG", registrationNumber: "1840998", groupId: tether.id,
    coverageLimitationNote: "Tether Operations Limited is not registered with ESMA as a MiCA-authorized issuer as of 2026-04-10. Absence of a license record here reflects absence of authorization in the registry's covered jurisdictions, not an editorial claim.",
  }});
  const usdtSymbolGroupId = "usdt-group";
  await db.asset.createMany({ data: [
    { chain: "ethereum", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", issuerEntityId: tetherOps.id, issuanceRegime: "None", relatedGroupId: usdtSymbolGroupId },
    { chain: "solana", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", issuerEntityId: tetherOps.id, issuanceRegime: "None", relatedGroupId: usdtSymbolGroupId },
    { chain: "tron", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", symbol: "USDT", name: "Tether USD", issuerEntityId: tetherOps.id, issuanceRegime: "None", relatedGroupId: usdtSymbolGroupId },
  ]});

  // PAXOS
  const paxos = await db.group.create({ data: {
    slug: "paxos", displayName: "Paxos",
    description: "Regulated issuer of pyUSD and USDP; New York trust company with MiCA EMT authorization in Estonia.",
    website: "https://paxos.com", logoPath: "/logos/paxos.png",
  }});
  const paxosUS = await db.entity.create({ data: {
    slug: "paxos-trust-company-llc", legalName: "Paxos Trust Company, LLC",
    jurisdictionCountry: "US", jurisdictionSubdivision: "US-NY",
    registrationNumber: "NY-LTC-2015",
    groupId: paxos.id,
    coverageLimitationNote: "Licensed by NYDFS as a limited-purpose trust company. NYDFS coverage is not included in this PoC; the license held by Paxos Trust Company does not appear in this registry's license records until NYDFS is added as a covered jurisdiction.",
  }});
  const paxosEE = await db.entity.create({ data: {
    slug: "paxos-issuance-europe-ou", legalName: "Paxos Issuance Europe OÜ",
    lei: "549300A7ABCDEF123456", jurisdictionCountry: "EE",
    registrationNumber: "16456789", groupId: paxos.id,
  }});
  await db.license.create({ data: {
    entityId: paxosEE.id, source: "esma_mica_register",
    sourceRetrievedAt: new Date("2026-04-10"),
    regulator: "Finantsinspektsioon", jurisdictionCountry: "EE",
    licenseType: "MiCA EMT authorization", licenseReference: "549300A7ABCDEF123456",
    permittedActivities: JSON.stringify(["Issuance of e-money tokens"]),
    passporting: JSON.stringify(["EE", "FI", "IE", "NL", "DE", "FR"]),
  }});
  const pyusdGroup = "pyusd-group";
  await db.asset.createMany({ data: [
    { chain: "solana", address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo", symbol: "pyUSD", name: "PayPal USD", issuerEntityId: paxosUS.id, issuanceRegime: "None", relatedGroupId: pyusdGroup },
    { chain: "ethereum", address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", symbol: "pyUSD", name: "PayPal USD", issuerEntityId: paxosUS.id, issuanceRegime: "None", relatedGroupId: pyusdGroup },
  ]});

  // APEX
  const apex = await db.group.create({ data: {
    slug: "apex-group", displayName: "Apex Group",
    description: "Financial services provider; Bermudian fund administration and digital asset services entity included here.",
    website: "https://theapexgroup.com", logoPath: "/logos/apex.png",
  }});
  const apexBM = await db.entity.create({ data: {
    slug: "apex-fund-services-bermuda-ltd", legalName: "Apex Fund Services (Bermuda) Ltd",
    jurisdictionCountry: "BM", registrationNumber: "34567", groupId: apex.id,
  }});
  await db.license.create({ data: {
    entityId: apexBM.id, source: "bma_manual",
    sourceRetrievedAt: new Date("2026-04-10"),
    regulator: "Bermuda Monetary Authority", jurisdictionCountry: "BM",
    licenseType: "Fund administration services",
    permittedActivities: JSON.stringify(["Fund administration", "Digital asset service provision"]),
    reviewerName: "Bluprynt Compliance", reviewerVerifiedAt: new Date("2026-04-10"),
  }});

  console.log("Seeded 4 groups, ~9 entities, ~5 licenses, ~8 assets.");
}

main().finally(() => db.$disconnect());
```

- [ ] **Step 2: Run seed**

```bash
npm run db:seed
```

Expected console line and a populated `dev.db`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(seed): four pilot issuers per spec §8"
```

---

## Task 21 — Walkthrough QA + polish

**Files:** cross-cutting; touches any page that fails the walkthrough in §9.

- [ ] **Step 1: Run `npm run dev` and walk the spec §9 path end-to-end**

Use a browser to visit in order:
1. `/groups/circle` → confirm entity cards, rollup counts, click through to `circle-internet-financial-europe-sas` → confirm green ESMA license card with updated date; click through to `circle-internet-bermuda-limited` → confirm amber BMA license card with reviewer name + date.
2. From Circle EU entity, navigate to an asset via the assets section or homepage.
3. `/groups/tether` → confirm the Bluprynt commentary renders; entity page shows zero licenses with the coverage-limitation note; asset pages show "No MiCA authorization found…".
4. `/groups/paxos` → confirm the EE entity's MiCA license renders and the US entity's coverage-limitation note renders.
5. `/groups/apex-group` → confirm the service-provider treatment: license present, assets section empty with "Apex Group does not issue tokens."
6. `/how-claiming-works` and `/data-sources` render.
7. `/admin/imports` accepts the EMT fixture and shows the reconciliation preview with matched/new rows.

Note any visual or content defects. Fix in place.

- [ ] **Step 2: Lighthouse + responsiveness spot-check**

Resize to 375px width. Header, group grid, entity page license cards, and admin tables should all remain legible (table can scroll horizontally). Fix any overflow issues with `overflow-x-auto`.

- [ ] **Step 3: `npm run build`**

```bash
npm run build
```
Expected: success. Fix any type errors.

- [ ] **Step 4: Update `README.md`**

Document: purpose (link to `spec.md`), tech stack, `npm install && cp .env.example .env && npm run db:migrate && npm run db:seed && npm run dev`, admin URL + credentials note, walkthrough steps mirroring §9.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: walkthrough QA, build fixes, README"
```

---

## Done criteria (per spec §9)

A viewer can complete the six-step walkthrough in §9 in 5–10 minutes with:
- Clear source-tier distinction on license cards (green ESMA, amber BMA)
- Honest "no MiCA authorization" treatment on Tether
- Explicit coverage-limitation note on Paxos US entity
- Apex service-provider page with empty assets section and explanatory text
- Working `/how-claiming-works` and `/data-sources`
- Working `/admin/imports` preview + commit against the EMT fixture

Nothing on the §3.3 deferred list is implemented.
