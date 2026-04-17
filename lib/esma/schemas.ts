import { z } from "zod";

export const esmaFileTypes = [
  "emt", "art", "casp_authorized", "casp_noncompliant", "whitepapers",
] as const;
export type EsmaFileType = (typeof esmaFileTypes)[number];

// ESMA publishes dates as DD/MM/YYYY. Real-world quirks: empty strings,
// "n/a", "N/A", and occasional ISO dates all appear. We accept anything
// parseable and treat unparseable/missing as null rather than rejecting
// the whole row — a single bad date should not break an import.
const esmaDate = z
  .string()
  .optional()
  .default("")
  .transform((raw) => {
    const s = raw.replace(/\u00a0/g, " ").trim();
    if (!s || /^n\/?a$/i.test(s)) return null;
    const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return new Date(`${y}-${m}-${d}T00:00:00Z`);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  });

// Same semantics as esmaDate — we do not distinguish "required" at the
// schema level, because regulator-published data is often incomplete and
// the UI / reconciliation handles nullable dates gracefully.
const requiredEsmaDate = esmaDate;

const cleanedText = z
  .string()
  .optional()
  .default("")
  .transform((raw) => raw.replace(/\u00a0/g, " ").trim());

const optionalCountryCode = cleanedText.transform((value) => {
  const normalized = value.toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : "";
});

const optionalLei = cleanedText.transform((value) => {
  const normalized = value.toUpperCase();
  return /^[A-Z0-9]{20}$/.test(normalized) ? normalized : "";
});

// Comma-joined list → string[]; empty/missing → [].
const commaList = z
  .string()
  .optional()
  .default("")
  .transform((s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []));

const pipeList = z
  .string()
  .optional()
  .default("")
  .transform((s) =>
    s
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean),
  );

const yesNo = z
  .string()
  .optional()
  .default("")
  .transform((s) => /^y(es)?$/i.test(s.replace(/\u00a0/g, " ").trim()));

// ============================================================================
// EMT + white paper combined register (file: EMTWP.csv)
// ESMA publishes EMT issuer authorizations and their white-paper notifications
// as a single joined file. One row per white paper, so the same LEI repeats.
// ============================================================================
const emt = z.object({
  ae_competentAuthority: z.string().min(1),
  ae_homeMemberState: optionalCountryCode,
  ae_lei_name: z.string().min(1),
  ae_lei: optionalLei,
  ae_lei_cou_code: optionalCountryCode,
  ae_commercial_name: z.string().optional().default(""),
  ae_address: z.string().optional().default(""),
  ae_website: z.string().optional().default(""),
  ac_authorisationNotificationDate: requiredEsmaDate,
  ac_authorisationEndDate: esmaDate,
  ae_exemption48_4: yesNo,
  ae_exemption48_5: yesNo,
  ae_authorisation_other_emt: z.string().optional().default(""),
  ae_DTI_FFG: z.string().optional().default(""),
  ae_DTI: z.string().optional().default(""),
  wp_url: z.string().optional().default(""),
  wp_authorisationNotificationDate: esmaDate,
  wp_comments: z.string().optional().default(""),
  wp_lastupdate: esmaDate,
});

// ART — ESMA's current CSV shape is close to EMT, including address, end-date,
// white-paper metadata, and a credit-institution flag. We keep optional fields
// permissive because the register is still in an interim state.
const art = z.object({
  ae_competentAuthority: z.string().min(1),
  ae_homeMemberState: optionalCountryCode,
  ae_lei_name: z.string().min(1),
  ae_lei: optionalLei,
  ae_lei_cou_code: optionalCountryCode,
  ae_commercial_name: z.string().optional().default(""),
  ae_address: z.string().optional().default(""),
  ae_website: z.string().optional().default(""),
  ac_authorisationNotificationDate: requiredEsmaDate,
  ac_authorisationEndDate: esmaDate,
  ae_credit_institution: yesNo,
  wp_url: z.string().optional().default(""),
  wp_authorisationNotificationDate: esmaDate,
  wp_url_cou: z.string().optional().default(""),
  wp_comments: z.string().optional().default(""),
  wp_lastupdate: esmaDate,
});

// Authorised CASPs (file: CASPs.csv). Column names are ESMA-prefixed similar to
// EMT. Real schema unverified in this PoC — kept as best-effort.
const caspAuthorized = z.object({
  ae_competentAuthority: z.string().min(1),
  ae_homeMemberState: optionalCountryCode,
  ae_lei_name: z.string().min(1),
  ae_lei: optionalLei,
  ae_lei_cou_code: optionalCountryCode,
  ae_commercial_name: z.string().optional().default(""),
  ae_address: z.string().optional().default(""),
  ae_website: z.string().optional().default(""),
  ae_website_platform: z.string().optional().default(""),
  ac_authorisationNotificationDate: requiredEsmaDate,
  ac_authorisationEndDate: esmaDate,
  ac_serviceCode: pipeList,
  ac_serviceCode_cou: pipeList,
  ac_comments: z.string().optional().default(""),
  ac_lastupdate: esmaDate,
  ae_services_authorised: commaList,
  ae_passporting: commaList,
});

// Non-compliant CASPs (file: NC_CASPs.csv). Real schema unverified.
const caspNonCompliant = z.object({
  ae_competentAuthority: z.string().min(1),
  ae_homeMemberState: optionalCountryCode,
  ae_lei_name: z.string().min(1),
  ae_lei: optionalLei,
  ae_lei_cou_code: optionalCountryCode,
  ae_commercial_name: z.string().optional().default(""),
  ae_website: z.string().optional().default(""),
  ae_infrigment: z.string().optional().default(""),
  ae_reason: z.string().optional().default(""),
  ae_decision_date: requiredEsmaDate,
  ae_comments: z.string().optional().default(""),
  ae_lastupdate: esmaDate,
});

// Non-ART/EMT white papers (file: WP.csv). Real schema unverified.
const whitepapers = z.object({
  ae_competentAuthority: z.string().min(1),
  ae_homeMemberState: optionalCountryCode,
  ae_lei_name: z.string().min(1),
  ae_lei: optionalLei,
  ae_lei_cou_code: optionalCountryCode,
  ae_commercial_name: z.string().optional().default(""),
  wp_url: z.string().optional().default(""),
  wp_authorisationNotificationDate: requiredEsmaDate,
  wp_comments: z.string().optional().default(""),
});

export const rowSchemas = {
  emt,
  art,
  casp_authorized: caspAuthorized,
  casp_noncompliant: caspNonCompliant,
  whitepapers,
} as const;
