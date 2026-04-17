"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";

type GroupRecord = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  website?: string | null;
  entityCount: number;
  jurisdictionCount: number;
  assetCount: number;
  featuredEntities: string[];
  featuredAssets: string[];
};

type EntityRecord = {
  id: string;
  slug: string;
  legalName: string;
  jurisdictionCountry: string;
  groupSlug: string;
  groupName: string;
  isStandalone: boolean;
  licenseCount: number;
  assetCount: number;
  claimStatus: string;
  verificationStatus: string;
};

type AssetRecord = {
  id: string;
  chain: string;
  address: string;
  symbol: string;
  name: string;
  issuanceRegime: string;
  issuerSlug: string;
  issuerName: string;
  groupSlug: string;
  groupName: string;
  whitePaperLinked: boolean;
  issuerClaimStatus: string;
};

function claimBadge(status: string) {
  if (status === "claimed") {
    return <BlupryntBadge label="ISSUER CLAIMED" variant="verified" />;
  }

  if (status === "claim_in_review") {
    return <BlupryntBadge label="CLAIM IN REVIEW" variant="review" />;
  }

  return <BlupryntBadge label="CLAIMABLE" variant="claimable" />;
}

function profileBadge(status: string) {
  if (status === "verified") {
    return <BlupryntBadge label="PROFILE VERIFIED" variant="verified" />;
  }

  if (status === "under_review") {
    return <BlupryntBadge label="PROFILE IN REVIEW" variant="review" />;
  }

  if (status === "enriched") {
    return <BlupryntBadge label="PROFILE ENRICHED" variant="claimable" />;
  }

  return <BlupryntBadge label="REGISTER IMPORTED" variant="imported" />;
}

