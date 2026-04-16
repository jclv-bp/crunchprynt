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

function extract(fileType: EsmaFileType, r: Record<string, any>) {
  if (fileType === "casp_noncompliant") {
    return {
      lei: null as string | null,
      legalName: r.ae_name ?? null,
      homeState: r.ae_country ?? null,
      regulator: r.ae_competentAuthority ?? "ESMA",
      licenseType: "MiCA non-compliant CASP notice",
      permitted: [] as string[],
      passporting: [] as string[],
    };
  }
  const licenseType =
    fileType === "emt" ? "MiCA EMT authorization"
    : fileType === "art" ? "MiCA ART authorization"
    : fileType === "casp_authorized" ? "MiCA CASP authorization"
    : "MiCA white paper notification";
  const permitted: string[] = Array.isArray(r.ae_services_authorised)
    ? r.ae_services_authorised
    : r.ae_authorisation_other_emt
      ? [r.ae_authorisation_other_emt]
      : [];
  const passporting: string[] = Array.isArray(r.ae_passporting) ? r.ae_passporting : [];
  return {
    lei: r.ae_lei ?? null,
    legalName: r.ae_lei_name ?? null,
    homeState: r.ae_homeMemberState ?? null,
    regulator: r.ae_competentAuthority ?? "ESMA",
    licenseType,
    permitted,
    passporting,
  };
}

export async function reconcileRows(
  rows: unknown[],
  fileType: EsmaFileType,
  retrievedAt: Date,
): Promise<EntityDiff[]> {
  const { db } = await import("@/lib/db");
  const diffs: EntityDiff[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, any>;
    const ex = extract(fileType, r);
    const matched = ex.lei ? await db.entity.findUnique({ where: { lei: ex.lei } }) : null;
    diffs.push({
      matchedEntityId: matched?.id ?? null,
      matchKind: matched ? "lei" : "none",
      licenseIncoming: {
        source: "esma_mica_register",
        regulator: ex.regulator,
        jurisdictionCountry: ex.homeState,
        licenseType: ex.licenseType,
        licenseReference: ex.lei,
        permittedActivities: ex.permitted,
        passporting: ex.passporting,
        sourceRetrievedAt: retrievedAt,
      },
      entityIncoming: ex.legalName
        ? { legalName: ex.legalName, lei: ex.lei, jurisdictionCountry: ex.homeState }
        : null,
      fieldDiffs: computeFieldDiffs(matched, ex.legalName),
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
    return [{ field: "legalName", before: matched.legalName, after: incomingName }];
  }
  return [];
}
