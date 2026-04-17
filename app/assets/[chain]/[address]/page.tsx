import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageOutline } from "@/components/registry/page-outline";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";
import {
  DashboardPreview,
  VerificationReadiness,
  VerificationTimeline,
} from "@/components/registry/verification-panels";

export default async function AssetPage({ params }: { params: Promise<{ chain: string; address: string }> }) {
  const { chain, address } = await params;
  const asset = await db.asset.findUnique({
    where: { chain_address: { chain, address } },
    include: {
      issuerEntity: { include: { group: true, licenses: true, claimRequests: true, controlledWallets: true } },
      linkedWhitePaper: true,
      claimRequests: true,
    },
  });
  if (!asset) notFound();

  const related = asset.relatedGroupId
    ? await db.asset.findMany({
        where: { relatedGroupId: asset.relatedGroupId, NOT: { id: asset.id } },
      })
    : [];

  const today = new Date().toISOString().slice(0, 10);
  const regimeLabel =
    asset.issuanceRegime === "None"
      ? `No MiCA authorization found in ESMA register as of ${today}`
      : asset.issuanceRegime === "DABA"
      ? `DABA (issuer licensed by Bermuda Monetary Authority)`
      : `${asset.issuanceRegime} (${asset.issuerEntity.legalName})`;
  const claimBadge =
    asset.issuerEntity.claimStatus === "claimed"
      ? { label: "ISSUER CLAIMED", variant: "verified" as const }
      : asset.issuerEntity.claimStatus === "claim_in_review"
      ? { label: "CLAIM IN REVIEW", variant: "review" as const }
      : { label: "CLAIMABLE ISSUER", variant: "claimable" as const };
  const latestClaim = [...asset.claimRequests].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
  const latestReviewedClaim = [...asset.claimRequests]
    .filter((claim) => claim.reviewedAt)
    .sort((a, b) => (b.reviewedAt?.getTime() ?? 0) - (a.reviewedAt?.getTime() ?? 0))[0];
  const readinessSteps = [
    {
      label: "Issuer profile claimable",
      description:
        asset.issuerEntity.claimStatus === "claimed"
          ? "The issuer behind this asset has already claimed its profile."
          : asset.issuerEntity.claimStatus === "claim_in_review"
          ? "The issuer profile claim is in review, which is the gateway to managing this asset."
          : "The issuer profile still needs to be claimed before full asset verification can proceed.",
      status:
        asset.issuerEntity.claimStatus === "claimed"
          ? ("complete" as const)
          : asset.issuerEntity.claimStatus === "claim_in_review"
          ? ("in_progress" as const)
          : ("missing" as const),
    },
    {
      label: "Asset claim started",
      description:
        asset.claimRequests.length > 0
          ? "A claim or verification request has already been submitted for this asset."
          : "Start the asset claim flow so Bluprynt can review this deployment alongside the issuer.",
      status: asset.claimRequests.length > 0 ? ("in_progress" as const) : ("missing" as const),
    },
    {
      label: "White paper linked",
      description: asset.linkedWhitePaper ? "A source white paper is already attached to this asset record." : "Link the asset's white paper so users can see the disclosure basis behind this deployment.",
      status: asset.linkedWhitePaper ? ("complete" as const) : ("missing" as const),
    },
    {
      label: "Wallet or deployment evidence connected",
      description:
        asset.attestationRef || asset.issuerEntity.controlledWallets.some((wallet) => wallet.chain === asset.chain && wallet.address === asset.address)
          ? "There is already wallet-level or attestation-level evidence tied to this deployment."
          : "Bind the deployment wallet or add attestation evidence to strengthen verification.",
      status:
        asset.attestationRef || asset.issuerEntity.controlledWallets.some((wallet) => wallet.chain === asset.chain && wallet.address === asset.address)
          ? ("complete" as const)
          : ("missing" as const),
    },
    {
      label: "Regulatory context captured",
      description:
        asset.issuerEntity.licenses.length > 0
          ? "The issuer already has linked regulatory context supporting this asset page."
          : "Connect the issuer's regulatory records so this asset sits inside a meaningful compliance context.",
      status: asset.issuerEntity.licenses.length > 0 ? ("complete" as const) : ("missing" as const),
    },
  ];
  const timelineItems = [
    {
      title: "Asset deployment added to the registry",
      body: "This token deployment became discoverable on the public registry.",
      date: asset.createdAt,
      tone: "default" as const,
    },
    ...(asset.linkedWhitePaper
      ? [
          {
            title: "White paper linked",
            body: `A source document for ${asset.symbol} is attached to this asset record.`,
            date: asset.linkedWhitePaper.sourceRetrievedAt,
            tone: "accent" as const,
          },
        ]
      : []),
    ...(latestClaim
      ? [
          {
            title: "Asset claim submitted",
            body: `A claim or verification request was submitted by ${latestClaim.claimantName}.`,
            date: latestClaim.submittedAt,
            tone: "accent" as const,
          },
        ]
      : []),
    ...(latestReviewedClaim?.reviewedAt
      ? [
          {
            title: "Asset claim reviewed",
            body: `Bluprynt reviewed the latest asset request and updated it to ${latestReviewedClaim.status.replaceAll("_", " ")}.`,
            date: latestReviewedClaim.reviewedAt,
            tone: "success" as const,
          },
        ]
      : []),
    ...((asset.issuerEntity.claimRequests[0] || asset.issuerEntity.claimStatus !== "claimable")
      ? [
          {
            title: "Issuer verification path active",
            body:
              asset.issuerEntity.claimStatus === "claimed"
                ? "The underlying issuer profile is already claimed, which strengthens the asset's verification path."
                : "The issuer profile has entered the claim workflow tied to this asset.",
            date:
              [...asset.issuerEntity.claimRequests].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0]?.submittedAt ??
              asset.updatedAt,
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
            <section id="asset-overview" className="border border-black/10 bg-white p-8">
              <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap gap-3 text-xs font-semibold tracking-[0.15em] text-black/60">
                <Link href={`/groups/${asset.issuerEntity.group.slug}`} className="hover:text-black">
                  {asset.issuerEntity.group.displayName.toUpperCase()}
                </Link>
                <span aria-hidden="true">/</span>
                <Link href={`/entities/${asset.issuerEntity.slug}`} className="hover:text-black">
                  ENTITY
                </Link>
              </nav>
              <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">
                {asset.chain.toUpperCase()} · ASSET
              </p>
              <h1 className="text-4xl font-semibold tracking-[-0.02em] mt-2">
                {asset.symbol} · {asset.name}
              </h1>
              <p className="font-mono text-sm text-black/60 mt-2 break-all">{asset.address}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <BlupryntBadge label={claimBadge.label} variant={claimBadge.variant} />
                {asset.linkedWhitePaper ? (
                  <BlupryntBadge label="WHITE PAPER LINKED" variant="verified" />
                ) : (
                  <BlupryntBadge label="REGISTER TRACKED" variant="imported" />
                )}
              </div>
            </section>

            <section id="issuer-heading" aria-labelledby="issuer-title" className="mt-10 scroll-mt-24 bg-white border border-black/10 p-6">
              <h2 id="issuer-title" className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">ISSUER OF RECORD</h2>
              <Link
                href={`/entities/${asset.issuerEntity.slug}`}
                className="text-2xl font-semibold hover:text-accent-blue focus-visible:outline-none focus-visible:underline"
              >
                {asset.issuerEntity.legalName}
              </Link>
              <p className="text-sm text-black/70 mt-1">
                Group:{" "}
                <Link href={`/groups/${asset.issuerEntity.group.slug}`} className="hover:text-accent-blue focus-visible:outline-none focus-visible:underline">
                  {asset.issuerEntity.group.displayName}
                </Link>
              </p>
            </section>

            <section id="regime-heading" aria-labelledby="regime-title" className="mt-6 scroll-mt-24 bg-white border border-black/10 p-6">
              <h2 id="regime-title" className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">ISSUANCE REGIME</h2>
              <p className="text-lg">{regimeLabel}</p>
            </section>

            <section
              id="claim-heading"
              aria-labelledby="claim-title"
              className="mt-6 scroll-mt-24 border border-[#007BFF]/18 bg-[linear-gradient(135deg,rgba(0,123,255,0.08),rgba(255,255,255,0.98)_42%,rgba(0,123,255,0.04))] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 id="claim-title" className="text-xs tracking-[0.15em] text-black/60 font-semibold">CLAIM OR VERIFY THIS ASSET</h2>
                    <BlupryntBadge label="BLUPRYNT CLAIM FLOW" variant="claimable" />
                  </div>
                  <p className="mt-3 text-sm leading-[1.7] text-black/75">
                    Claiming starts from the issuer entity profile. If you represent {asset.issuerEntity.legalName}, you can claim the issuer page and then work with Bluprynt on asset-level wallet binding and KYI verification for this deployment.
                  </p>
                </div>
                <div className="flex w-full max-w-[250px] flex-col gap-3">
                  <Link
                    href={`/claim?entity=${asset.issuerEntity.slug}&asset=${asset.id}`}
                    className="inline-flex min-h-14 items-center justify-center border border-[#007BFF] bg-[#007BFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,123,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#006FE6] hover:shadow-[0_16px_34px_rgba(0,123,255,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2"
                  >
                    Start Claim Request
                  </Link>
                  <Link
                    href={`/entities/${asset.issuerEntity.slug}#claim-heading`}
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
                title="How close this deployment is to a fully verified asset profile"
                intro="This readiness score shows what still needs to happen before the asset page feels complete, defensible, and highly claimable."
                steps={readinessSteps}
              />
            </section>

            <section id="timeline-heading" aria-labelledby="timeline-title" className="mt-8 scroll-mt-24">
              <VerificationTimeline
                titleId="timeline-title"
                title="How this asset record has evolved"
                intro="The timeline makes the verification journey legible, from initial registry tracking to white paper linkage and claim review activity."
                items={timelineItems}
              />
            </section>

            <section id="dashboard-preview-heading" aria-labelledby="dashboard-preview-title" className="mt-8 scroll-mt-24">
              <DashboardPreview
                titleId="dashboard-preview-title"
                title="What the issuer unlocks for this asset after claiming"
                intro="Claiming the issuer profile opens a working dashboard for managing this asset as part of a broader compliance and verification program."
                items={[
                  "Link and maintain the correct white paper for this deployment.",
                  "Bind wallet evidence and attestations to the asset record.",
                  "Manage issuer and asset verification across jurisdictions from one place.",
                  "Respond to reviewer requests without leaving the workflow.",
                  "Track public trust signals as the asset moves from tracked to fully verified.",
                  "Keep the asset page fresh as regulatory records or disclosures change.",
                ]}
                href={`/claim?entity=${asset.issuerEntity.slug}&asset=${asset.id}`}
                cta="Unlock Asset Dashboard"
              />
            </section>

            {related.length > 0 && (
              <section id="related-heading" aria-labelledby="related-title" className="mt-10 scroll-mt-24">
                <h2 id="related-title" className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">RELATED DEPLOYMENTS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {related.map(r => (
                    <Link
                      key={r.id}
                      href={`/assets/${r.chain}/${r.address}`}
                      className="border border-black/10 bg-white p-4 transition-all hover:border-black/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">{r.chain.toUpperCase()}</p>
                      <p className="font-semibold mt-1">{r.symbol} · {r.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <PageOutline
            title="On This Page"
            eyebrow="ASSET NAVIGATION"
            items={[
              { id: "asset-overview", label: "Overview" },
              { id: "issuer-heading", label: "Issuer of record" },
              { id: "regime-heading", label: "Issuance regime" },
              { id: "claim-heading", label: "Claim or verify" },
              { id: "readiness-heading", label: "Claim readiness" },
              { id: "timeline-heading", label: "Verification timeline" },
              { id: "dashboard-preview-heading", label: "Dashboard preview" },
              ...(related.length > 0 ? [{ id: "related-heading", label: "Related deployments" }] : []),
            ]}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
