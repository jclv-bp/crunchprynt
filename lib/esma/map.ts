import type { EsmaFileType } from "./schemas";

export type EntityDiff = {
  matchedEntityId: string | null;
  matchKind: "lei" | "none";
  groupSuggestion: {
    action: "matched_existing" | "create_new" | "fallback_unassigned";
    groupId: string | null;
    displayName: string;
    slug: string;
    reason: string;
  };
  licenseIncoming: {
    source: "esma_mica_register";
    regulator: string;
    jurisdictionCountry: string;
    licenseType: string;
    licenseReference: string | null;
    permittedActivities: string[];
    passporting: string[];
    documentPath: string | null;
    sourceRetrievedAt: Date;
  };
  entityIncoming: {
    legalName: string;
    lei: string | null;
    jurisdictionCountry: string;
  } | null;
  fieldDiffs: { field: string; before: string | null; after: string | null }[];
};

function normalizeCountryCode(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim().toUpperCase() ?? "";
    if (/^[A-Z]{2}$/.test(normalized)) return normalized;
  }
  return "ZZ";
}

function normalizeDocumentPath(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized === "EMT_NO_WP") return null;
  return normalized;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function normalizeGroupName(input: string) {
  return input
    .toLowerCase()
    .replace(/\b(ag|sa|sas|spa|nv|n-v|llc|ltd|limited|gmbh|oy|ou|uab|bv|srl|plc|inc|company|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWebsiteHost(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  const first = raw.split("|")[0]?.trim();
  if (!first) return null;
  const withProtocol = /^https?:\/\//i.test(first) ? first : `https://${first}`;
  try {
    const host = new URL(withProtocol).hostname.toLowerCase();
    const parts = host.split(".").filter(Boolean);
    if (parts.length >= 2) return parts.slice(-2).join(".");
    return host;
  } catch {
    return null;
  }
}

function titleizeGroupName(input: string) {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function inferGroupCandidate(r: Record<string, any>, legalName: string | null) {
  const commercialName = `${r.ae_commercial_name ?? ""}`.trim();
  if (commercialName) return { displayName: commercialName, reason: "commercial name from upload" };

  const host = parseWebsiteHost(r.ae_website);
  if (host) {
    const display = titleizeGroupName(host.replace(/\.[a-z]{2,}$/i, "").replace(/\./g, " "));
    return { displayName: display, reason: `website domain ${host}` };
  }

  if (legalName) {
    const normalized = normalizeGroupName(legalName);
    return { displayName: titleizeGroupName(normalized || legalName), reason: "normalized legal name" };
  }

  return null;
}

function extract(fileType: EsmaFileType, r: Record<string, any>) {
  if (fileType === "casp_noncompliant") {
    return {
      lei: r.ae_lei || null,
      legalName: r.ae_lei_name ?? null,
      homeState: normalizeCountryCode(r.ae_homeMemberState, r.ae_lei_cou_code),
      regulator: r.ae_competentAuthority ?? "ESMA",
      licenseType: "MiCA non-compliant CASP notice",
      permitted: [] as string[],
      passporting: [] as string[],
      documentPath: null as string | null,
    };
  }
  const licenseType =
    fileType === "emt" ? "MiCA EMT authorization"
    : fileType === "art" ? "MiCA ART authorization"
    : fileType === "casp_authorized" ? "MiCA CASP authorization"
    : "MiCA Title II white paper notification";
  const permitted: string[] = Array.isArray(r.ac_serviceCode) && r.ac_serviceCode.length > 0
    ? r.ac_serviceCode
    : Array.isArray(r.ae_services_authorised)
      ? r.ae_services_authorised
      : r.ae_authorisation_other_emt
      ? [r.ae_authorisation_other_emt]
      : [];
  const passporting: string[] = Array.isArray(r.ac_serviceCode_cou) && r.ac_serviceCode_cou.length > 0
    ? r.ac_serviceCode_cou.map((code: string) => code.trim().toUpperCase()).filter(Boolean)
    : Array.isArray(r.ae_passporting)
      ? r.ae_passporting.map((code: string) => code.trim().toUpperCase()).filter(Boolean)
      : [];
  const homeState = normalizeCountryCode(r.ae_homeMemberState, r.ae_lei_cou_code);
  const documentPath = fileType === "whitepapers" ? normalizeDocumentPath(r.wp_url) : null;
  return {
    lei: r.ae_lei || null,
    legalName: r.ae_lei_name ?? null,
    homeState,
    regulator: r.ae_competentAuthority ?? "ESMA",
    licenseType,
    permitted,
    passporting,
    documentPath,
  };
}

export async function reconcileRows(
  rows: unknown[],
  fileType: EsmaFileType,
  retrievedAt: Date,
): Promise<EntityDiff[]> {
  const { db } = await import("@/lib/db");
  const groups = await db.group.findMany({
    select: { id: true, displayName: true, slug: true, website: true },
  });
  const diffs: EntityDiff[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, any>;
    const ex = extract(fileType, r);
    const groupCandidate = inferGroupCandidate(r, ex.legalName);
    const candidateName = groupCandidate?.displayName ?? "Unassigned";
    const candidateSlug = slugify(candidateName) || "unassigned";
    const candidateNormalized = normalizeGroupName(candidateName);
    const candidateHost = parseWebsiteHost(r.ae_website);
    const matchedGroup =
      groups.find((group) => {
        const websiteHost = parseWebsiteHost(group.website);
        return !!candidateHost && !!websiteHost && candidateHost === websiteHost;
      }) ??
      groups.find((group) => normalizeGroupName(group.displayName) === candidateNormalized) ??
      groups.find((group) =>
        candidateNormalized &&
        (normalizeGroupName(group.displayName).includes(candidateNormalized) ||
          candidateNormalized.includes(normalizeGroupName(group.displayName))),
      );
    const matched = ex.lei ? await db.entity.findUnique({ where: { lei: ex.lei } }) : null;
    diffs.push({
      matchedEntityId: matched?.id ?? null,
      matchKind: matched ? "lei" : "none",
      groupSuggestion: matchedGroup
        ? {
            action: "matched_existing",
            groupId: matchedGroup.id,
            displayName: matchedGroup.displayName,
            slug: matchedGroup.slug,
            reason: candidateHost && parseWebsiteHost(matchedGroup.website) === candidateHost
              ? `matched existing group by website domain ${candidateHost}`
              : `matched existing group by name similarity to ${candidateName}`,
          }
        : groupCandidate
        ? {
            action: "create_new",
            groupId: null,
            displayName: candidateName,
            slug: candidateSlug,
            reason: `create a new group using ${groupCandidate.reason}`,
          }
        : {
            action: "fallback_unassigned",
            groupId: null,
            displayName: "Unassigned",
            slug: "unassigned",
            reason: "no reliable group signal was present in the upload",
          },
      licenseIncoming: {
        source: "esma_mica_register",
        regulator: ex.regulator,
        jurisdictionCountry: ex.homeState,
        licenseType: ex.licenseType,
        licenseReference: fileType === "whitepapers" ? ex.lei ?? ex.documentPath : ex.lei,
        permittedActivities: ex.permitted,
        passporting: ex.passporting,
        documentPath: ex.documentPath,
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
