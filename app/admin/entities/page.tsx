import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminEntities() {
  const rows = await db.entity.findMany({
    orderBy: { legalName: "asc" },
    include: {
      group: { select: { displayName: true } },
      _count: { select: { licenses: true } },
    },
  });
  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Entities</h1>
          <p className="text-black/60 mt-1">{rows.length} legal entities in registry.</p>
        </div>
        <Link
          href="/admin/entities/new"
          className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 transition-colors"
        >
          NEW ENTITY
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-black/10">
          <thead>
            <tr className="border-b border-black/5">
              {["LEGAL NAME", "LEI", "JURISDICTION", "GROUP", "PROFILE", "LICENSES", ""].map(h => (
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
                  No entities yet.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="px-6 py-4 text-sm font-semibold">{r.legalName}</td>
                  <td className="px-6 py-4 text-sm font-mono text-black/60">{r.lei ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    {r.jurisdictionCountry}
                    {r.jurisdictionSubdivision ? ` (${r.jurisdictionSubdivision})` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm">{r.group.displayName}</td>
                  <td className="px-6 py-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold tracking-[0.12em] text-black/60">{r.verificationStatus}</div>
                      <div className="text-black/45">{r.claimStatus}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{r._count.licenses}</td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/entities/${r.id}`} className="text-accent-blue text-sm hover:underline">
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
