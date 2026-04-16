import { z } from "zod";

const common = z.object({
  entityId: z.string(),
  regulator: z.string().min(1),
  jurisdictionCountry: z.string().length(2),
  licenseType: z.string().min(1),
  licenseReference: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "withdrawn", "suspended"]).default("active"),
});

export const licenseMica = common.extend({
  source: z.literal("esma_mica_register"),
  sourceRetrievedAt: z.coerce.date(),
  permittedActivities: z.array(z.string()).default([]),
  passporting: z.array(z.string()).default([]),
});

export const licenseBma = common.extend({
  source: z.literal("bma_manual"),
  sourceRetrievedAt: z.coerce.date(),
  reviewerName: z.string().min(1),
  reviewerVerifiedAt: z.coerce.date(),
  permittedActivities: z.array(z.string()).default([]),
});

export const licenseAsserted = common.extend({
  source: z.literal("issuer_asserted"),
  sourceRetrievedAt: z.coerce.date(),
  documentPath: z.string().min(1),
  documentHash: z.string().min(1),
});

export const licenseInput = z.discriminatedUnion("source", [licenseMica, licenseBma, licenseAsserted]);
export type LicenseInput = z.infer<typeof licenseInput>;
