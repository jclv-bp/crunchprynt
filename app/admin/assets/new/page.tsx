import { db } from "@/lib/db";
import { AssetForm } from "@/components/admin/asset-form";

export default async function NewAssetPage() {
  const entities = await db.entity.findMany({ orderBy: { legalName: "asc" }, select: { id: true, legalName: true } });
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-8">New asset</h1>
      <AssetForm entities={entities} />
    </>
  );
}
