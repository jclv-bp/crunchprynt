type Source = "esma_mica_register" | "bma_manual" | "issuer_asserted";
const labels: Record<Source, string> = {
  esma_mica_register: "ESMA MiCA Register",
  bma_manual: "Bermuda Monetary Authority",
  issuer_asserted: "Uploaded by issuer",
};
const styles: Record<Source, string> = {
  esma_mica_register: "bg-emerald-50 text-emerald-800 border-emerald-200",
  bma_manual: "bg-amber-50 text-amber-800 border-amber-200",
  issuer_asserted: "bg-black/5 text-black/70 border-black/10",
};
export function SourceBadge({ source }: { source: Source }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-[10px] tracking-[0.15em] font-semibold border ${styles[source]}`}>
      SOURCE · {labels[source].toUpperCase()}
    </span>
  );
}
