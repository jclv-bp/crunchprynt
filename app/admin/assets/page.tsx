import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminAssets() {
  const rows = await db.asset.findMany({
    orderBy: [{ symbol: "asc" }, { chain: "asc" }],
    include: { issuerEntity: { select: { legalName: true } } },
  });
  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Assets</h1>
          <p className="text-black/60 mt-1">{rows.length} asset deployments in registry.</p>
        </div>
        <Link
          href="/admin/assets/new"
          className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 transition-colors"
        >
          NEW ASSET
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-black/10">
          <thead>
            <tr className="border-b border-black/5">
              {["SYMBOL", "NAME", "CHAIN", "ADDRESS", "ISSUER ENTITY", "REGIME", ""].map(h => (
                <th
                  key={h}
                  className="text-left px-6 py-4 text-xs tracking-[0.15em] text-black/60 font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-black/40">
                  No assets yet.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="px-6 py-4 text-sm font-semibold">{r.symbol}</td>
                  <td className="px-6 py-4 text-sm">{r.name}</td>
                  <td className="px-6 py-4 text-sm">{r.chain}</td>
                  <td className="px-6 py-4 text-xs font-mono text-black/60">
                    {r.address.slice(0, 8)}…{r.address.slice(-6)}
                  </td>
                  <td className="px-6 py-4 text-sm">{r.issuerEntity.legalName}</td>
                  <td className="px-6 py-4 text-xs tracking-[0.15em] font-semibold">{r.issuanceRegime}</td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/assets/${r.id}`} className="text-accent-blue text-sm hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
