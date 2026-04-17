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
  if (parsed.rows.length === 0) {
    return {
      ok: false,
      errors: [
        {
          row: 1,
          message:
            "No data rows found. This ESMA CSV currently contains only headers, so there is nothing to import yet.",
        },
      ],
    };
  }
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

async function ensureSuggestedGroup(suggestion: EntityDiff["groupSuggestion"], fileType: EsmaFileType) {
  if (suggestion.action === "matched_existing" && suggestion.groupId) {
    return db.group.findUnique({ where: { id: suggestion.groupId } });
  }
  if (suggestion.action === "create_new") {
    return db.group.upsert({
      where: { slug: suggestion.slug },
      update: {},
      create: {
        slug: suggestion.slug,
        displayName: suggestion.displayName,
        description: `Group created during ${fileType} import. Review and enrich before public claim workflows begin.`,
      },
    });
  }
  return ensureOrphanGroup();
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
      // Dedupe by LEI. Real ESMA files have multiple rows per issuer
      // (e.g. one per white-paper notification), and earlier accepted
      // rows in this same commit may have already created the entity.
      if (d.entityIncoming.lei) {
        const existing = await db.entity.findUnique({
          where: { lei: d.entityIncoming.lei },
        });
        if (existing) entityId = existing.id;
      }
      if (!entityId) {
        const targetGroup = await ensureSuggestedGroup(d.groupSuggestion, pending.esmaFileType as EsmaFileType);
        if (!targetGroup) throw new Error("target group resolution failed during import");
        const created = await db.entity.create({
          data: {
            slug: slugifyNew(d.entityIncoming.legalName),
            legalName: d.entityIncoming.legalName,
            lei: d.entityIncoming.lei ?? null,
            jurisdictionCountry: d.entityIncoming.jurisdictionCountry,
            groupId: targetGroup!.id,
            verificationStatus: "imported",
            claimStatus: "claimable",
          },
        });
        entityId = created.id;
      }
    }
    if (!entityId) continue;
    const li = d.licenseIncoming;
    const existing = await db.license.findFirst({
      where: {
        entityId,
        source: "esma_mica_register",
        licenseType: li.licenseType,
        licenseReference: li.licenseReference ?? null,
        documentPath: li.documentPath ?? null,
      },
    });
    if (existing) {
      await db.license.update({
        where: { id: existing.id },
        data: {
          regulator: li.regulator,
          jurisdictionCountry: li.jurisdictionCountry,
          permittedActivities: JSON.stringify(li.permittedActivities ?? []),
          passporting: JSON.stringify(li.passporting ?? []),
          documentPath: li.documentPath ?? null,
          sourceRetrievedAt: new Date(li.sourceRetrievedAt),
          importBatchId: batch.id,
        },
      });
      continue;
    }
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
        documentPath: li.documentPath ?? null,
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
