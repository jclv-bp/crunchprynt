import { db } from "@/lib/db";
import { EntityForm } from "@/components/admin/entity-form";

export default async function NewEntityPage() {
  const groups = await db.group.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true } });
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-8">New entity</h1>
      <p className="mb-8 max-w-2xl text-sm leading-[1.6] text-black/60">
        Create a full issuer profile before an issuer claims it, assign it to the right group, and decide whether the page should be claimable immediately or continue as an internal draft.
      </p>
      <EntityForm groups={groups} />
    </>
  );
}
