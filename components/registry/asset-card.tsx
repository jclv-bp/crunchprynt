import Link from "next/link";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";
export function AssetCard({ chain, address, symbol, name, issuanceRegime, whitePaperLinked }:
  {
    chain: string;
    address: string;
    symbol: string;
    name: string;
    issuanceRegime: string;
    whitePaperLinked?: boolean;
  }) {
  return (
    <Link
      href={`/assets/${chain}/${address}`}
      aria-label={`View ${symbol} on ${chain}`}
      className="block h-full border border-black/10 bg-white p-6 transition-all hover:border-black/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-black/60">{chain.toUpperCase()}</p>
      <h3 className="text-lg font-semibold">{symbol} · {name}</h3>
      <p className="mt-2 text-xs font-mono text-black/50">{address.slice(0, 8)}…{address.slice(-6)}</p>
      <p className="mt-4 text-xs font-semibold tracking-[0.15em] text-black/60">REGIME · {issuanceRegime}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <BlupryntBadge label={whitePaperLinked ? "WHITE PAPER LINKED" : "REGISTER TRACKED"} variant={whitePaperLinked ? "verified" : "imported"} />
      </div>
    </Link>
  );
}
