import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function AssetPage({ params }: { params: Promise<{ chain: string; address: string }> }) {
  const { chain, address } = await params;
  const asset = await db.asset.findUnique({
    where: { chain_address: { chain, address } },
    include: {
      issuerEntity: { include: { group: true, licenses: true } },
      linkedWhitePaper: true,
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

  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">
          {asset.chain.toUpperCase()} · ASSET
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.02em] mt-2">
          {asset.symbol} · {asset.name}
        </h1>
        <p className="font-mono text-sm text-black/60 mt-2 break-all">{asset.address}</p>

        <section className="mt-10 bg-white border border-black/10 p-6">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">ISSUER OF RECORD</p>
          <Link
            href={`/entities/${asset.issuerEntity.slug}`}
            className="text-2xl font-semibold hover:text-accent-blue"
          >
            {asset.issuerEntity.legalName}
          </Link>
          <p className="text-sm text-black/60 mt-1">
            Group:{" "}
            <Link href={`/groups/${asset.issuerEntity.group.slug}`} className="hover:text-accent-blue">
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
                <Link
                  key={r.id}
                  href={`/assets/${r.chain}/${r.address}`}
                  className="bg-white border border-black/10 p-4 hover:border-black/30 transition-colors"
                >
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
