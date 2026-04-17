"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DirectoryGroup = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  entityCount: number;
  jurisdictionCount: number;
  assetCount: number;
  entities: { legalName: string; jurisdiction: string }[];
  assets: { symbol: string; chain: string }[];
};

export function RegistryDirectory({ groups }: { groups: DirectoryGroup[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups.filter((group) => {
      const haystack = [
        group.displayName,
        group.description,
        ...group.entities.map((entity) => `${entity.legalName} ${entity.jurisdiction}`),
        ...group.assets.map((asset) => `${asset.symbol} ${asset.chain}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [groups, query]);

  return (
    <section aria-labelledby="directory-heading" className="mt-14">
      <div className="border border-black/10 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.15em] text-black/55">EXPLORE THE REGISTRY</p>
            <h2 id="directory-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Search groups, entities, and asset symbols
            </h2>
            <p className="mt-2 text-sm leading-[1.6] text-black/65">
              Use this as a quick navigation layer when you know the issuer, legal entity, jurisdiction, or token symbol you want to jump to.
            </p>
          </div>
          <p className="text-xs font-semibold tracking-[0.15em] text-black/45">
            {filtered.length} OF {groups.length} GROUPS
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="border border-black/10 bg-surface p-4">
            <label htmlFor="registry-search" className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">
              SEARCH DIRECTORY
            </label>
            <input
              id="registry-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Circle, France, USDC, Paxos..."
              className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/30"
            />
            <p className="mt-3 text-xs leading-[1.5] text-black/50">
              Matches group names, entity names, jurisdictions, symbols, and chain names.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((group) => (
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
                    <p className="text-xs font-semibold tracking-[0.15em] text-black/45">
                      {group.entityCount} ENTITIES
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-[1.6] text-black/68">{group.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold tracking-[0.12em] text-black/50">
                    <span>{group.jurisdictionCount} JURISDICTIONS</span>
                    <span>•</span>
                    <span>{group.assetCount} ASSETS</span>
                  </div>
                  <p className="mt-4 text-xs leading-[1.6] text-black/55">
                    Entities: {group.entities.map((entity) => entity.legalName).join(", ")}
                  </p>
                  <p className="mt-2 text-xs leading-[1.6] text-black/55">
                    Asset coverage: {group.assets.map((asset) => `${asset.symbol} on ${asset.chain}`).join(", ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 border border-dashed border-black/15 bg-surface px-4 py-5 text-sm text-black/60">
            No registry groups matched that search yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
