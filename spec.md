# Verified Issuer Registry — PoC Spec

**Status:** Draft for internal review
**Audience:** Leadership, investors, partner meetings (not public)
**Scope:** Proof of concept for the Bluprynt verified issuer registry, extending `verified.bluprynt.com` from its current asset-centric model to a group → entity → asset hierarchy anchored in primary-register data.

---

## 1. What this is, and what it is not

This PoC exists to make the registry concept legible in a room — to show leadership, prospective investors, and integration partners a working artifact that answers the question "what are you actually building here?" with something they can click through, not just a pitch deck.

It is not a production launch. It does not onboard real issuers publicly. It does not have a public-facing claim flow. It does not run scheduled ingestion against regulator data at scale. It is a four-issuer demonstration of the architecture, the information model, the public-facing UI, and the internal reviewer workflow — scoped to be buildable by Claude Code in approximately one to two weeks of focused work, the largest single cost being the MiCA CSV importer and its reconciliation logic.

The decision this PoC is meant to support is: *is the three-object registry model (group, entity, asset) the right direction for Bluprynt's next product surface, and does it resonate with the partners and investors we'd need behind it to ship the production version?* A secondary decision it supports is whether the internal sourcing workflow — admin panel plus CSV importer plus manual BMA verification — is the right shape for the production ops model, since the PoC version of this workflow is close enough to the production version that lessons transfer.

## 2. Why this exists, in one paragraph

`verified.bluprynt.com` today binds token addresses to KYB-verified issuer wallets via on-chain attestation. That is strong primitive infrastructure but it treats each asset deployment as independent. Real regulated issuers are not shaped like that: they are groups of legal entities, each holding specific licenses in specific jurisdictions, each issuing specific assets under specific regulatory regimes, across multiple chains. The existing per-asset page cannot express that structure. The registry PoC introduces three first-class objects — group, entity, asset — whose relationships and sourcing transparency match how regulated digital asset issuance actually works, and whose public URLs give integration partners (exchanges, explorers, custodians, aggregators) a canonical destination to deep-link from verification badges.

## 3. In scope, deferred, and out of scope

### 3.1 In scope (build)

- The three-object data model: group, entity, asset
- Three page types: group, entity, asset, with the IA defined in section 6
- URL structure with canonical IDs and slug aliases (section 5)
- Pilot data for four issuers (section 8)
- Trust-tier UI differentiation (register-derived vs Bluprynt-verified vs issuer-asserted)
- Logos for the four pilot groups, hand-sourced from each group's brand assets or press kit
- A "How claiming works" explainer page describing the production claim flow in prose and static mockups (section 11)
- A "Data sources" page describing ingestion model and source transparency (section 12)
- An internal admin panel for Bluprynt reviewers to create and edit groups, entities, and assets, with source-specific forms (section 10)
- A MiCA CSV importer that ingests ESMA's interim register files and populates entity/license records, with reviewer confirmation before persisting (section 10)

### 3.2 Sourcing in the PoC

- **MiCA CSV data** — fetched manually or uploaded into the admin panel, parsed by a CSV importer that maps ESMA interim-register fields to the entity and license data model. A reviewer confirms the mapping before records are persisted. The importer handles the five ESMA files (white papers for non-ART/EMT, ART issuers, EMT issuers, authorized CASPs, non-compliant CASPs) with the schema published by ESMA. The importer is not a scheduled pipeline — it runs on reviewer action — but it demonstrates the production ingestion model end-to-end for the four pilot issuers and for any additional MiCA-registered entities a demo viewer might ask about.
- **BMA data** — manually verified by a Bluprynt reviewer using the BMA public search page (`bma.bm/regulated-entities`) as a human-in-browser lookup, entered into the admin panel via a BMA-specific form that records reviewer name and date of verification. No automated crawler. A parallel workstream — a direct request to the BMA FinTech Department for a structured data feed — runs outside the PoC timeline and is referenced in the "Data sources" page as the intended production path.
- **Logos** — hand-sourced per pilot group from the group's own brand/press resources, uploaded through the admin panel or committed as static assets. Four logos, one-time cost.
- **Issuer-asserted documents** (white papers, AIDs) — the admin panel supports upload and hash generation, though this is not exercised in the PoC seed data. The functionality is built so that the narrative of "issuer uploads a document, Bluprynt hashes and timestamps it" is demonstrable if a viewer asks.

