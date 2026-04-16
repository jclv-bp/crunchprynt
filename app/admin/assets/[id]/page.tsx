import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AssetForm } from "@/components/admin/asset-form";
import { deleteAsset } from "@/app/admin/_actions";

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await db.asset.findUnique({ where: { id } });
  if (!asset) notFound();
  const entities = await db.entity.findMany({ orderBy: { legalName: "asc" }, select: { id: true, legalName: true } });
  const del = deleteAsset.bind(null, id);
  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Edit asset</h1>
        <form action={del as any}>
          <button type="submit" className="bg-destructive text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-destructive/90 transition-colors">
            DELETE ASSET
          </button>
        </form>
      </div>
      <AssetForm initial={{ ...asset }} entities={entities} />
    </>
  );
}
