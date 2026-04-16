"use server";
import { db } from "@/lib/db";
import { parseEsmaCsv } from "./parse";
import { reconcileRows, type EntityDiff } from "./map";
import type { EsmaFileType } from "./schemas";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function previewImport(
  fileName: string,
  fileType: EsmaFileType,
  csv: string,
  reviewer: string,
): Promise<
  | { ok: true; pendingId: string; diffs: EntityDiff[] }
  | { ok: false; errors: { row: number; message: string }[] }
> {
  await requireAdmin();
  if (!reviewer.trim()) {
    return { ok: false, errors: [{ row: 0, message: "reviewer name is required" }] };
  }
  const parsed = parseEsmaCsv(csv, fileType);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const diffs = await reconcileRows(parsed.rows, fileType, new Date());
  const pending = await db.pendingImport.create({
    data: {
      fileName,
      esmaFileType: fileType,
      diffsJson: JSON.stringify(diffs),
      reviewer,
    },
  });
  return { ok: true, pendingId: pending.id, diffs };
}

function slugifyNew(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

async function ensureOrphanGroup() {
  return db.group.upsert({
    where: { slug: "unassigned" },
    update: {},
    create: {
      slug: "unassigned",
      displayName: "Unassigned",
      description: "Entities created by CSV import awaiting manual group assignment.",
    },
  });
}

export async function commitImport(
  pendingId: string,
  acceptedIndexes: number[],
): Promise<{ batchId: string; confirmed: number; rejected: number }> {
  await requireAdmin();
  const pending = await db.pendingImport.findUnique({ where: { id: pendingId } });
  if (!pending) throw new Error("pending import not found");
  const diffs = JSON.parse(pending.diffsJson) as EntityDiff[];

  const batch = await db.importBatch.create({
    data: {
      fileName: pending.fileName,
      esmaFileType: pending.esmaFileType,
      reviewer: pending.reviewer,
      rowsConfirmed: acceptedIndexes.length,
      rowsRejected: diffs.length - acceptedIndexes.length,
    },
  });

  const accepted = new Set(acceptedIndexes);
  for (let i = 0; i < diffs.length; i++) {
    if (!accepted.has(i)) continue;
    const d = diffs[i];
    let entityId = d.matchedEntityId;
    if (!entityId && d.entityIncoming) {
      const orphan = await ensureOrphanGroup();
      const created = await db.entity.create({
        data: {
          slug: slugifyNew(d.entityIncoming.legalName),
          legalName: d.entityIncoming.legalName,
          lei: d.entityIncoming.lei ?? null,
          jurisdictionCountry: d.entityIncoming.jurisdictionCountry,
          groupId: orphan.id,
        },
      });
      entityId = created.id;
    }
    if (!entityId) continue;
    const li = d.licenseIncoming;
    await db.license.create({
      data: {
        entityId,
        source: "esma_mica_register",
        regulator: li.regulator,
        jurisdictionCountry: li.jurisdictionCountry,
        licenseType: li.licenseType,
        licenseReference: li.licenseReference ?? null,
        permittedActivities: JSON.stringify(li.permittedActivities ?? []),
        passporting: JSON.stringify(li.passporting ?? []),
        sourceRetrievedAt: new Date(li.sourceRetrievedAt),
        importBatchId: batch.id,
      },
    });
  }
  await db.pendingImport.delete({ where: { id: pendingId } });
  revalidatePath("/admin/imports");
  revalidatePath("/admin/entities");
  revalidatePath("/");
  return { batchId: batch.id, confirmed: acceptedIndexes.length, rejected: diffs.length - acceptedIndexes.length };
}

export async function cancelPending(pendingId: string) {
  await requireAdmin();
  await db.pendingImport.delete({ where: { id: pendingId } });
  revalidatePath("/admin/imports");
}
