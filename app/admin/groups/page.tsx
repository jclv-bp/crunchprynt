import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminGroups() {
  const rows = await db.group.findMany({
    orderBy: { displayName: "asc" },
    include: { _count: { select: { entities: true } } },
  });
  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Groups</h1>
          <p className="text-black/60 mt-1">{rows.length} groups in registry.</p>
        </div>
        <Link
          href="/admin/groups/new"
          className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 transition-colors"
        >
          NEW GROUP
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-black/10">
          <thead>
            <tr className="border-b border-black/5">
              {["NAME", "SLUG", "ENTITIES", ""].map(h => (
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
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-black/40">
                  No groups yet. Create one to begin.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="px-6 py-4 text-sm font-semibold">{r.displayName}</td>
                  <td className="px-6 py-4 text-sm font-mono text-black/60">{r.slug}</td>
                  <td className="px-6 py-4 text-sm">{r._count.entities}</td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/groups/${r.id}`} className="text-accent-blue text-sm hover:underline">
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
