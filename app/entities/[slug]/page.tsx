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
    include: {
      group: true,
      licenses: true,
      controlledWallets: true,
      issuedAssets: true,
    },
  });
  if (!full) notFound();

  return (
    <>
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-8 py-12">
        <Link
          href={`/groups/${full.group.slug}`}
          className="text-xs tracking-[0.15em] text-black/60 font-semibold hover:text-black"
        >
          ← {full.group.displayName.toUpperCase()}
        </Link>
        <h1 className="text-4xl font-semibold tracking-[-0.02em] mt-2">{full.legalName}</h1>
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-black/60">
          <span>
            Jurisdiction: {full.jurisdictionCountry}
            {full.jurisdictionSubdivision ? ` (${full.jurisdictionSubdivision})` : ""}
          </span>
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
                <LicenseCard
                  key={l.id}
                  source={l.source as "esma_mica_register" | "bma_manual" | "issuer_asserted"}
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
                <li key={w.id} className="bg-white border border-black/10 px-4 py-3 flex flex-wrap justify-between gap-2">
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
      </main>
      <SiteFooter />
    </>
  );
}
