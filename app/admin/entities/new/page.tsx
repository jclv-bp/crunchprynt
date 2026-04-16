import { db } from "@/lib/db";
import { EntityForm } from "@/components/admin/entity-form";

export default async function NewEntityPage() {
  const groups = await db.group.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true } });
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-8">New entity</h1>
      <EntityForm groups={groups} />
    </>
  );
}