### 3.3 Out of scope

Stated explicitly so it does not creep back in during build:

- Automated BMA scraping (see 3.2; see also section 12 for why)
- Scheduled / automated MiCA CSV refresh (the importer runs on reviewer action, not on a cron)
- Automated entity matching across sources beyond LEI equality (fuzzy name matching, registration-number reconciliation across jurisdictions, and similar are production concerns; the PoC relies on the reviewer to confirm matches at import time)
- Public claim flow with working KYB — the flow is demonstrated via an explainer page and static mockups, not a functioning implementation
- End-user authentication, accounts, sessions, OAuth (admin panel uses a single shared password; no user-facing auth)
- Dispute resolution, takedown policy, incident response
- Terms of service, privacy policy, cookie banners
- On-chain attestation rewrite (the existing attestation layer on `verified.bluprynt.com` continues as-is; the PoC is about the registry model and surface, not the attestation mechanism)
- Production coverage disclosure UX beyond what's in the "Data sources" page
- Multi-language, SEO, performance, caching
- Mobile-optimized layouts beyond responsive basics
- Revocation and stale-state handling (noted as a production concern; not demonstrated in the PoC)
- Any NYDFS, FCA, or other non-MiCA, non-BMA data — these are demonstrated as *absent coverage* via Paxos, not as present coverage

If a question during build is "should this PoC also do X" and X is on this list, the answer is no, and the correct action is to add it to the production backlog.

## 4. Data model

Three first-class objects. Every page, every URL, every piece of the UI derives from this model.

### 4.1 Group

A corporate family or brand under common control. Not a regulatory obligor. Not an LEI holder. Useful for discovery and for aggregating the picture of a multi-entity issuer into one place.

Fields:

- `group_id` — internal stable ID, immutable, canonical
- `slug` — human-readable identifier used in URLs, mutable, with old slugs preserved as permanent redirects
- `display_name` — the brand/common name ("Circle", "Tether", "Paxos", "Apex Group")
- `description` — one short paragraph, editorial, written by Bluprynt, not sourced from a register
- `website` — the group's canonical marketing website
- `member_entities` — list of `entity_id` references
- `linked_assets_summary` — computed rollup from entities' assets (not stored)

### 4.2 Entity

A legal entity. The unit at which regulatory obligations attach. The KYB-verifiable unit. Keyed on LEI where available, internal ID otherwise.

Fields:

- `entity_id` — internal stable ID, immutable, canonical
- `slug` — URL identifier, mutable, redirects preserved
- `legal_name` — full legal name as it appears in the primary register ("Circle Internet Financial Europe SAS")
- `lei` — 20-character Legal Entity Identifier, where assigned
- `jurisdiction_of_incorporation` — ISO country code, and sub-national where relevant
- `registration_number` — national registration number (SIREN, companies house number, Bermuda registration number, etc.)
- `parent_group` — `group_id` reference
- `licenses` — list of license records (see 4.4)
- `controlled_wallets` — list of wallet addresses and chains, with source attestation (from existing `verified.bluprynt.com` KYB binding)
- `issued_assets` — list of `asset_id` references
- `status` — `active` | `wound_down` | `revoked` (seeded manually; revocation/staleness automation is out of scope)

### 4.3 Asset

A specific token deployment on a specific chain. The existing `verified.bluprynt.com` object, extended with pointers up to the entity and group.

Fields:

- `asset_id` — internal stable ID
- `chain` — chain identifier (`solana`, `ethereum`, `base`, `polygon`, etc.)
- `address` — contract address on the chain
- `symbol` — ticker (USDC, USDT, pyUSD)
- `name` — token name
- `issuer_of_record_entity` — `entity_id` reference; the specific legal entity that is the regulatory obligor for this deployment
- `issuance_regime` — `MiCA-EMT`, `MiCA-ART`, `MiCA-Other`, `DABA`, `None` (explicitly modeled — absence of regulation is information, not a gap)
- `related_deployments` — list of other `asset_id` references for the same branded asset on other chains (used for the "USDC on 15 chains" rollup)
- `linked_white_paper` — reference to issuer-asserted document where applicable
- `on_chain_attestation_ref` — pointer to the existing `verified.bluprynt.com` attestation record

