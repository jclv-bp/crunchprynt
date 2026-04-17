export function slugifyAssetSegment(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function assetFamilySlug(symbol: string, name: string) {
  return slugifyAssetSegment(`${symbol}-${name}`) || slugifyAssetSegment(symbol) || "asset";
}
