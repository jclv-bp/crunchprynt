import Link from "next/link";
export function AssetCard({ chain, address, symbol, name, issuanceRegime }:
  { chain: string; address: string; symbol: string; name: string; issuanceRegime: string }) {
  return (
    <Link href={`/assets/${chain}/${address}`} className="block bg-white border border-black/10 p-6 hover:border-black/30 transition-colors">
      <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">{chain.toUpperCase()}</p>
      <h3 className="text-lg font-semibold">{symbol} · {name}</h3>
      <p className="text-xs text-black/40 mt-2 font-mono">{address.slice(0, 8)}…{address.slice(-6)}</p>
      <p className="text-xs tracking-[0.15em] text-black/60 mt-4 font-semibold">REGIME · {issuanceRegime}</p>
    </Link>
  );
}