### 4.4 License (embedded in entity)

Not a top-level object for the PoC, but structured enough that the trust-tier UX can render correctly.

Fields:

- `source` — enum: `esma_mica_register`, `bma_manual`, `issuer_asserted`
- `source_retrieved_at` — datetime
- `regulator` — "ESMA/AFM", "BMA", etc.
- `jurisdiction` — ISO country code
- `license_type` — "MiCA EMT authorization", "MiCA CASP authorization", "DABA Class F", "DABA Class M", etc.
- `license_reference` — regulator-issued reference number where available
- `permitted_activities` — structured list where the source provides them (MiCA service codes, DABA activity classes)
- `passporting` — list of member states (MiCA only)
- `status` — `active` | `withdrawn` | `suspended`

## 5. URL structure

Canonical routes, all under `verified.bluprynt.com`:

- `/groups/{group_id}` — canonical group URL, e.g. `/groups/g_01HQ3X...`
- `/groups/{slug}` — human-friendly alias, 301s to canonical. E.g. `/groups/circle` → `/groups/g_01HQ3X...`
- `/entities/{entity_id}` — canonical entity URL
- `/entities/{slug}` — human-friendly alias
- `/assets/{chain}/{address}` — existing URL structure, preserved

Existing deep-links from Solana Explorer and other integration partners to `/assets/{chain}/{address}` continue to work without change. The group and entity URLs are new surface, not a migration.

The canonical-ID-plus-slug-alias pattern is deliberately the same pattern GitHub uses for user and org pages. The API returns canonical URLs; humans share slug URLs; both resolve correctly; slugs are mutable without breaking partner integrations.

## 6. Page information architecture

Three page types. The IA of each is where the spec spends most of its weight, because the IA is what makes or breaks the demo.

### 6.1 Group page (`/groups/{slug}`)

**Purpose:** Orient the viewer to the corporate family. Answer "what is Circle, across all its forms?"

**Above-the-fold:**

- Display name ("Circle")
- One-sentence description
- Count rollups: "4 legal entities · 2 jurisdictions with verified licenses · 1 asset deployed on 15 chains"
- Member entity cards (clickable, each linking to the entity page)

**Below the fold:**

- Aggregated assets view — all assets across all member entities, grouped by symbol (so USDC appears once with a chain count, not 15 times)
- Bluprynt commentary section — short editorial text, clearly labeled "Written by Bluprynt" — used for Tether and Paxos specifically to handle the "no MiCA authorization" narrative honestly (see 8.2)

**Not on the group page:** licenses. Licenses attach to entities, not groups. Rolling them up would imply the group holds licenses it does not hold. The group page shows "Licenses held by member entities: see entity pages" rather than aggregating.

### 6.2 Entity page (`/entities/{slug}`)

**Purpose:** Present the regulatory reality of a specific legal entity. This is where regulatory obligations attach and this is where the trust-tier UX must be most rigorous.

**Above-the-fold:**

- Legal name
- Jurisdiction of incorporation, registration number, LEI
- Parent group link
- Verification status from existing Bluprynt KYB (when this entity has gone through KYB — for the PoC, all seeded entities show as verified)

**Licenses section — the critical UX:**

Each license card must visually and textually communicate its source. Three distinct renderings:

- **ESMA MiCA register source:** light-green accent; label "Source: ESMA MiCA Register · updated [date]"; license fields populated from CSV
- **BMA manual source:** amber accent; label "Source: Bermuda Monetary Authority · manually verified by Bluprynt on [date]"; license fields populated from reviewer entry
- **Issuer-asserted (not used in PoC but structure prepared):** gray accent; label "Source: uploaded by issuer · hash verified but content not independently confirmed"

The color accents are meaningful encoding, not decoration. The label is authoritative, not a caveat. A viewer who skims the page should come away with an accurate mental model of what Bluprynt verified versus what Bluprynt merely hosts.

**Controlled wallets section:** list of wallets bound to this entity via existing KYB attestation, with chain and attestation reference. Clickable to the asset page for each.

**Issued assets section:** list of assets where this entity is the issuer-of-record, grouped by asset symbol.

### 6.3 Asset page (`/assets/{chain}/{address}`)

