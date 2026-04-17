import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { resolveGroup } from "@/lib/slugs";
import { groupAssetsBySymbol, groupSummary } from "@/lib/rollups";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EntityCard } from "@/components/registry/entity-card";
import { CountRollup } from "@/components/registry/count-rollup";
import { PageOutline } from "@/components/registry/page-outline";

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
  const groupedAssets = groupAssetsBySymbol(entities.flatMap((entity) => entity.issuedAssets));
  const assetsRolledUp = summary.assetSummaries
    .map(a => `${a.symbol} · ${a.chainCount} ${a.chainCount === 1 ? "chain" : "chains"}`)
    .join(", ") || "None";
  const isIntakeGroup = group.slug === "unassigned";

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="max-w-[1200px] mx-auto px-6 py-12 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div>
            <section id="group-overview" className="border border-black/10 bg-white p-8">
              <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center">
                {group.logoPath && (
                  <Image src={group.logoPath} alt={`${group.displayName} logo`} width={64} height={64} />
                )}
                <div>
                  <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">GROUP</p>
                  <h1 className="text-4xl font-semibold tracking-[-0.02em]">{group.displayName}</h1>
                </div>
              </div>
              <p className="mb-8 max-w-3xl text-lg leading-[1.6] text-black/72">{group.description}</p>
              {isIntakeGroup ? (
                <div className="mb-8 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong className="mb-1 block text-xs font-semibold tracking-[0.15em]">INTERNAL INTAKE GROUP</strong>
                  This bucket is for imported entities awaiting editorial cleanup and final group assignment. It should not be treated as a public issuer family.
                </div>
              ) : null}
              <CountRollup
                items={[
                  { label: "Legal entities", value: String(summary.entityCount) },
                  { label: "Covered jurisdictions", value: String(summary.licensedJurisdictionCount) },
                  { label: "Assets deployed", value: assetsRolledUp },
                ]}
              />
            </section>

            <section id="member-entities-heading" aria-labelledby="member-entities-title" className="mb-12 mt-10 scroll-mt-24">
              <h2 id="member-entities-title" className="mb-4 text-xs font-semibold tracking-[0.15em] text-black/60">
                {isIntakeGroup ? "INTAKE ENTITIES" : "MEMBER ENTITIES"}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {entities.map(e => (
                  <EntityCard
                    key={e.id}
                    slug={e.slug}
                    legalName={e.legalName}
                    jurisdiction={e.jurisdictionCountry}
                    licenseCount={e.licenses.length}
                    claimStatus={e.claimStatus}
                    verificationStatus={e.verificationStatus}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-black/45">
                {isIntakeGroup
                  ? "These imported entities still need reviewer triage before they should appear as a coherent public group."
                  : "Regulatory records belong to member entities. Groups do not hold authorizations or notifications directly."}
              </p>
            </section>

            <section id="group-assets-heading" aria-labelledby="group-assets-title" className="mb-12 scroll-mt-24">
              <h2 id="group-assets-title" className="mb-4 text-xs font-semibold tracking-[0.15em] text-black/60">
                ASSETS ACROSS THE GROUP
              </h2>
              {groupedAssets.length === 0 ? (
                <p className="text-sm text-black/60">No assets issued by entities in this group.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {groupedAssets.map((assetGroup) => (
                    <li key={assetGroup.symbol} className="border border-black/10 bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.15em] text-black/60">ASSET FAMILY</p>
                          <h3 className="mt-2 text-xl font-semibold">{assetGroup.symbol} · {assetGroup.name}</h3>
                        </div>
                        <p className="text-xs font-semibold tracking-[0.15em] text-black/50">
                          {assetGroup.chains.length} {assetGroup.chains.length === 1 ? "CHAIN" : "CHAINS"}
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-black/70">
                        Regime: <span className="font-medium text-black">{assetGroup.issuanceRegime}</span>
                      </p>
                      <p className="mt-2 text-sm text-black/70">
                        Chains: <span className="text-black">{assetGroup.chains.join(", ")}</span>
                      </p>
                      <p className="mt-2 text-sm text-black/70">
                        Family profile:{" "}
                        <Link
                          href={`/assets/family/${assetGroup.deployments[0]?.issuerEntityId ?? entities.find((entity) => entity.issuedAssets.some((asset) => asset.symbol === assetGroup.symbol))?.slug ?? ""}/${assetGroup.familySlug}`}
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
                              className="inline-flex items-center gap-2 text-sm text-accent-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
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

            {group.commentary && (
              <section id="commentary-heading" aria-labelledby="commentary-title" className="scroll-mt-24 border border-black/10 bg-surface p-8">
                <h2 id="commentary-title" className="mb-3 text-xs font-semibold tracking-[0.15em] text-black/60">
                  WRITTEN BY BLUPRYNT
                </h2>
                <div className="text-black/80 whitespace-pre-line leading-[1.6]">{group.commentary}</div>
              </section>
            )}
          </div>

          <PageOutline
            title="On This Page"
            eyebrow="GROUP NAVIGATION"
            items={[
              { id: "group-overview", label: "Overview" },
              { id: "member-entities-heading", label: "Member entities" },
              { id: "group-assets-heading", label: "Assets across the group" },
              ...(group.commentary ? [{ id: "commentary-heading", label: "Bluprynt commentary" }] : []),
            ]}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
