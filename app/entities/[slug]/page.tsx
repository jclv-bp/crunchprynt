import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveEntity } from "@/lib/slugs";
import { db } from "@/lib/db";
import { groupAssetsBySymbol } from "@/lib/rollups";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LicenseCard } from "@/components/registry/license-card";
import { PageOutline } from "@/components/registry/page-outline";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";
import {
  DashboardPreview,
  VerificationReadiness,
  VerificationTimeline,
} from "@/components/registry/verification-panels";

export default async function EntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await resolveEntity(slug);
  if (!entity) notFound();
  const full = await db.entity.findUnique({
    where: { id: entity.id },
    include: {
      group: true,
      licenses: true,
      controlledWallets: true,
      issuedAssets: true,
      claimRequests: true,
    },
  });
  if (!full) notFound();
  const groupedAssets = groupAssetsBySymbol(full.issuedAssets);
  const latestLicense = [...full.licenses].sort((a, b) => b.sourceRetrievedAt.getTime() - a.sourceRetrievedAt.getTime())[0];
  const latestClaim = [...full.claimRequests].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
  const latestReviewedClaim = [...full.claimRequests]
    .filter((claim) => claim.reviewedAt)
    .sort((a, b) => (b.reviewedAt?.getTime() ?? 0) - (a.reviewedAt?.getTime() ?? 0))[0];
  const latestWallet = [...full.controlledWallets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const latestAsset = [...full.issuedAssets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const profileBadge =
    full.verificationStatus === "verified"
      ? { label: "PROFILE VERIFIED", variant: "verified" as const }
      : full.verificationStatus === "under_review"
      ? { label: "PROFILE IN REVIEW", variant: "review" as const }
      : full.verificationStatus === "enriched"
      ? { label: "PROFILE ENRICHED", variant: "claimable" as const }
      : { label: "REGISTER IMPORTED", variant: "imported" as const };
  const claimBadge =
    full.claimStatus === "claimed"
      ? { label: "ISSUER CLAIMED", variant: "verified" as const }
      : full.claimStatus === "claim_in_review"
      ? { label: "CLAIM IN REVIEW", variant: "review" as const }
      : { label: "CLAIMABLE PROFILE", variant: "claimable" as const };
  const readinessSteps = [
    {
      label: "Official profile linked",
      description: full.website ? "An official domain is already attached to the entity profile." : "Add the entity's official website to anchor the profile to a real issuer domain.",
      status: full.website ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "Regulatory records connected",
      description: full.licenses.length > 0 ? `${full.licenses.length} regulatory record${full.licenses.length === 1 ? "" : "s"} already support this page.` : "Link register imports or manual regulatory records so the page has sourced compliance backing.",
      status: full.licenses.length > 0 ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "Claim started",
      description:
        full.claimStatus === "claimed"
          ? "The issuer has already completed the claim for this profile."
          : full.claimStatus === "claim_in_review" || full.claimRequests.length > 0
          ? "A claim has been submitted and is moving through review."
          : "Start the claim flow so Bluprynt can connect this profile to the issuer team.",
      status:
        full.claimStatus === "claimed"
          ? ("complete" as const)
          : full.claimStatus === "claim_in_review" || full.claimRequests.length > 0
          ? ("in_progress" as const)
          : ("missing" as const),
    },
    {
      label: "Profile enriched",
      description: full.profileSummary ? "The public profile has issuer-facing context beyond raw registry imports." : "Add a profile summary and supporting issuer context so the page reads like a trusted public profile.",
      status: full.profileSummary ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "Wallets and assets mapped",
      description:
        full.controlledWallets.length > 0 || full.issuedAssets.length > 0
          ? "This entity already has wallet or asset relationships captured in the registry."
          : "Connect wallets and asset deployments so the profile can verify what this entity actually controls or issues.",
      status:
        full.controlledWallets.length > 0 || full.issuedAssets.length > 0 ? ("complete" as const) : ("missing" as const),
    },
  ];
  const timelineItems = [
    {
      title: "Entity profile created in the registry",
      body: "This issuer profile became available for discovery and future claiming.",
      date: full.createdAt,
      tone: "default" as const,
    },
    ...(latestLicense
      ? [
          {
            title: "Regulatory data refreshed",
            body: `${latestLicense.licenseType} from ${latestLicense.regulator} is currently the freshest linked record on this page.`,
            date: latestLicense.sourceRetrievedAt,
            tone: "accent" as const,
          },
        ]
      : []),
    ...(latestClaim
      ? [
          {
            title: "Claim request submitted",
            body: `A claim request was filed by ${latestClaim.claimantName} for this entity profile.`,
            date: latestClaim.submittedAt,
            tone: "accent" as const,
          },
        ]
      : []),
    ...(latestReviewedClaim?.reviewedAt
      ? [
          {
            title: "Claim review updated",
            body: `Bluprynt reviewed the most recent claim submission and updated its status to ${latestReviewedClaim.status.replaceAll("_", " ")}.`,
            date: latestReviewedClaim.reviewedAt,
            tone: "success" as const,
          },
        ]
      : []),
    ...(full.kyiReviewedAt
      ? [
          {
            title: "Profile review completed",
            body: "Bluprynt completed an internal review milestone for this public issuer profile.",
            date: full.kyiReviewedAt,
            tone: "success" as const,
          },
        ]
      : []),
    ...(latestWallet
      ? [
          {
            title: "Wallet relationship recorded",
            body: "A controlled wallet was connected to this issuer profile.",
            date: latestWallet.createdAt,
            tone: "default" as const,
          },
        ]
      : []),
    ...(latestAsset
      ? [
          {
            title: "Issued asset linked",
            body: `${latestAsset.symbol} was connected to this issuer entity in the registry.`,
            date: latestAsset.createdAt,
            tone: "default" as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="max-w-[1200px] mx-auto px-6 py-12 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div>
            <section id="entity-overview" className="border border-black/10 bg-white p-8">
              <nav aria-label="Breadcrumb" className="mb-3">
                <Link
                  href={`/groups/${full.group.slug}`}
                  className="text-xs tracking-[0.15em] text-black/60 font-semibold hover:text-black"
                >
                  ← {full.group.displayName.toUpperCase()}
                </Link>
              </nav>
              <h1 className="text-4xl font-semibold tracking-[-0.02em] mt-2">{full.legalName}</h1>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-black/70">
                <div>
                  <dt className="sr-only">Jurisdiction</dt>
                  <dd>
                    Jurisdiction: {full.jurisdictionCountry}
                    {full.jurisdictionSubdivision ? ` (${full.jurisdictionSubdivision})` : ""}
                  </dd>
                </div>
                {full.lei && (
                  <div>
                    <dt className="sr-only">LEI</dt>
                    <dd>
                      LEI: <span className="font-mono break-all">{full.lei}</span>
                    </dd>
                  </div>
                )}
                {full.registrationNumber && (
                  <div>
                    <dt className="sr-only">Registration number</dt>
                    <dd>Reg. no: {full.registrationNumber}</dd>
                  </div>
                )}
                {full.website && (
                  <div>
                    <dt className="sr-only">Website</dt>
                    <dd>
                      <a href={full.website} target="_blank" rel="noreferrer" className="text-accent-blue hover:underline">
                        {full.website}
                      </a>
                    </dd>
                  </div>
                )}
                <BlupryntBadge label={profileBadge.label} variant={profileBadge.variant} />
                <BlupryntBadge label={claimBadge.label} variant={claimBadge.variant} />
              </dl>

              {full.profileSummary && (
                <div className="mt-6 border border-black/10 bg-white p-5 text-sm leading-[1.7] text-black/75">
                  <strong className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">PROFILE SUMMARY</strong>
                  {full.profileSummary}
                </div>
              )}

              {full.claimPageNote && (
                <div className="mt-6 border border-black/10 bg-surface p-4 text-sm text-black/75">
                  <strong className="mb-1 block text-xs font-semibold tracking-[0.15em] text-black/60">CLAIMABILITY</strong>
                  {full.claimPageNote}
                  {full.claimStatus !== "claimed" ? (
                    <div className="mt-3">
                      <Link href="/how-claiming-works" className="text-accent-blue hover:underline">
                        Learn how claiming works
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}

              {full.coverageLimitationNote && (
                <div id="coverage-limitation" className="mt-6 bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 scroll-mt-24">
                  <strong className="tracking-[0.15em] text-xs font-semibold block mb-1">COVERAGE LIMITATION</strong>
                  {full.coverageLimitationNote}
                </div>
              )}
            </section>

            <section
              id="claim-heading"
              aria-labelledby="claim-title"
              className="mt-8 scroll-mt-24 border border-[#007BFF]/18 bg-[linear-gradient(135deg,rgba(0,123,255,0.08),rgba(255,255,255,0.98)_42%,rgba(0,123,255,0.04))] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 id="claim-title" className="text-xs font-semibold tracking-[0.15em] text-black/60">CLAIM THIS PROFILE</h2>
                    <BlupryntBadge label="BLUPRYNT CLAIM FLOW" variant="claimable" />
                  </div>
                  <p className="mt-3 text-sm leading-[1.7] text-black/75">
                    {full.claimStatus === "claimed"
                      ? "This issuer profile is already claimed. Bluprynt can still review additional documents, profile updates, and wallet bindings through the issuer workflow."
                      : "If you represent this legal entity, you can claim this page, submit supporting information, and complete Bluprynt’s issuer verification workflow for the public profile."}
                  </p>
                </div>
                <div className="flex w-full max-w-[250px] flex-col gap-3">
                  <Link
                    href={`/claim?entity=${full.slug}`}
                    className="inline-flex min-h-14 items-center justify-center border border-[#007BFF] bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,123,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#006FE6] hover:shadow-[0_16px_34px_rgba(0,123,255,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2"
                  >
                    Start Claim Request
                  </Link>
                  <Link
                    href="/how-claiming-works"
                    className="inline-flex items-center justify-center border border-[#007BFF]/18 bg-white/85 px-4 py-3 text-sm font-medium text-[#007BFF] transition-colors hover:border-[#007BFF]/35 hover:bg-white"
                  >
                    How claiming works
                  </Link>
                </div>
              </div>
            </section>

            <section id="readiness-heading" aria-labelledby="readiness-title" className="mt-8 scroll-mt-24">
              <VerificationReadiness
                titleId="readiness-title"
                title="How close this issuer is to a fully verified profile"
                intro="This score turns a passive listing into a concrete path to completion. Each completed checkpoint increases trust and makes the profile more useful to counterparties, regulators, and token users."
                steps={readinessSteps}
              />
            </section>

            <section id="timeline-heading" aria-labelledby="timeline-title" className="mt-8 scroll-mt-24">
              <VerificationTimeline
                titleId="timeline-title"
                title="What has happened on this profile so far"
                intro="This timeline explains why the page exists, what has been refreshed, and where the issuer is in the claim and verification journey."
                items={timelineItems}
              />
            </section>

            <section id="dashboard-preview-heading" aria-labelledby="dashboard-preview-title" className="mt-8 scroll-mt-24">
              <DashboardPreview
                titleId="dashboard-preview-title"
                title="What the issuer unlocks after claiming"
                intro="Claiming this page turns it from a public listing into the issuer's working surface inside Bluprynt."
                items={[
                  "Edit the public profile summary, official website, and core issuer metadata.",
                  "Manage assets across jurisdictions from one issuer-level workspace.",
                  "Bind wallets and connect on-chain deployments to the legal entity.",
                  "Upload supporting documents and link white papers to the right assets.",
                  "Respond to review requests and track claim progress with Bluprynt.",
                  "Improve the page's readiness score and public trust posture over time.",
                ]}
                href={`/claim?entity=${full.slug}`}
                cta="Unlock Issuer Dashboard"
              />
            </section>

            <section id="licenses-heading" aria-labelledby="licenses-title" className="mt-12 scroll-mt-24">
              <h2 id="licenses-title" className="mb-4 text-xs font-semibold tracking-[0.15em] text-black/60">REGULATORY RECORDS</h2>
              {full.licenses.length === 0 ? (
                <div className="bg-surface border border-black/10 p-6 text-sm text-black/70">
                  No regulatory records recorded for this entity in the registry's covered jurisdictions.
                  {full.coverageLimitationNote ? " See coverage limitation above." : ""}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {full.licenses.map(l => (
                    <LicenseCard
                      key={l.id}
                      source={l.source as "esma_mica_register" | "bma_manual" | "issuer_asserted"}
                      regulator={l.regulator}
                      jurisdictionCountry={l.jurisdictionCountry}
                      licenseType={l.licenseType}
                      licenseReference={l.licenseReference}
                      permittedActivities={l.permittedActivities ? JSON.parse(l.permittedActivities) : []}
                      passporting={l.passporting ? JSON.parse(l.passporting) : []}
                      documentPath={l.documentPath}
                      sourceRetrievedAt={l.sourceRetrievedAt}
                      reviewerName={l.reviewerName}
                      reviewerVerifiedAt={l.reviewerVerifiedAt}
                    />
                  ))}
                </div>
              )}
            </section>

            <section id="wallets-heading" aria-labelledby="wallets-title" className="mt-12 scroll-mt-24">
              <h2 id="wallets-title" className="mb-4 text-xs font-semibold tracking-[0.15em] text-black/60">CONTROLLED WALLETS</h2>
              {full.controlledWallets.length === 0 ? (
                <p className="text-sm text-black/60">No wallets bound.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {full.controlledWallets.map(w => {
                    const matchingAsset = full.issuedAssets.find(
                      (asset) => asset.chain === w.chain && asset.address === w.address,
                    );
                    const walletLabel = `${w.chain} · ${w.address}`;

                    return (
                      <li key={w.id} className="flex flex-wrap justify-between gap-2 border border-black/10 bg-white px-4 py-3">
                        {matchingAsset ? (
                          <Link
                            href={`/assets/${matchingAsset.chain}/${matchingAsset.address}`}
                            className="min-w-0 break-all font-mono text-xs text-accent-blue underline-offset-4 hover:underline"
                          >
                            {walletLabel}
                          </Link>
                        ) : (
                          <span className="min-w-0 break-all font-mono text-xs">{walletLabel}</span>
                        )}
                        {w.attestationRef && <span className="text-xs text-black/45 break-all">{w.attestationRef}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section id="issued-assets-heading" aria-labelledby="issued-assets-title" className="mt-12 scroll-mt-24">
              <h2 id="issued-assets-title" className="mb-4 text-xs font-semibold tracking-[0.15em] text-black/60">ISSUED ASSETS</h2>
              {groupedAssets.length === 0 ? (
                <p className="text-sm text-black/60">{full.legalName} does not issue tokens.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {groupedAssets.map((assetGroup) => (
                    <li key={assetGroup.symbol} className="border border-black/10 bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.15em] text-black/60">ASSET FAMILY</p>
                          <h3 className="mt-2 text-xl font-semibold">
                            <Link
                              href={`/assets/family/${full.slug}/${assetGroup.familySlug}`}
                              className="underline-offset-4 hover:text-accent-blue hover:underline focus-visible:outline-none focus-visible:underline"
                            >
                              {assetGroup.symbol} · {assetGroup.name}
                            </Link>
                          </h3>
                        </div>
                        <p className="text-xs font-semibold tracking-[0.15em] text-black/50">
                          {assetGroup.chains.length} {assetGroup.chains.length === 1 ? "CHAIN" : "CHAINS"}
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-black/70">
                        Regime: <span className="font-medium text-black">{assetGroup.issuanceRegime}</span>
                      </p>
                      <p className="mt-2 text-sm text-black/70">
                        Family profile:{" "}
                        <Link
                          href={`/assets/family/${full.slug}/${assetGroup.familySlug}`}
                          className="text-accent-blue underline-offset-4 hover:underline"
                        >
                          View consolidated asset profile
                        </Link>
                      </p>
                      <ul className="mt-4 space-y-2">
                        {assetGroup.deployments.map((deployment) => (
                          <li key={deployment.id}>
                            <Link
                              href={`/assets/${deployment.chain}/${deployment.address}`}
                              className="inline-flex items-center gap-2 text-sm text-accent-blue underline-offset-4 hover:underline"
                            >
                              <span>{deployment.chain}</span>
                              <span className="text-black/30">·</span>
                              <span className="font-mono text-xs text-black/60">
                                {deployment.address.slice(0, 8)}…{deployment.address.slice(-6)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <PageOutline
            title="On This Page"
            eyebrow="ENTITY NAVIGATION"
            items={[
              { id: "entity-overview", label: "Overview" },
              ...(full.coverageLimitationNote ? [{ id: "coverage-limitation", label: "Coverage limitation" }] : []),
              { id: "claim-heading", label: "Claim this profile" },
              { id: "readiness-heading", label: "Claim readiness" },
              { id: "timeline-heading", label: "Verification timeline" },
              { id: "dashboard-preview-heading", label: "Dashboard preview" },
              { id: "licenses-heading", label: "Regulatory records" },
              { id: "wallets-heading", label: "Controlled wallets" },
              { id: "issued-assets-heading", label: "Issued assets" },
            ]}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