export function RegistryHub({
  groups,
  entities,
  assets,
}: {
  groups: GroupRecord[];
  entities: EntityRecord[];
  assets: AssetRecord[];
}) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;

    return groups.filter((group) =>
      [
        group.displayName,
        group.description,
        group.website ?? "",
        group.featuredEntities.join(" "),
        group.featuredAssets.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [groups, query]);

  const filteredEntities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entities;

    return entities.filter((entity) =>
      [
        entity.legalName,
        entity.jurisdictionCountry,
        entity.groupName,
        entity.claimStatus,
        entity.verificationStatus,
        entity.isStandalone ? "standalone independent ungrouped" : "grouped",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [entities, query]);

  const filteredAssets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return assets;

    return assets.filter((asset) =>
      [
        asset.symbol,
        asset.name,
        asset.chain,
        asset.address,
        asset.issuanceRegime,
        asset.issuerName,
        asset.groupName,
        asset.whitePaperLinked ? "white paper linked" : "no white paper",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [assets, query]);

  const showingAll = query.trim().length > 0;
  const visibleGroups = showingAll ? filteredGroups : filteredGroups.slice(0, 6);
  const visibleEntities = showingAll ? filteredEntities : filteredEntities.slice(0, 12);
  const visibleAssets = showingAll ? filteredAssets : filteredAssets.slice(0, 9);

  return (
    <section aria-labelledby="registry-hub-heading" className="mt-14">
      <div className="border border-black/10 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.15em] text-black/55">REGISTRY HUB</p>
            <h2 id="registry-hub-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Explore groups, entities, and assets as separate layers
            </h2>
            <p className="mt-3 text-sm leading-[1.7] text-black/65">
              Search once, then move between corporate groups, claimable legal entities, and token deployments without losing context.
            </p>
          </div>
          <div className="grid gap-3 text-xs font-semibold tracking-[0.14em] text-black/55 sm:grid-cols-3">
            <div className="border border-black/10 bg-surface px-4 py-3">{groups.length} GROUPS</div>
            <div className="border border-black/10 bg-surface px-4 py-3">{entities.length} ENTITIES</div>
            <div className="border border-black/10 bg-surface px-4 py-3">{assets.length} ASSETS</div>
          </div>
        </div>

        <div className="mt-6 border border-black/10 bg-surface p-4">
          <label htmlFor="registry-hub-search" className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">
            SEARCH THE REGISTRY
          </label>
          <input
            id="registry-hub-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by issuer, entity, token symbol, chain, country, or regime"
            className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/30"
          />
          <p className="mt-3 text-xs leading-[1.6] text-black/50">
            Results update across all three registry layers, including standalone entities that are ready to be claimed.
          </p>
        </div>

        <div className="mt-8 space-y-10">
          <section id="hub-groups" aria-labelledby="hub-groups-title">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] text-black/55">GROUPS</p>
                <h3 id="hub-groups-title" className="mt-2 text-xl font-semibold tracking-[-0.02em]">
                  Corporate families and issuer umbrellas
                </h3>
              </div>
              <p className="text-xs font-semibold tracking-[0.14em] text-black/45">
                SHOWING {visibleGroups.length} OF {filteredGroups.length}
              </p>
            </div>
            {filteredGroups.length === 0 ? (
              <div className="border border-dashed border-black/15 bg-surface px-4 py-5 text-sm text-black/60">
                No groups match that search yet.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {visibleGroups.map((group) => (
                  <li key={group.id}>
                    <Link
                      href={`/groups/${group.slug}`}
                      className="block h-full border border-black/10 bg-white p-6 transition-all hover:border-black/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.15em] text-black/55">GROUP</p>
                          <h3 className="mt-2 text-xl font-semibold">{group.displayName}</h3>
                        </div>
                        <div className="border border-black/10 bg-surface px-3 py-2 text-[11px] font-semibold tracking-[0.15em] text-black/50">
                          {group.entityCount} ENTITIES
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-[1.7] text-black/68">{group.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold tracking-[0.12em] text-black/50">
                        <span>{group.jurisdictionCount} JURISDICTIONS</span>
                        <span>•</span>
                        <span>{group.assetCount} ASSETS</span>
                        {group.website ? (
                          <>
                            <span>•</span>
                            <span>WEBSITE ON FILE</span>
                          </>
                        ) : null}
                      </div>
                      <p className="mt-4 text-xs leading-[1.6] text-black/55">
                        Entities: {group.featuredEntities.join(", ")}
                      </p>
                      <p className="mt-2 text-xs leading-[1.6] text-black/55">
                        Assets: {group.featuredAssets.join(", ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="hub-entities" aria-labelledby="hub-entities-title">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] text-black/55">ENTITIES</p>
                <h3 id="hub-entities-title" className="mt-2 text-xl font-semibold tracking-[-0.02em]">
                  Claimable legal profiles with sourced records
                </h3>
              </div>
              <p className="text-xs font-semibold tracking-[0.14em] text-black/45">
                SHOWING {visibleEntities.length} OF {filteredEntities.length}
              </p>
            </div>
            {filteredEntities.length === 0 ? (
              <div className="border border-dashed border-black/15 bg-surface px-4 py-5 text-sm text-black/60">
                No entities match that search yet.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleEntities.map((entity) => (
                  <li key={entity.id}>
                    <Link
                      href={`/entities/${entity.slug}`}
                      className="block h-full border border-black/10 bg-white p-6 transition-all hover:border-black/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-xs font-semibold tracking-[0.15em] text-black/55">
                          {entity.isStandalone ? "STANDALONE ENTITY" : "GROUP ENTITY"}
                        </p>
                        {claimBadge(entity.claimStatus)}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold leading-tight">{entity.legalName}</h3>
                      <p className="mt-2 text-sm text-black/68">
                        {entity.jurisdictionCountry} · {entity.groupName}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profileBadge(entity.verificationStatus)}
                      </div>
                      <p className="mt-4 text-xs font-semibold tracking-[0.15em] text-black/50">
                        {entity.licenseCount} {entity.licenseCount === 1 ? "RECORD" : "RECORDS"} · {entity.assetCount}{" "}
                        {entity.assetCount === 1 ? "ASSET" : "ASSETS"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="hub-assets" aria-labelledby="hub-assets-title">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] text-black/55">ASSETS</p>
                <h3 id="hub-assets-title" className="mt-2 text-xl font-semibold tracking-[-0.02em]">
                  On-chain deployments linked back to issuers
                </h3>
              </div>
              <p className="text-xs font-semibold tracking-[0.14em] text-black/45">
                SHOWING {visibleAssets.length} OF {filteredAssets.length}
              </p>
            </div>
            {filteredAssets.length === 0 ? (
              <div className="border border-dashed border-black/15 bg-surface px-4 py-5 text-sm text-black/60">
                No assets match that search yet.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleAssets.map((asset) => (
                  <li key={asset.id}>
                    <Link
                      href={`/assets/${asset.chain}/${asset.address}`}
                      className="block h-full border border-black/10 bg-white p-6 transition-all hover:border-black/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-xs font-semibold tracking-[0.15em] text-black/55">{asset.chain.toUpperCase()} ASSET</p>
                        {claimBadge(asset.issuerClaimStatus)}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">
                        {asset.symbol} · {asset.name}
                      </h3>
                      <p className="mt-2 text-sm text-black/68">
                        Issuer: {asset.issuerName}
                      </p>
                      <p className="mt-1 text-sm text-black/60">
                        Group: {asset.groupName}
                      </p>
                      <p className="mt-4 text-xs font-semibold tracking-[0.15em] text-black/50">
                        REGIME · {asset.issuanceRegime}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {asset.whitePaperLinked ? (
                          <BlupryntBadge label="WHITE PAPER LINKED" variant="verified" />
                        ) : (
                          <BlupryntBadge label="REGISTER TRACKED" variant="imported" />
                        )}
                      </div>
                      <p className="mt-4 font-mono text-xs text-black/45">
                        {asset.address.slice(0, 10)}…{asset.address.slice(-6)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
