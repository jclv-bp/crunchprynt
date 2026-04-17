import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveEntity } from "@/lib/slugs";
import { db } from "@/lib/db";
import { groupAssetsBySymbol } from "@/lib/rollups";
import { assetFamilySlug } from "@/lib/assets";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageOutline } from "@/components/registry/page-outline";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";
import {
  DashboardPreview,
  VerificationReadiness,
  VerificationTimeline,
} from "@/components/registry/verification-panels";

export const runtime = "nodejs";

export default async function AssetFamilyPage({
  params,
}: {
  params: Promise<{ entity: string; asset: string }>;
}) {
  const { entity: entityParam, asset: assetParam } = await params;
  const entity = await resolveEntity(entityParam);
  if (!entity) notFound();

  const full = await db.entity.findUnique({
    where: { id: entity.id },
    include: {
      group: true,
      licenses: true,
      controlledWallets: true,
      claimRequests: true,
      issuedAssets: {
        include: {
          linkedWhitePaper: true,
          claimRequests: true,
        },
      },
    },
  });
  if (!full) notFound();

  const families = groupAssetsBySymbol(full.issuedAssets);
  const family =
    families.find((group) => group.familySlug === assetParam) ??
    families.find((group) => assetFamilySlug(group.symbol, group.name) === assetParam);
  if (!family) notFound();

  const latestClaim = family.deployments
    .flatMap((deployment) => deployment.claimRequests)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
  const latestReviewedClaim = family.deployments
    .flatMap((deployment) => deployment.claimRequests)
    .filter((claim) => claim.reviewedAt)
    .sort((a, b) => (b.reviewedAt?.getTime() ?? 0) - (a.reviewedAt?.getTime() ?? 0))[0];
  const latestWhitePaper = family.deployments
    .map((deployment) => deployment.linkedWhitePaper)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.sourceRetrievedAt.getTime() - a.sourceRetrievedAt.getTime())[0];
  const latestDeployment = [...family.deployments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const readinessSteps = [
    {
      label: "Issuer profile claimable",
      description:
        full.claimStatus === "claimed"
          ? "The issuer behind this asset family has already claimed its profile."
          : full.claimStatus === "claim_in_review"
          ? "The issuer profile is in review, which is the main gate for family-level asset management."
          : "The issuer profile still needs to be claimed before this family can be fully managed.",
      status:
        full.claimStatus === "claimed"
          ? ("complete" as const)
          : full.claimStatus === "claim_in_review"
          ? ("in_progress" as const)
          : ("missing" as const),
    },
    {
      label: "All chain deployments mapped",
      description: `${family.deployments.length} deployment${family.deployments.length === 1 ? "" : "s"} are connected to this family profile across ${family.chains.length} chain${family.chains.length === 1 ? "" : "s"}.`,
      status: family.deployments.length > 0 ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "White paper coverage",
      description: latestWhitePaper
        ? "At least one linked white paper supports this asset family."
        : "Link the right white paper so the family profile shows its disclosure basis clearly.",
      status: latestWhitePaper ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "Asset verification started",
      description:
        latestClaim || full.claimStatus === "claimed"
          ? "This family already has an active claim or a claimed issuer behind it."
          : "Start a claim request so Bluprynt can move this family toward verified status.",
      status: latestClaim ? ("in_progress" as const) : full.claimStatus === "claimed" ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "Wallet or attestation evidence",
      description:
        family.deployments.some(
          (deployment) =>
            Boolean(deployment.attestationRef) ||
            full.controlledWallets.some((wallet) => wallet.chain === deployment.chain && wallet.address === deployment.address),
        )
          ? "At least one deployment already has wallet-level or attestation-level evidence."
          : "Bind deployment wallets or add attestation evidence so counterparties can trust chain-level mappings.",
      status: family.deployments.some(
        (deployment) =>
          Boolean(deployment.attestationRef) ||
          full.controlledWallets.some((wallet) => wallet.chain === deployment.chain && wallet.address === deployment.address),
      )
        ? ("complete" as const)
        : ("missing" as const),
    },
  ];
  const timelineItems = [
    {
      title: "Asset family created in the registry",
      body: `The ${family.symbol} family is now grouped under ${full.legalName} across its known chain deployments.`,
      date: family.deployments.map((deployment) => deployment.createdAt).sort((a, b) => a.getTime() - b.getTime())[0],
      tone: "default" as const,
    },
    ...(latestWhitePaper
      ? [
          {
            title: "White paper linked",
            body: `${family.symbol} now has a linked white paper or source disclosure on file.`,
            date: latestWhitePaper.sourceRetrievedAt,
            tone: "accent" as const,
          },
        ]
      : []),
    ...(latestClaim
      ? [
          {
            title: "Asset-family claim activity started",
            body: `A claim or verification request was submitted by ${latestClaim.claimantName}.`,
            date: latestClaim.submittedAt,
            tone: "accent" as const,
          },
        ]
      : []),
    ...(latestReviewedClaim?.reviewedAt
      ? [
          {
            title: "Claim review updated",
            body: `Bluprynt reviewed the latest asset-family request and marked it ${latestReviewedClaim.status.replaceAll("_", " ")}.`,
            date: latestReviewedClaim.reviewedAt,
            tone: "success" as const,
          },
        ]
      : []),
    ...(latestDeployment
      ? [
          {
            title: "Most recent deployment tracked",
            body: `${latestDeployment.chain} is the freshest deployment currently attached to this asset family.`,
            date: latestDeployment.createdAt,
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
            <section id="asset-family-overview" className="border border-black/10 bg-white p-8">
              <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap gap-3 text-xs font-semibold tracking-[0.15em] text-black/60">
                <Link href={`/groups/${full.group.slug}`} className="hover:text-black">
                  {full.group.displayName.toUpperCase()}
                </Link>
                <span aria-hidden="true">/</span>
                <Link href={`/entities/${full.slug}`} className="hover:text-black">
                  {full.legalName.toUpperCase()}
                </Link>
              </nav>
              <p className="text-xs font-semibold tracking-[0.15em] text-black/60">ASSET FAMILY</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">
                {family.symbol} · {family.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-[1.7] text-black/70">
                Consolidated asset profile for all tracked deployments of {family.symbol} issued by {full.legalName}. Use this page to understand the overall asset and then drill into chain-specific deployments below.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <BlupryntBadge
                  label={
                    full.claimStatus === "claimed"
                      ? "ISSUER CLAIMED"
                      : full.claimStatus === "claim_in_review"
                      ? "CLAIM IN REVIEW"
                      : "CLAIMABLE ISSUER"
                  }
                  variant={
                    full.claimStatus === "claimed"
                      ? "verified"
                      : full.claimStatus === "claim_in_review"
                      ? "review"
                      : "claimable"
                  }
                />
                {latestWhitePaper ? (
                  <BlupryntBadge label="WHITE PAPER LINKED" variant="verified" />
                ) : (
                  <BlupryntBadge label="REGISTER TRACKED" variant="imported" />
                )}
              </div>
            </section>

            <section
              id="asset-family-claim-heading"
              aria-labelledby="asset-family-claim-title"
              className="mt-8 scroll-mt-24 border border-[#007BFF]/18 bg-[linear-gradient(135deg,rgba(0,123,255,0.08),rgba(255,255,255,0.98)_42%,rgba(0,123,255,0.04))] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 id="asset-family-claim-title" className="text-xs tracking-[0.15em] text-black/60 font-semibold">
                      CLAIM OR VERIFY THIS ASSET FAMILY
                    </h2>
                    <BlupryntBadge label="BLUPRYNT CLAIM FLOW" variant="claimable" />
                  </div>
                  <p className="mt-3 text-sm leading-[1.7] text-black/75">
                    This page rolls up every tracked deployment of {family.symbol}. Claiming starts from the issuer profile, then extends across the family and its chain-specific deployments.
                  </p>
                </div>
                <div className="flex w-full max-w-[250px] flex-col gap-3">
                  <Link
                    href={`/claim?entity=${full.slug}&asset=${family.deployments[0].id}`}
                    className="inline-flex min-h-14 items-center justify-center border border-[#007BFF] bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,123,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#006FE6] hover:shadow-[0_16px_34px_rgba(0,123,255,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2"
                  >
                    Start Claim Request
                  </Link>
                  <Link
                    href={`/entities/${full.slug}#claim-heading`}
                    className="inline-flex items-center justify-center border border-[#007BFF]/18 bg-white/85 px-4 py-3 text-sm font-medium text-[#007BFF] transition-colors hover:border-[#007BFF]/35 hover:bg-white"
                  >
                    View issuer claimability
                  </Link>
                </div>
              </div>
            </section>

            <section id="readiness-heading" aria-labelledby="readiness-title" className="mt-8 scroll-mt-24">
              <VerificationReadiness
                titleId="readiness-title"
                title="How close this asset family is to a fully verified profile"
                intro="This family-level score helps issuers and viewers understand what still needs to happen before the overall asset profile feels complete across every deployment."
                steps={readinessSteps}
              />
            </section>

            <section id="timeline-heading" aria-labelledby="timeline-title" className="mt-8 scroll-mt-24">
              <VerificationTimeline
                titleId="timeline-title"
                title="How this asset family has evolved"
                intro="The timeline makes the family-level history visible, from first tracking to white paper linkage and claim review."
                items={timelineItems}
              />
            </section>

            <section id="deployments-heading" aria-labelledby="deployments-title" className="mt-8 scroll-mt-24">
              <div className="mb-4">
                <p className="text-xs font-semibold tracking-[0.15em] text-black/60">CHAIN DEPLOYMENTS</p>
                <h2 id="deployments-title" className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
                  Individual chain profiles and statuses
                </h2>
              </div>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {family.deployments.map((deployment) => {
                  const deploymentClaim = [...deployment.claimRequests].sort(
                    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
                  )[0];
                  const walletMapped = full.controlledWallets.some(
                    (wallet) => wallet.chain === deployment.chain && wallet.address === deployment.address,
                  );

                  return (
                    <li key={deployment.id} className="border border-black/10 bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.15em] text-black/60">
                            {deployment.chain.toUpperCase()} DEPLOYMENT
                          </p>
                          <h3 className="mt-2 text-xl font-semibold">
                            <Link
                              href={`/assets/${deployment.chain}/${deployment.address}`}
                              className="underline-offset-4 hover:text-accent-blue hover:underline"
                            >
                              {deployment.symbol} · {deployment.name}
                            </Link>
                          </h3>
                        </div>
                        <Link
                          href={`/assets/${deployment.chain}/${deployment.address}`}
                          className="text-sm font-medium text-accent-blue underline-offset-4 hover:underline"
                        >
                          Open deployment
                        </Link>
                      </div>
                      <p className="mt-3 font-mono text-xs text-black/55">
                        {deployment.address}
                      </p>
                      <p className="mt-4 text-sm text-black/70">
                        Regime: <span className="font-medium text-black">{deployment.issuanceRegime}</span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <BlupryntBadge
                          label={
                            deploymentClaim
                              ? "ASSET CLAIM STARTED"
                              : full.claimStatus === "claimed"
                              ? "ISSUER VERIFIED PATH"
                              : "TRACKED ONLY"
                          }
                          variant={
                            deploymentClaim
                              ? "review"
                              : full.claimStatus === "claimed"
                              ? "verified"
                              : "imported"
                          }
                        />
                        {deployment.linkedWhitePaper ? (
                          <BlupryntBadge label="WHITE PAPER LINKED" variant="verified" />
                        ) : (
                          <BlupryntBadge label="WHITE PAPER MISSING" variant="imported" />
                        )}
                        {deployment.attestationRef || walletMapped ? (
                          <BlupryntBadge label="WALLET OR ATTESTATION LINKED" variant="verified" />
                        ) : (
                          <BlupryntBadge label="WALLET EVIDENCE NEEDED" variant="claimable" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section id="dashboard-preview-heading" aria-labelledby="dashboard-preview-title" className="mt-8 scroll-mt-24">
              <DashboardPreview
                titleId="dashboard-preview-title"
                title="What the issuer unlocks for the full asset family"
                intro="Claiming this family gives the issuer one place to manage disclosures, deployments, and verification status across chains."
                items={[
                  "See every deployment of the asset in one family-level workspace.",
                  "Track which chains are missing white papers, attestations, or wallet mappings.",
                  "Manage asset verification across all deployments instead of chain by chain.",
                  "Keep the public family profile aligned as the asset expands to new chains.",
                  "Respond to Bluprynt review requests with a family-wide view of what is missing.",
                  "Improve trust for the overall asset while still exposing chain-specific detail.",
                ]}
                href={`/claim?entity=${full.slug}&asset=${family.deployments[0].id}`}
                cta="Unlock Asset Dashboard"
              />
            </section>
          </div>

          <PageOutline
            title="On This Page"
            eyebrow="ASSET FAMILY NAVIGATION"
            items={[
              { id: "asset-family-overview", label: "Overview" },
              { id: "asset-family-claim-heading", label: "Claim this family" },
              { id: "readiness-heading", label: "Claim readiness" },
              { id: "timeline-heading", label: "Verification timeline" },
              { id: "deployments-heading", label: "Chain deployments" },
              { id: "dashboard-preview-heading", label: "Dashboard preview" },
            ]}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
