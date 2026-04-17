"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const claimRequestInput = z.object({
  entityId: z.string().min(1),
  assetId: z.string().optional().or(z.literal("")),
  claimantName: z.string().min(2),
  claimantEmail: z.email(),
  organization: z.string().min(2),
  role: z.string().min(2),
  authorityBasis: z.string().min(10),
  website: z.string().optional().or(z.literal("")),
  walletAddresses: z.string().optional().or(z.literal("")),
  supportingLinks: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function submitClaimRequest(form: FormData) {
  const parsed = claimRequestInput.parse(Object.fromEntries(form.entries()));
  const entity = await db.entity.findUnique({ where: { id: parsed.entityId } });
  if (!entity) throw new Error("Entity not found");

  const asset = parsed.assetId
    ? await db.asset.findUnique({ where: { id: parsed.assetId } })
    : null;
  if (parsed.assetId && !asset) throw new Error("Asset not found");

  await db.claimRequest.create({
    data: {
      entityId: parsed.entityId,
      assetId: parsed.assetId || null,
      claimantName: parsed.claimantName,
      claimantEmail: parsed.claimantEmail,
      organization: parsed.organization,
      role: parsed.role,
      authorityBasis: parsed.authorityBasis,
      website: parsed.website || null,
      walletAddresses: parsed.walletAddresses || null,
      supportingLinks: parsed.supportingLinks || null,
      notes: parsed.notes || null,
      status: "submitted",
    },
  });

  if (asset) revalidatePath(`/assets/${asset.chain}/${asset.address}`);
  revalidatePath(`/entities/${entity.slug}`);
  revalidatePath("/admin/claims");
  redirect(`/claim?entity=${entity.slug}${asset ? `&asset=${asset.id}` : ""}&submitted=1`);
}
