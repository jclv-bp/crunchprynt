import { z } from "zod";

export const esmaFileTypes = [
  "emt", "art", "casp_authorized", "casp_noncompliant", "whitepapers",
] as const;
export type EsmaFileType = (typeof esmaFileTypes)[number];

const memberStates = z
  .string()
  .optional()
  .default("")
  .transform((s) =>
    s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [],
  );

const iso = z.coerce.date();

const emtOrArt = z.object({
  LEI: z.string().length(20),
  "Legal Name": z.string().min(1),
  "Home Member State": z.string().length(2),
  "Competent Authority": z.string().min(1),
  "Authorisation Date": iso,
  "Token Name": z.string().optional().default(""),
  "Token Symbol": z.string().optional().default(""),
  "Passporting Member States": memberStates,
});

const caspAuthorized = z.object({
  LEI: z.string().length(20),
  "Legal Name": z.string().min(1),
  "Home Member State": z.string().length(2),
  "Competent Authority": z.string().min(1),
  "Authorisation Date": iso,
  "Services Authorised": memberStates,
  "Passporting Member States": memberStates,
});

const caspNonCompliant = z.object({
  "Legal Name": z.string().min(1),
  Country: z.string().length(2),
  "Notice Date": iso,
  Summary: z.string().optional().default(""),
});

const whitepapers = z.object({
  LEI: z.string().length(20),
  "Issuer Legal Name": z.string().min(1),
  "Home Member State": z.string().length(2),
  "Notification Date": iso,
  "Token Name": z.string().min(1),
  "Token Symbol": z.string().min(1),
  "White Paper URL": z
    .string()
    .refine((v) => {
      try {
        // eslint-disable-next-line no-new
        new URL(v);
        return true;
      } catch {
        return false;
      }
    }, { message: "Invalid URL" }),
});

export const rowSchemas = {
  emt: emtOrArt,
  art: emtOrArt,
  casp_authorized: caspAuthorized,
  casp_noncompliant: caspNonCompliant,
  whitepapers,
} as const;
