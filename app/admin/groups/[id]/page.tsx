import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GroupForm } from "@/components/admin/group-form";
import { deleteGroup } from "@/app/admin/_actions";

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await db.group.findUnique({ where: { id } });
  if (!group) notFound();
  const del = deleteGroup.bind(null, id);
  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-[-0.02em]">Edit group</h1>
        <form action={del as any}>
          <button type="submit"
            className="bg-destructive text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-destructive/90 transition-colors">
            DELETE GROUP
          </button>
        </form>
      </div>
      <GroupForm initial={{ ...group }} />
    </>
  );
}
