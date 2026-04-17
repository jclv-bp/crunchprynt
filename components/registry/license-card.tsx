import { SourceBadge } from "./source-badge";

type Props = {
  source: "esma_mica_register" | "bma_manual" | "issuer_asserted";
  regulator: string;
  jurisdictionCountry: string;
  licenseType: string;
  licenseReference?: string | null;
  permittedActivities?: string[];
  passporting?: string[];
  documentPath?: string | null;
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
  const isDocumentUrl = !!p.documentPath && /^https?:\/\//i.test(p.documentPath);
  const subline =
    p.source === "esma_mica_register"
      ? `Source: ESMA MiCA Register · updated ${updated}`
      : p.source === "bma_manual"
      ? `Source: Bermuda Monetary Authority · manually verified by ${p.reviewerName} on ${p.reviewerVerifiedAt?.toISOString().slice(0, 10)}`
      : `Source: uploaded by issuer · hash verified but content not independently confirmed`;
  return (
    <article className={`border border-black/10 border-l-4 ${accent[p.source]} bg-white p-6`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold">{p.licenseType}</h4>
          <p className="mt-1 text-sm text-black/70">{p.regulator} · {p.jurisdictionCountry}</p>
        </div>
        <SourceBadge source={p.source} />
      </div>
      {p.licenseReference && (
        <p className="mb-2 text-xs font-semibold tracking-[0.15em] text-black/60">REFERENCE · {p.licenseReference}</p>
      )}
      {p.permittedActivities && p.permittedActivities.length > 0 ? (
        <section className="mb-3">
          <h5 className="mb-1 text-xs font-semibold tracking-[0.15em] text-black/60">PERMITTED ACTIVITIES</h5>
          <ul className="list-disc space-y-1 pl-5 text-sm text-black/85">
            {p.permittedActivities.map(a => <li key={a}>{a}</li>)}
          </ul>
        </section>
      ) : null}
      {p.passporting && p.passporting.length > 0 ? (
        <section className="mb-3">
          <h5 className="mb-1 text-xs font-semibold tracking-[0.15em] text-black/60">PASSPORTED TO</h5>
          <p className="text-sm text-black/85">{p.passporting.join(", ")}</p>
        </section>
      ) : null}
      {p.documentPath ? (
        <section className="mb-3">
          <h5 className="mb-1 text-xs font-semibold tracking-[0.15em] text-black/60">DOCUMENT</h5>
          {isDocumentUrl ? (
            <a
              href={p.documentPath}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-accent-blue underline-offset-4 hover:underline"
            >
              {p.documentPath}
            </a>
          ) : (
            <p className="break-all text-sm text-black/85">{p.documentPath}</p>
          )}
        </section>
      ) : null}
      <p className="mt-4 text-sm text-black/70">{subline}</p>
    </article>
  );
}
