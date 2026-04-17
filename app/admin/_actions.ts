"use server";
import { db } from "@/lib/db";
import { groupInput } from "@/lib/validators/group";
import { entityInput } from "@/lib/validators/entity";
import { assetInput } from "@/lib/validators/asset";
import { licenseInput } from "@/lib/validators/license";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function formToObject(form: FormData) {
  return Object.fromEntries(form.entries());
}

// ---------- GROUPS ----------
export async function createGroup(form: FormData) {
  await requireAdmin();
  const parsed = groupInput.parse(formToObject(form));
  const g = await db.group.create({ data: parsed });
  revalidatePath("/admin/groups");
  revalidatePath("/");
  redirect(`/admin/groups/${g.id}`);
}

export async function updateGroup(id: string, form: FormData) {
  await requireAdmin();
  const parsed = groupInput.parse(formToObject(form));
  const g = await db.group.update({ where: { id }, data: parsed });
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${id}`);
  revalidatePath("/");
  revalidatePath(`/groups/${g.slug}`);
}

export async function deleteGroup(id: string) {
  await requireAdmin();
  await db.group.delete({ where: { id } });
  revalidatePath("/admin/groups");
  redirect("/admin/groups");
}

// ---------- ENTITIES ----------
function normalizeEntity(input: Record<string, any>) {
  // Empty-string LEI => omit so the unique constraint doesn't collide across multiple empty entities.
  if (input.lei === "") delete input.lei;
  if (input.website === "") delete input.website;
  if (input.profileSummary === "") delete input.profileSummary;
  if (input.jurisdictionSubdivision === "") delete input.jurisdictionSubdivision;
  if (input.registrationNumber === "") delete input.registrationNumber;
  if (input.claimPageNote === "") delete input.claimPageNote;
  if (input.kyiReviewedAt === "") delete input.kyiReviewedAt;
  if (input.coverageLimitationNote === "") delete input.coverageLimitationNote;
  return input;
}

export async function createEntity(form: FormData) {
  await requireAdmin();
  const parsed = entityInput.parse(formToObject(form));
  const e = await db.entity.create({ data: normalizeEntity(parsed) as any });
  revalidatePath("/admin/entities");
  revalidatePath(`/groups/${(await db.group.findUnique({ where: { id: parsed.groupId } }))?.slug ?? ""}`);
  redirect(`/admin/entities/${e.id}`);
}

export async function updateEntity(id: string, form: FormData) {
  await requireAdmin();
  const parsed = entityInput.parse(formToObject(form));
  const e = await db.entity.update({ where: { id }, data: normalizeEntity(parsed) as any });
  revalidatePath("/admin/entities");
  revalidatePath(`/admin/entities/${id}`);
  revalidatePath(`/entities/${e.slug}`);
}

export async function deleteEntity(id: string) {
  await requireAdmin();
  await db.entity.delete({ where: { id } });
  revalidatePath("/admin/entities");
  redirect("/admin/entities");
}

// ---------- ASSETS ----------
export async function createAsset(form: FormData) {
  await requireAdmin();
  const parsed = assetInput.parse(formToObject(form));
  const a = await db.asset.create({ data: parsed });
  revalidatePath("/admin/assets");
  revalidatePath(`/assets/${a.chain}/${a.address}`);
  redirect(`/admin/assets/${a.id}`);
}

export async function updateAsset(id: string, form: FormData) {
  await requireAdmin();
  const parsed = assetInput.parse(formToObject(form));
  const a = await db.asset.update({ where: { id }, data: parsed });
  revalidatePath("/admin/assets");
  revalidatePath(`/admin/assets/${id}`);
  revalidatePath(`/assets/${a.chain}/${a.address}`);
}

export async function deleteAsset(id: string) {
  await requireAdmin();
  await db.asset.delete({ where: { id } });
  revalidatePath("/admin/assets");
  redirect("/admin/assets");
}

// ---------- LICENSES ----------
// License input is a JSON string (not FormData) because the discriminated union
// is tricky to express as form fields. Client-side, the subform serializes.
export async function createLicense(payload: string) {
  await requireAdmin();
  const raw = JSON.parse(payload);
  const parsed = licenseInput.parse(raw);
  const storable = {
    entityId: parsed.entityId,
    source: parsed.source,
    sourceRetrievedAt: parsed.sourceRetrievedAt,
    regulator: parsed.regulator,
    jurisdictionCountry: parsed.jurisdictionCountry,
    licenseType: parsed.licenseType,
    licenseReference: parsed.licenseReference || null,
    permittedActivities: "permittedActivities" in parsed ? JSON.stringify(parsed.permittedActivities) : null,
    passporting: "passporting" in parsed ? JSON.stringify(parsed.passporting) : null,
    status: parsed.status,
    reviewerName: "reviewerName" in parsed ? parsed.reviewerName : null,
    reviewerVerifiedAt: "reviewerVerifiedAt" in parsed ? parsed.reviewerVerifiedAt : null,
    documentPath: "documentPath" in parsed ? parsed.documentPath || null : null,
    documentHash: "documentHash" in parsed ? parsed.documentHash : null,
  };
  const created = await db.license.create({ data: storable as any });
  const entity = await db.entity.findUnique({ where: { id: parsed.entityId } });
  revalidatePath(`/admin/entities/${parsed.entityId}`);
  if (entity) revalidatePath(`/entities/${entity.slug}`);
  return { id: created.id };
}

export async function deleteLicense(id: string) {
  await requireAdmin();
  const license = await db.license.findUnique({ where: { id }, include: { entity: true } });
  if (!license) throw new Error("not found");
  await db.license.delete({ where: { id } });
  revalidatePath(`/admin/entities/${license.entityId}`);
  revalidatePath(`/entities/${license.entity.slug}`);
}
