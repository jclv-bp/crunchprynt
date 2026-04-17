"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateClaimInput = z.object({
  claimId: z.string().min(1),
  status: z.enum(["submitted", "reviewing", "approved", "rejected"]),
  adminNotes: z.string().optional().or(z.literal("")),
});

export async function updateClaimRequestStatus(form: FormData) {
  await requireAdmin();
  const parsed = updateClaimInput.parse(Object.fromEntries(form.entries()));
  const claim = await db.claimRequest.update({
    where: { id: parsed.claimId },
    data: {
      status: parsed.status,
      adminNotes: parsed.adminNotes || null,
      reviewedAt: new Date(),
    },
    include: { entity: true, asset: true },
  });

  if (parsed.status === "reviewing") {
    await db.entity.update({
      where: { id: claim.entityId },
      data: { claimStatus: "claim_in_review", verificationStatus: "under_review" },
    });
  } else if (parsed.status === "approved") {
    await db.entity.update({
      where: { id: claim.entityId },
      data: { claimStatus: "claimed", verificationStatus: "verified" },
    });
  }

  revalidatePath("/admin/claims");
  revalidatePath(`/entities/${claim.entity.slug}`);
  if (claim.asset) revalidatePath(`/assets/${claim.asset.chain}/${claim.asset.address}`);
}
