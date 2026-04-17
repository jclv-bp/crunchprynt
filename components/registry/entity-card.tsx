import Link from "next/link";
import { BlupryntBadge } from "@/components/registry/bluprynt-badge";

export function EntityCard({ slug, legalName, jurisdiction, licenseCount, claimStatus, verificationStatus }:
  {
    slug: string;
    legalName: string;
    jurisdiction: string;
    licenseCount: number;
    claimStatus?: string;
    verificationStatus?: string;
  }) {
  const claimVariant =
    claimStatus === "claimed" ? "verified" : claimStatus === "claim_in_review" ? "review" : "claimable";
  const claimLabel =
    claimStatus === "claimed" ? "ISSUER CLAIMED" : claimStatus === "claim_in_review" ? "CLAIM IN REVIEW" : "CLAIMABLE";
  const profileVariant =
    verificationStatus === "verified" ? "verified" : verificationStatus === "under_review" ? "review" : verificationStatus === "enriched" ? "claimable" : "imported";
  const profileLabel =
    verificationStatus === "verified"
      ? "PROFILE VERIFIED"
      : verificationStatus === "under_review"
      ? "PROFILE IN REVIEW"
      : verificationStatus === "enriched"
      ? "PROFILE ENRICHED"
      : "REGISTER IMPORTED";

  return (
    <Link
      href={`/entities/${slug}`}
      aria-label={`View entity ${legalName}`}
      className="block h-full border border-black/10 bg-white p-6 transition-all hover:border-black/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">LEGAL ENTITY</p>
        {claimStatus ? <BlupryntBadge label={claimLabel} variant={claimVariant} /> : null}
      </div>
      <h3 className="text-lg font-semibold">{legalName}</h3>
      <p className="mt-1 text-sm text-black/70">{jurisdiction}</p>
      {verificationStatus ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <BlupryntBadge label={profileLabel} variant={profileVariant} />
        </div>
      ) : null}
      <p className="mt-4 text-xs font-semibold tracking-[0.15em] text-black/50">
        {licenseCount} {licenseCount === 1 ? "RECORD" : "RECORDS"}
      </p>
    </Link>
  );
}