**Purpose:** Present a specific token deployment, with the enhancement that it now surfaces *which legal entity* is the issuer-of-record under *which regulatory regime* for *this specific deployment*.

The existing page structure (from `verified.bluprynt.com`) is preserved. The additions for the PoC:

- "Issuer of record" block — prominently displayed, links to the entity page. For USDC on Ethereum this is Circle Internet Financial, LLC (US); for USDC on a jurisdiction where Circle's EU entity is the regulatory obligor, that entity appears here instead
- "Issuance regime" — explicitly labeled. "MiCA EMT (Circle Internet Financial Europe SAS)", "No MiCA authorization · issuer not registered with ESMA as of [date]", "DABA (issuer licensed by BMA)", etc.
- "Related deployments" — sibling assets on other chains, linking to each

## 7. Sourcing and trust tiers

Three tiers, carried through every piece of the UI:

1. **Register-derived** (ESMA MiCA CSV) — Bluprynt's claim is "this is what the primary register says, as of [date]." Liability: low, because Bluprynt is redisplaying public primary-source data.
2. **Bluprynt-verified** (KYB-verified entity identity, wallet control, manual BMA license verification) — Bluprynt is the attestor. Liability: high. The PoC relies on the existing KYB verification process for identity and wallet binding; manual BMA license verification is done by a Bluprynt reviewer checking the BMA entity search page and recording the result.
3. **Issuer-asserted** (white papers, policy documents, self-provided information) — Bluprynt hosts and hashes; the issuer represents. Not used in the PoC seed data but the data model supports it and the UI treatment is defined for the production version.

The PoC demo uses tiers 1 and 2 only. Tier 3 is documented but not exercised.

## 8. Pilot issuers

Four issuers, chosen to stress-test different parts of the model. For each, the spec below lists the group, the entities, the licenses, and the narrative role in the demo.

### 8.1 Circle — the multi-entity group case

**Group:** Circle

**Entities to seed:**

- Circle Internet Financial, LLC (US Delaware)
- Circle Internet Financial Europe SAS (France, MiCA EMT authorization) — sourced from ESMA register
- Circle Internet Financial Limited (Ireland) — if present in the ESMA register; otherwise seeded as a non-licensed entity for completeness
- Circle Internet Bermuda Limited (Bermuda, DABA Class F) — sourced from BMA manual verification

**Assets to seed:** USDC on Solana, Ethereum, Base. Three is sufficient to demonstrate the "related deployments" rollup without pretending to have 15.

**Narrative role:** the centerpiece. Demonstrates every hard case — multi-entity group, multi-jurisdiction licensing, MiCA and DABA sourcing side by side, multi-chain asset with jurisdiction-specific issuer-of-record.

### 8.2 Tether — the non-authorization case

**Group:** Tether

**Entities to seed:**

- Tether Operations Limited (BVI) — no MiCA, no BMA, appears in the registry with no licenses

**Assets to seed:** USDT on Ethereum, Solana, Tron. Three deployments, no MiCA authorization for any, displayed honestly.

**Narrative role:** demonstrates that the registry differentiates between verified-compliant and simply-not-covered. The UI language must be precise: "No MiCA authorization found in ESMA register as of [date]" — not "unregulated," not editorial, just factual about what the primary register does and does not say. Bluprynt commentary on the group page can contextualize this (e.g., "Tether is not authorized under MiCA; USDT was removed from major EU-regulated exchanges following MiCA's application in December 2024") but the entity and asset pages must stay descriptive.

This is the highest-signal element of the demo. It is also the element most likely to generate pushback from a Tether-adjacent partner. The spec accepts this tradeoff deliberately: without Tether, the registry reads as a list of Bluprynt's compliant friends, not as an honest view of the market.

### 8.3 Paxos — the partial-coverage case

**Group:** Paxos

**Entities to seed:**

- Paxos Trust Company, LLC (US New York) — seeded with a note "Licensed by NYDFS; NYDFS coverage not included in this PoC" to make the coverage limitation explicit
- Paxos Issuance Europe OÜ (Estonia, MiCA EMT authorization) — sourced from ESMA register

**Assets to seed:** pyUSD on Solana and Ethereum. USDP optional; prefer pyUSD because it's more recent and the MiCA authorization is cleaner to narrate.

