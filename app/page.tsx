import Link from "next/link";
import { db } from "@/lib/db";
import { RegistryHub } from "@/components/registry/registry-hub";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function Home() {
  const allGroups = await db.group.findMany({
    orderBy: { displayName: "asc" },
    include: { entities: { include: { licenses: true, issuedAssets: true } } },
  });
  const intakeGroup = allGroups.find((group) => group.slug === "unassigned") ?? null;
  const groups = allGroups.filter((group) => group.slug !== "unassigned");

  const activeEntities = allGroups
    .flatMap((group) =>
      group.entities
        .filter((entity) => entity.status === "active")
        .map((entity) => ({
          ...entity,
          groupSlug: group.slug,
          groupName: group.displayName,
          isStandalone: group.slug === "unassigned",
        })),
    )
    .sort((a, b) => {
      const score = (candidate: typeof a) =>
        (candidate.claimStatus === "claimable" ? 3 : candidate.claimStatus === "claim_in_review" ? 2 : 1) +
        (candidate.verificationStatus === "verified" ? 2 : candidate.verificationStatus === "enriched" ? 1 : 0) +
        (candidate.isStandalone ? 1 : 0);

      return score(b) - score(a) || a.legalName.localeCompare(b.legalName);
    });

  const allAssets = activeEntities
    .flatMap((entity) =>
      entity.issuedAssets.map((asset) => ({
        ...asset,
        issuerSlug: entity.slug,
        issuerName: entity.legalName,
        groupSlug: entity.groupSlug,
        groupName: entity.groupName,
        issuerClaimStatus: entity.claimStatus,
      })),
    )
    .sort((a, b) => a.symbol.localeCompare(b.symbol) || a.chain.localeCompare(b.chain));

  const registryGroups = groups.map((group) => ({
    id: group.id,
    slug: group.slug,
    displayName: group.displayName,
    description: group.description,
    website: group.website,
    entityCount: group.entities.length,
    jurisdictionCount: new Set(group.entities.flatMap((entity) => entity.licenses.map((license) => license.jurisdictionCountry))).size,
    assetCount: group.entities.reduce((count, entity) => count + entity.issuedAssets.length, 0),
    featuredEntities: group.entities.slice(0, 3).map((entity) => entity.legalName),
    featuredAssets:
      group.entities
        .flatMap((entity) => entity.issuedAssets.map((asset) => `${asset.symbol} on ${asset.chain}`))
        .slice(0, 3),
  }));

  const registryEntities = activeEntities.map((entity) => ({
    id: entity.id,
    slug: entity.slug,
    legalName: entity.legalName,
    jurisdictionCountry: entity.jurisdictionCountry,
    groupSlug: entity.groupSlug,
    groupName: entity.groupName,
    isStandalone: entity.isStandalone,
    licenseCount: entity.licenses.length,
    assetCount: entity.issuedAssets.length,
    claimStatus: entity.claimStatus,
    verificationStatus: entity.verificationStatus,
  }));

  const registryAssets = allAssets.map((asset) => ({
    id: asset.id,
    chain: asset.chain,
    address: asset.address,
    symbol: asset.symbol,
    name: asset.name,
    issuanceRegime: asset.issuanceRegime,
    issuerSlug: asset.issuerSlug,
    issuerName: asset.issuerName,
    groupSlug: asset.groupSlug,
    groupName: asset.groupName,
    whitePaperLinked: Boolean(asset.linkedWhitePaperId),
    issuerClaimStatus: asset.issuerClaimStatus,
  }));

  const claimableEntities = registryEntities.filter((entity) => entity.claimStatus !== "claimed").length;
  const verifiedProfiles = registryEntities.filter((entity) => entity.verificationStatus === "verified").length;
  const whitePaperLinkedAssets = registryAssets.filter((asset) => asset.whitePaperLinked).length;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="max-w-[1200px] mx-auto px-6 py-12 md:px-8">
        <section
          aria-labelledby="home-heading"
          className="grid gap-6 border border-black/10 bg-white p-8 md:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.15em] text-black/60">PRIMARY-REGISTER ANCHORED</p>
            <h1 id="home-heading" className="mb-3 mt-2 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
              Verified Issuer Registry
            </h1>
            <p className="max-w-2xl text-lg leading-[1.65] text-black/70">
              Primary-register-anchored profiles for regulated digital asset issuers. Navigate the registry as three connected views: issuer groups, legal entities, and the assets they issue on-chain.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-black/10 bg-surface px-4 py-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-black/55">CLAIMABLE ENTITIES</p>
                <p className="mt-2 text-2xl font-semibold">{claimableEntities}</p>
              </div>
              <div className="border border-black/10 bg-surface px-4 py-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-black/55">VERIFIED PROFILES</p>
                <p className="mt-2 text-2xl font-semibold">{verifiedProfiles}</p>
              </div>
              <div className="border border-black/10 bg-surface px-4 py-4">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-black/55">WHITE PAPERS LINKED</p>
                <p className="mt-2 text-2xl font-semibold">{whitePaperLinkedAssets}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:content-start">
            <Link href="#registry-hub-heading" className="border border-black/10 bg-surface px-4 py-4 text-sm font-semibold text-black transition-colors hover:border-black/25">
              Explore the registry hub
            </Link>
            <Link href="#registry-entities-heading" className="border border-black/10 bg-surface px-4 py-4 text-sm font-semibold text-black transition-colors hover:border-black/25">
              Jump to entities
            </Link>
            <Link href="#registry-assets-heading" className="border border-black/10 bg-surface px-4 py-4 text-sm font-semibold text-black transition-colors hover:border-black/25">
              Jump to assets
            </Link>
            <Link href="/data-sources" className="border border-black/10 bg-surface px-4 py-4 text-sm font-semibold text-black transition-colors hover:border-black/25">
              Review trust tiers
            </Link>
          </div>
        </section>
        <section aria-label="Registry structure" className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="border border-black/10 bg-white p-6">
            <p className="text-xs font-semibold tracking-[0.15em] text-black/55">GROUPS</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Corporate families and brand-level rollups</h2>
            <p className="mt-3 text-sm leading-[1.7] text-black/68">
              Use groups to understand which legal entities sit under the same public issuer umbrella and how their asset coverage clusters together.
            </p>
          </div>
          <div id="registry-entities-heading" className="border border-black/10 bg-white p-6">
            <p className="text-xs font-semibold tracking-[0.15em] text-black/55">ENTITIES</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Claimable legal profiles with sourced records</h2>
            <p className="mt-3 text-sm leading-[1.7] text-black/68">
              Entities are where authorizations, notifications, and future issuer-submitted profile data live, whether or not they already belong to a polished group page.
            </p>
          </div>
          <div id="registry-assets-heading" className="border border-black/10 bg-white p-6">
            <p className="text-xs font-semibold tracking-[0.15em] text-black/55">ASSETS</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">On-chain deployments tied back to issuers</h2>
            <p className="mt-3 text-sm leading-[1.7] text-black/68">
              Assets connect token deployments, issuance regimes, and linked white papers back to the issuer entities responsible for them.
            </p>
          </div>
        </section>
        {groups.length === 0 && registryEntities.length === 0 ? (
          <div className="border border-black/10 bg-surface p-8 text-sm text-black/70">
            No groups seeded yet. Run <span className="font-mono">npm run db:seed</span> to populate the pilot issuers.
          </div>
        ) : (
          <RegistryHub groups={registryGroups} entities={registryEntities} assets={registryAssets} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
