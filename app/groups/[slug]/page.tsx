import { notFound } from "next/navigation";
import Image from "next/image";
import { resolveGroup } from "@/lib/slugs";
import { groupSummary } from "@/lib/rollups";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EntityCard } from "@/components/registry/entity-card";
import { CountRollup } from "@/components/registry/count-rollup";
import { AssetCard } from "@/components/registry/asset-card";

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
  const assetsRolledUp = summary.assetSummaries
    .map(a => `${a.symbol} · ${a.chainCount} ${a.chainCount === 1 ? "chain" : "chains"}`)
    .join(", ") || "none";

  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <div className="flex items-center gap-6 mb-8">
          {group.logoPath && (
            <Image src={group.logoPath} alt="" width={64} height={64} />
          )}
          <div>
            <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">GROUP</p>
            <h1 className="text-4xl font-semibold tracking-[-0.02em]">{group.displayName}</h1>
          </div>
        </div>
        <p className="text-lg text-black/70 max-w-3xl mb-8 leading-[1.5]">{group.description}</p>
        <CountRollup
          items={[
            { label: "Legal entities", value: String(summary.entityCount) },
            { label: "Licensed jurisdictions", value: String(summary.licensedJurisdictionCount) },
            { label: "Assets deployed", value: assetsRolledUp },
          ]}
        />

        <section className="mb-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">MEMBER ENTITIES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.map(e => (
              <EntityCard
                key={e.id}
                slug={e.slug}
                legalName={e.legalName}
                jurisdiction={e.jurisdictionCountry}
                licenseCount={e.licenses.length}
              />
            ))}
          </div>
          <p className="text-xs text-black/40 mt-4">
            Licenses held by member entities: see entity pages. Groups do not hold licenses directly.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">ASSETS ACROSS THE GROUP</h2>
          {entities.flatMap(e => e.issuedAssets).length === 0 ? (
            <p className="text-sm text-black/60">No assets issued by entities in this group.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entities.flatMap(e => e.issuedAssets).map(a => (
                <AssetCard
                  key={a.id}
                  chain={a.chain}
                  address={a.address}
                  symbol={a.symbol}
                  name={a.name}
                  issuanceRegime={a.issuanceRegime}
                />
              ))}
            </div>
          )}
        </section>

        {group.commentary && (
          <section className="bg-surface border border-black/10 p-8">
            <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-3">WRITTEN BY BLUPRYNT</p>
            <div className="text-black/80 whitespace-pre-line leading-[1.6]">{group.commentary}</div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
