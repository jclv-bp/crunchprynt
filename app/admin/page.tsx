import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminOverview() {
  const [groups, entities, assets, imports] = await Promise.all([
    db.group.count(),
    db.entity.count(),
    db.asset.count(),
    db.importBatch.count(),
  ]);
  const stats: Array<{ label: string; value: number; href: string }> = [
    { label: "Groups", value: groups, href: "/admin/groups" },
    { label: "Entities", value: entities, href: "/admin/entities" },
    { label: "Assets", value: assets, href: "/admin/assets" },
    { label: "Imports", value: imports, href: "/admin/imports" },
  ];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-2">Overview</h1>
      <p className="text-black/60 mb-8">Registry state at a glance.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-black/10 p-6 hover:border-black/30 transition-colors"
          >
            <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">
              {s.label.toUpperCase()}
            </p>
            <p className="text-3xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
