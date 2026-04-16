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
          Primary-register–anchored profiles for regulated digital asset issuers. Each group exposes its legal entities, their licenses by jurisdiction, and the assets they issue on-chain.
        </p>
        {groups.length === 0 ? (
          <div className="bg-surface border border-black/10 p-8 text-sm text-black/60">
            No groups seeded yet. Run <span className="font-mono">npm run db:seed</span> to populate the pilot issuers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map(g => {
              const entCount = g.entities.length;
              const licJurisdictions = new Set(g.entities.flatMap(e => e.licenses.map(l => l.jurisdictionCountry)));
              const assetCount = g.entities.reduce((n, e) => n + e.issuedAssets.length, 0);
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.slug}`}
                  className="bg-white border border-black/10 p-8 hover:border-black/30 transition-colors"
                >
                  <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-3">GROUP</p>
                  <h2 className="text-2xl font-semibold">{g.displayName}</h2>
                  <p className="text-sm text-black/60 mt-2">{g.description}</p>
                  <p className="text-xs tracking-[0.15em] text-black/40 mt-6 font-semibold">
                    {entCount} {entCount === 1 ? "ENTITY" : "ENTITIES"} ·{" "}
                    {licJurisdictions.size} LICENSED {licJurisdictions.size === 1 ? "JURISDICTION" : "JURISDICTIONS"} ·{" "}
                    {assetCount} {assetCount === 1 ? "ASSET" : "ASSETS"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
