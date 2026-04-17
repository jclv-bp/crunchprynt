import { z } from "zod";
export const entityInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(96),
  legalName: z.string().min(1),
  lei: z.string().length(20).regex(/^[A-Z0-9]{20}$/).optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  profileSummary: z.string().optional().or(z.literal("")),
  jurisdictionCountry: z.string().length(2),
  jurisdictionSubdivision: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
  groupId: z.string(),
  status: z.enum(["active", "wound_down", "revoked"]).default("active"),
  verificationStatus: z.enum(["imported", "enriched", "under_review", "verified"]).default("imported"),
  claimStatus: z.enum(["claimable", "claim_in_review", "claimed"]).default("claimable"),
  claimPageNote: z.string().optional().or(z.literal("")),
  kyiReviewedAt: z.string().optional().or(z.literal("")),
  coverageLimitationNote: z.string().optional().or(z.literal("")),
});
export type EntityInput = z.infer<typeof entityInput>;