**Narrative role:** demonstrates coverage limits honestly. Paxos has meaningful US regulatory status that the registry cannot yet show. Instead of silently dropping it, the PoC surfaces "licenses held in jurisdictions not yet covered" as a first-class concept. This is the concrete instance of the coverage-disclosure UX that every production jurisdiction will eventually need.

### 8.4 Apex Group — the service-provider case

**Group:** Apex Group

**Entities to seed:**

- Apex Fund Services (Bermuda) Ltd — sourced from BMA manual verification (fund administration and related digital asset services)

**Assets to seed:** none. Apex is a service provider, not a token issuer.

**Narrative role:** demonstrates that the registry handles CASP-style service providers alongside token issuers. Without Apex, a viewer might assume the registry is token-only. The entity page for Apex shows licenses and permitted activities but the assets section is empty and labeled "Apex Group does not issue tokens."

## 9. What the demo walkthrough looks like

The test of the spec: can a leadership/investor/partner viewer walk through these four issuers in 5-10 minutes and come away with the model? The intended demo path:

1. Land on `/groups/circle`. See the multi-entity structure. Click through to Circle Internet Financial Europe SAS, see the ESMA-sourced MiCA license. Click through to the Bermuda entity, see the BMA-sourced DABA license. Note the visual distinction between the two source tiers.
2. Click through to USDC on Solana via the entity page. See the issuer-of-record block pointing back to Circle Internet Financial, LLC. See the issuance regime.
3. Navigate to `/groups/tether`. See the absence of licenses, clearly labeled. See the Bluprynt commentary contextualizing it. Click through to USDT on Ethereum; see the "no MiCA authorization" treatment.
4. Navigate to `/groups/paxos`. See the Estonia entity with MiCA authorization and the US entity with the coverage-limitation note. Note how the registry honestly handles the gap.
5. Navigate to `/groups/apex-group`. See the service-provider treatment.
6. Visit `/how-claiming-works` to answer the inevitable "so how does an issuer get on here?" question. Visit `/data-sources` to answer the inevitable "where does the data come from and how fresh is it?" question. These two pages are load-bearing for the demo — they resolve the questions that an investor or partner will ask in the first five minutes and that a live-but-incomplete claim flow would raise without answering.
7. If a viewer wants to see the sourcing workflow, open `/admin` and run the CSV importer against a fresh ESMA file, showing the reconciliation preview and the reviewer confirmation step. This is an optional path — most demo viewers will not ask — but it's available when the conversation turns to "show me how the data actually gets in."

If a viewer can do this walkthrough and articulate back the three-object model, the three trust tiers, and the coverage-disclosure pattern, the PoC has done its job.

## 10. Admin panel and CSV importer

**Purpose:** Give a Bluprynt reviewer the tools to create and maintain profile data for the four pilot issuers, demonstrate the sourcing workflow to a demo viewer who asks "how does this data actually get in here," and match the production ingestion model closely enough that the design decisions made here transfer forward rather than being thrown away.

### 10.1 Access and auth

Single shared password, environment-variable configured. No user accounts, no roles, no permissions. Access behind a simple HTTP challenge at `/admin/*`. This is a deliberate non-feature: production will need proper auth, but proper auth is a week of distraction work for a PoC whose demo audience will never see the admin panel live.

### 10.2 Core admin views

The admin panel is a small set of list-and-form pages. Nothing fancy — the goal is functional, not beautiful.

- **`/admin/groups`** — list of groups with search. Click to edit. "New group" button.
- **`/admin/entities`** — list of entities with search, filterable by parent group and by jurisdiction. Click to edit.
- **`/admin/assets`** — list of assets, filterable by chain and by issuer-of-record entity. Click to edit.
- **`/admin/imports`** — entry point for the MiCA CSV importer (see 10.4).

### 10.3 Source-aware entity forms

This is the part that matters for the demo narrative. The entity edit form has a **source selector** that controls which subsequent fields appear and how the resulting license record renders on public pages.

**Source: ESMA MiCA register**
- Populated via the CSV importer (see 10.4). Reviewer can edit imported values but changes are flagged in the record metadata.
- Required fields: LEI, legal name, home member state, authorization type (EMT / ART / CASP), authorization date, competent authority, service codes (for CASPs), passporting member states.
- Resulting license card on the public entity page renders with the green register-derived accent and the "Source: ESMA MiCA Register · updated [date]" label from section 6.2.

