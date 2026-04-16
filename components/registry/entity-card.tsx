import Link from "next/link";
export function EntityCard({ slug, legalName, jurisdiction, licenseCount }:
  { slug: string; legalName: string; jurisdiction: string; licenseCount: number }) {
  return (
    <Link href={`/entities/${slug}`} className="block bg-white border border-black/10 p-6 hover:border-black/30 transition-colors">
      <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">LEGAL ENTITY</p>
      <h3 className="text-lg font-semibold">{legalName}</h3>
      <p className="text-sm text-black/60 mt-1">{jurisdiction}</p>
      <p className="text-xs tracking-[0.15em] text-black/40 mt-4 font-semibold">
        {licenseCount} {licenseCount === 1 ? "LICENSE" : "LICENSES"}
      </p>
    </Link>
  );
}
