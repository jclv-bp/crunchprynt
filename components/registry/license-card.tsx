import { SourceBadge } from "./source-badge";

type Props = {
  source: "esma_mica_register" | "bma_manual" | "issuer_asserted";
  regulator: string;
  jurisdictionCountry: string;
  licenseType: string;
  licenseReference?: string | null;
  permittedActivities?: string[];
  passporting?: string[];
  sourceRetrievedAt: Date;
  reviewerName?: string | null;
  reviewerVerifiedAt?: Date | null;
};

const accent: Record<Props["source"], string> = {
  esma_mica_register: "border-l-emerald-500",
  bma_manual: "border-l-amber-500",
  issuer_asserted: "border-l-black/30",
};

export function LicenseCard(p: Props) {
  const updated = p.sourceRetrievedAt.toISOString().slice(0, 10);
  const subline =
    p.source === "esma_mica_register"
      ? `Source: ESMA MiCA Register · updated ${updated}`
      : p.source === "bma_manual"
      ? `Source: Bermuda Monetary Authority · manually verified by ${p.reviewerName} on ${p.reviewerVerifiedAt?.toISOString().slice(0, 10)}`
      : `Source: uploaded by issuer · hash verified but content not independently confirmed`;
  return (
    <div className={`bg-white border border-black/10 border-l-4 ${accent[p.source]} p-6`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="text-lg font-semibold">{p.licenseType}</h4>
          <p className="text-sm text-black/60 mt-1">{p.regulator} · {p.jurisdictionCountry}</p>
        </div>
        <SourceBadge source={p.source} />
      </div>
      {p.licenseReference && (
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">REFERENCE · {p.licenseReference}</p>
      )}
      {p.permittedActivities && p.permittedActivities.length > 0 ? (
        <div className="mb-2">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-1">PERMITTED ACTIVITIES</p>
          <ul className="text-sm list-disc list-inside text-black/80">
            {p.permittedActivities.map(a => <li key={a}>{a}</li>)}
          </ul>
        </div>
      ) : null}
      {p.passporting && p.passporting.length > 0 ? (
        <div className="mb-2">
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-1">PASSPORTED TO</p>
          <p className="text-sm text-black/80">{p.passporting.join(", ")}</p>
        </div>
      ) : null}
      <p className="text-xs text-black/60 mt-4">{subline}</p>
    </div>
  );
}