**Source: BMA manual verification**
- Free-entry form for the reviewer, used after a human-in-browser lookup on `bma.bm/regulated-entities`.
- Required fields: legal name, Bermuda registration number, DABA license class (T / M / F), permitted activities, license date, *reviewer name*, *date of verification*. The last two appear in the public-facing source label and are non-editable after save (re-verification creates a new record, not an edit).
- Resulting license card renders with the amber Bluprynt-verified accent and the "Source: BMA · manually verified by [reviewer] on [date]" label.

**Source: Issuer-asserted**
- Free-entry form with a file upload field for the asserted document.
- Bluprynt computes and stores the document hash, timestamp, and uploader identity.
- Required fields: document type (white paper, AID, policy), issuer-of-record entity, effective date.
- Resulting rendering is the gray issuer-asserted accent with the "Source: uploaded by issuer · hash verified but content not independently confirmed" label.

The source selector is prominent, not hidden in an advanced section. A reviewer who miscategorizes a data source is the main way the trust-tier UX fails, so the form is designed to make the choice obvious and to make the consequences of the choice visible (a live preview of how the resulting license card will render).

### 10.4 MiCA CSV importer

The importer ingests ESMA's interim register CSVs. It is not scheduled — a reviewer triggers it manually, typically after downloading the latest weekly CSVs from the ESMA website.

**Flow:**

1. Reviewer downloads the relevant CSV(s) from ESMA and uploads them via `/admin/imports`. Importer accepts any of the five ESMA files (white papers for non-ART/EMT, ART issuers, EMT issuers, authorized CASPs, non-compliant CASPs).
2. Importer parses the file, applying the documented ESMA field-to-data-model mapping. Parse errors and schema mismatches surface immediately, not silently.
3. Importer produces a **reconciliation preview** showing, for each row in the CSV:
   - Whether it matches an existing entity in the registry (by LEI equality, which is exact match — no fuzzy matching in the PoC)
   - What will be created if no match exists
   - What will be updated if a match exists, with a field-level diff
   - Whether the reviewer should manually link the row to an existing entity that has no LEI (rare but possible)
4. Reviewer reviews the preview, can reject individual rows, and confirms. Only confirmed rows persist.
5. Each persisted record stores the import source (ESMA), the file name and import timestamp, and the reviewer who confirmed it.

**Deliberate limitations in the PoC:**

- Matching is LEI-equality only. Rows without an LEI, or rows whose LEI doesn't match an existing record, create new entities that the reviewer must manually associate with a group. Production fuzzy matching (name similarity, registration-number cross-reference) is not in the PoC.
- No deletion handling. If a row disappears from ESMA's register (indicating withdrawal), the importer does not automatically withdraw the registry record. The reviewer handles this manually. Production revocation is a separate concern (see section 13).
- No diffing of historical CSV versions. Each import is processed against the current state of the registry, not against a history of previous imports.

### 10.5 What the admin panel explicitly does not do

