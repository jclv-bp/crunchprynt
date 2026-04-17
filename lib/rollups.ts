import { db } from "./db";

type AssetLike = {
  id: string;
  chain: string;
  address: string;
  symbol: string;
  name: string;
  issuanceRegime: string;
};

export async function groupSummary(groupId: string) {
  const entities = await db.entity.findMany({
    where: { groupId },
    include: { licenses: true, issuedAssets: true },
  });
  const jurisdictions = new Set<string>();
  entities.forEach(e => e.licenses.forEach(l => jurisdictions.add(l.jurisdictionCountry)));
  const assetBySymbol = new Map<string, Set<string>>();
  entities.forEach(e => e.issuedAssets.forEach(a => {
    const chains = assetBySymbol.get(a.symbol) ?? new Set<string>();
    chains.add(a.chain); assetBySymbol.set(a.symbol, chains);
  }));
  return {
    entityCount: entities.length,
    licensedJurisdictionCount: jurisdictions.size,
    assetSummaries: Array.from(assetBySymbol.entries()).map(([symbol, chains]) => ({
      symbol, chainCount: chains.size, chains: Array.from(chains),
    })),
  };
}

export function groupAssetsBySymbol<T extends AssetLike>(assets: T[]) {
  const grouped = new Map<
    string,
    {
      symbol: string;
      name: string;
      issuanceRegime: string;
      deployments: T[];
      chains: string[];
    }
  >();

  for (const asset of assets) {
    const current = grouped.get(asset.symbol);
    if (current) {
      current.deployments.push(asset);
      if (!current.chains.includes(asset.chain)) current.chains.push(asset.chain);
      continue;
    }

    grouped.set(asset.symbol, {
      symbol: asset.symbol,
      name: asset.name,
      issuanceRegime: asset.issuanceRegime,
      deployments: [asset],
      chains: [asset.chain],
    });
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      chains: entry.chains.sort((a, b) => a.localeCompare(b)),
      deployments: entry.deployments.sort((a, b) => a.chain.localeCompare(b.chain)),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}
