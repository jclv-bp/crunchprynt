import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EntityForm } from "@/components/admin/entity-form";
import { LicenseEditor } from "@/components/admin/license-editor";
import { deleteEntity, deleteLicense } from "@/app/admin/_actions";
import { LicenseCard } from "@/components/registry/license-card";

export default async function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await db.entity.findUnique({
    where: { id },
    include: { licenses: true, group: true },
  });
  if (!entity) notFound();
  const groups = await db.group.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true } });
  const delEntity = deleteEntity.bind(null, id);

  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Edit entity</h1>
          <p className="mt-2 max-w-2xl text-sm leading-[1.6] text-black/60">
            Use this page to build a full public issuer profile, connect it to imported regulator records when available, and control whether the page is claimable, in claim review, or already claimed.
          </p>
        </div>
        <form action={delEntity as any}>
          <button type="submit" className="bg-destructive text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-destructive/90 transition-colors">
            DELETE ENTITY
          </button>
        </form>
      </div>

      <EntityForm initial={{ ...entity }} groups={groups} />

      <section className="mt-12">
        <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">EXISTING REGULATORY RECORDS</h2>
        {entity.licenses.length === 0 ? (
          <p className="text-sm text-black/60">No regulatory records recorded.</p>
        ) : (
          <div className="space-y-4">
            {entity.licenses.map(l => {
              const del = deleteLicense.bind(null, l.id);
              return (
                <div key={l.id} className="relative">
                  <LicenseCard
                    source={l.source as any}
                    regulator={l.regulator}
                    jurisdictionCountry={l.jurisdictionCountry}
                    licenseType={l.licenseType}
                    licenseReference={l.licenseReference}
                    permittedActivities={l.permittedActivities ? JSON.parse(l.permittedActivities) : []}
                    passporting={l.passporting ? JSON.parse(l.passporting) : []}
                    documentPath={l.documentPath}
                    sourceRetrievedAt={l.sourceRetrievedAt}
                    reviewerName={l.reviewerName}
                    reviewerVerifiedAt={l.reviewerVerifiedAt}
                  />
                  <form action={del as any} className="absolute top-4 right-4">
                    <button type="submit" className="text-xs tracking-[0.15em] text-destructive font-semibold hover:underline">
                      DELETE
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">ADD REGULATORY RECORD</h2>
        <LicenseEditor entityId={id} />
      </section>
    </>
  );
}
