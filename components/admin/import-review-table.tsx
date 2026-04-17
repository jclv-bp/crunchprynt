"use client";
import type { EntityDiff } from "@/lib/esma/map";

export function ImportReviewTable({
  diffs,
  accepted,
  onToggle,
}: {
  diffs: EntityDiff[];
  accepted: Set<number>;
  onToggle: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white border border-black/10">
        <thead>
          <tr className="border-b border-black/5">
            {["ACCEPT", "MATCH", "LEGAL NAME", "LEI", "JURISDICTION", "GROUP LOGIC", "RECORD TYPE", "FIELD DIFFS"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs tracking-[0.15em] text-black/60 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diffs.map((d, i) => (
            <tr key={i} className="border-b border-black/5 hover:bg-black/[0.02]">
              <td className="px-4 py-3">
                <input type="checkbox" checked={accepted.has(i)} onChange={() => onToggle(i)} />
              </td>
              <td className="px-4 py-3">
                {d.matchKind === "lei" ? (
                  <span className="inline-flex items-center px-2 py-1 text-[10px] tracking-[0.15em] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">MATCHED</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-[10px] tracking-[0.15em] font-semibold bg-blue-50 text-accent-blue border border-blue-200">NEW</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{d.entityIncoming?.legalName ?? <em className="text-black/40">n/a</em>}</td>
              <td className="px-4 py-3 text-xs font-mono text-black/60">{d.entityIncoming?.lei ?? "—"}</td>
              <td className="px-4 py-3 text-sm">{d.entityIncoming?.jurisdictionCountry ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-black/60">
                <div className="font-semibold text-black/75">{d.groupSuggestion.displayName}</div>
                <div className="mt-1">{d.groupSuggestion.reason}</div>
              </td>
              <td className="px-4 py-3 text-sm">{d.licenseIncoming.licenseType}</td>
              <td className="px-4 py-3 text-xs text-black/60">
                {d.fieldDiffs.length === 0 ? "—" : d.fieldDiffs.map(f => (
                  <div key={f.field}>{f.field}: <s>{f.before}</s> → {f.after}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
