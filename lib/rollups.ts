import { db } from "./db";

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
