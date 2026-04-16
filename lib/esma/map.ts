import type { EsmaFileType } from "./schemas";

export type EntityDiff = {
  matchedEntityId: string | null;
  matchKind: "lei" | "none";
  licenseIncoming: {
    source: "esma_mica_register";
    regulator: string;
    jurisdictionCountry: string;
    licenseType: string;
    licenseReference: string | null;
    permittedActivities: string[];
    passporting: string[];
    sourceRetrievedAt: Date;
  };
  entityIncoming: {
    legalName: string;
    lei: string | null;
    jurisdictionCountry: string;
  } | null;
  fieldDiffs: { field: string; before: string | null; after: string | null }[];
};

export async function reconcileRows(
  rows: unknown[],
  fileType: EsmaFileType,
  retrievedAt: Date,
): Promise<EntityDiff[]> {
  const { db } = await import("@/lib/db");
  const diffs: EntityDiff[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, any>;
    const lei = r.LEI ?? null;
    const legalName = r["Legal Name"] ?? r["Issuer Legal Name"] ?? null;
    const homeState = r["Home Member State"] ?? r.Country ?? null;
    const matched = lei
      ? await db.entity.findUnique({ where: { lei } })
      : null;
    const licenseType =
      fileType === "emt"
        ? "MiCA EMT authorization"
        : fileType === "art"
          ? "MiCA ART authorization"
          : fileType === "casp_authorized"
            ? "MiCA CASP authorization"
            : fileType === "casp_noncompliant"
              ? "MiCA non-compliant CASP notice"
              : "MiCA white paper notification";
    const permitted: string[] = Array.isArray(r["Services Authorised"])
      ? r["Services Authorised"]
      : [];
    const passporting: string[] = Array.isArray(r["Passporting Member States"])
      ? r["Passporting Member States"]
      : [];
    diffs.push({
      matchedEntityId: matched?.id ?? null,
      matchKind: matched ? "lei" : "none",
      licenseIncoming: {
        source: "esma_mica_register",
        regulator: r["Competent Authority"] ?? "ESMA",
        jurisdictionCountry: homeState,
        licenseType,
        licenseReference: lei,
        permittedActivities: permitted,
        passporting,
        sourceRetrievedAt: retrievedAt,
      },
      entityIncoming: legalName
        ? { legalName, lei, jurisdictionCountry: homeState }
        : null,
      fieldDiffs: computeFieldDiffs(matched, legalName),
    });
  }
  return diffs;
}

function computeFieldDiffs(
  matched: { legalName: string } | null,
  incomingName: string | null,
) {
  if (!matched || !incomingName) return [];
  if (matched.legalName !== incomingName) {
    return [
      { field: "legalName", before: matched.legalName, after: incomingName },
    ];
  }
  return [];
}