- No public-facing claim flow (that's the explainer page in section 11, not a working feature)
- No issuer self-service (issuers do not touch the admin panel; only Bluprynt reviewers do)
- No audit log UI (records store source/timestamp/reviewer; a proper audit log with history is a production concern)
- No bulk edit, no export, no API beyond what the public site uses
- No scheduled jobs, no background workers, no queues

The admin panel is a tool for four reviewers to manage data for four pilot issuers. It is not, and is not trying to be, a scalable operations console. When the production version is built, the admin panel will be replaced — the goal of the PoC version is to prove the source-tier workflow and the CSV ingestion pattern, not to ship production ops infrastructure.

## 11. "How claiming works" explainer page (`/how-claiming-works`)

**Purpose:** Answer the investor and partner question "how does an issuer actually get on this registry?" without building the production claim flow.

**Not a working flow.** This is a single static page — prose plus static mockup images — that walks through the claim model. No forms that submit. No state. No authentication.

**Content:**

- **Who can claim a profile.** Entity-level claim requires authority to represent the legal entity (officer, GC sign-off, or equivalent). Group-level claim requires corporate authorization to speak for the whole group. Wallet binding requires on-chain signature from the wallet plus attribution from a claimed entity.
- **The three-step flow, described.** (1) Bluprynt KYB verification of the claimant's authority. (2) Entity and wallet binding via signature challenge. (3) Registry profile goes from "unclaimed" to "claimed," visible on every page that references the entity or its assets.
- **What claiming changes on the page.** A "Claimed by issuer" badge appears. The issuer-asserted documents section becomes available for upload (white papers, AIDs, policies, hashed and timestamped by Bluprynt).
- **What claiming does not change.** Register-derived data is not modifiable by the issuer — licenses come from ESMA and BMA, not from the issuer's claim. This is part of the registry's authority posture: the issuer owns their narrative on issuer-asserted artifacts, but not on regulator-sourced facts.
- **Dispute and correction.** One short paragraph noting that a dispute process exists for contested information (e.g., an issuer believes a register-derived license is mis-attributed), with a contact path.

**Static mockups (hand-designed, not rendered from a live flow):** three screenshots showing the claim entry screen, the KYB verification step, and the post-claim profile view with the claimed badge.

Time cost for the build: writing the prose is the bulk of it; the mockups can be static images or figma exports embedded as PNGs. No backend work. This page does more narrative work for investor/partner conversations than a half-working live flow would, because a half-working live flow exposes all the production edge cases without resolving them.

## 12. "Data sources" page (`/data-sources`)

**Purpose:** Answer the partner and investor question "where does this data come from, how current is it, and can we trust it?" with an architectural statement rather than hand-waving.

**Content:**

- **The three trust tiers, restated for the public-facing audience.** Register-derived, Bluprynt-verified, issuer-asserted. Each with one-sentence description and the visual treatment used on entity pages.
- **MiCA (ESMA interim register).** Explains that the source is ESMA's interim MiCA register published as weekly CSVs covering white papers, ART issuers, EMT issuers, authorized CASPs, and non-compliant CASPs. Explains the weekly refresh cadence and the ESMA transition to an integrated IT system expected by mid-2026. For the PoC, notes that data is hand-curated from the CSVs into the pilot seed files; for production, describes the intended automated ingestion with "last synced" timestamps shown on each entity.
- **BMA (Bermuda Monetary Authority).** Explains that BMA licensing data is sourced from the BMA's public register search at `bma.bm/regulated-entities`. For the PoC, this is manual verification by a Bluprynt reviewer — a human looking up each pilot entity in the register and recording the result. The page explicitly discloses this: "BMA licensing data shown here was manually verified by a Bluprynt reviewer on [date] against the BMA public register. We are in active conversation with the Authority regarding a structured data feed for production." This framing is both accurate and a soft signal to the Authority that Bluprynt is building responsibly.
- **Coverage limitations.** Explicitly lists the jurisdictions *not* covered: NYDFS (US), FCA (UK), MAS (Singapore), FINMA (Switzerland), and others. The list is long on purpose. Licenses held in these jurisdictions are not reflected in the registry and the Paxos entity page demonstrates this concretely. This is the coverage-disclosure UX materialized in one place.
- **What we do not scrape.** Short paragraph, deliberately public: "Bluprynt does not operate automated crawlers against regulator websites that restrict crawling. Where a regulator's public data is available only through a human-browsable interface and the regulator has not provided a structured feed, Bluprynt performs manual verification by a human reviewer and labels the data accordingly. We prefer to build regulator relationships and request structured data directly."

This page is a forcing function for the product's integrity. It commits Bluprynt publicly to a sourcing posture that matches the pitch. It also serves as the factual reference any future dispute or regulator inquiry can point to.

## 13. What this PoC makes clear for the production version

Decisions the PoC deliberately defers, but that the production version will need to resolve:

- Claim flow and KYB integration at scale
- Automated MiCA CSV ingestion and refresh cadence surfacing
- BMA data feed negotiation with the Authority (parallel workstream, not blocking)
- Additional jurisdictions (FCA and NYDFS as highest priority)
- Multi-jurisdiction entity matching with name/LEI/registration-number reconciliation
- Dispute and takedown process for shadow profiles and contested information
- Revocation and stale-state handling, including propagation to on-chain attestations
- ToS, privacy policy, coverage-disclosure UX, incident response
- Integration partner API contracts for programmatic consumption beyond URL linking

The PoC exposes the shape of these problems without solving them. That is deliberate, and the spec is explicit about it so that seeing the demo does not create false confidence about production readiness.