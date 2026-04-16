"use client";
import { useState } from "react";
import { LicenseCard } from "@/components/registry/license-card";
import { LicenseSubformMica } from "./license-subform-mica";
import { LicenseSubformBma } from "./license-subform-bma";
import { LicenseSubformAsserted } from "./license-subform-asserted";
import { createLicense } from "@/app/admin/_actions";

type Source = "esma_mica_register" | "bma_manual" | "issuer_asserted";

export type LicenseFormState = {
  source: Source;
  regulator: string;
  jurisdictionCountry: string;
  licenseType: string;
  licenseReference: string;
  permittedActivities: string[];
  passporting: string[];
  sourceRetrievedAt: string; // YYYY-MM-DD
  reviewerName: string;
  reviewerVerifiedAt: string;
  documentPath: string;
  documentHash: string;
};

const emptyState = (): LicenseFormState => ({
  source: "esma_mica_register",
  regulator: "ESMA/AFM",
  jurisdictionCountry: "FR",
  licenseType: "MiCA EMT authorization",
  licenseReference: "",
  permittedActivities: [],
  passporting: [],
  sourceRetrievedAt: new Date().toISOString().slice(0, 10),
  reviewerName: "",
  reviewerVerifiedAt: new Date().toISOString().slice(0, 10),
  documentPath: "",
  documentHash: "",
});

export function LicenseEditor({ entityId }: { entityId: string }) {
  const [state, setState] = useState<LicenseFormState>(emptyState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof LicenseFormState>(k: K, v: LicenseFormState[K]) {
    setState(s => ({ ...s, [k]: v }));
  }

  function setSource(next: Source) {
    if (
      state.licenseReference ||
      state.reviewerName ||
      state.documentPath ||
      state.permittedActivities.length ||
      state.passporting.length
    ) {
      if (!confirm("Switching source will clear the current license fields. Continue?")) return;
    }
    setState({
      ...emptyState(),
      source: next,
      regulator: next === "bma_manual" ? "Bermuda Monetary Authority" : next === "esma_mica_register" ? "ESMA/AFM" : "",
      jurisdictionCountry: next === "bma_manual" ? "BM" : next === "esma_mica_register" ? "FR" : "",
      licenseType: next === "bma_manual" ? "DABA Class F" : next === "esma_mica_register" ? "MiCA EMT authorization" : "",
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaving(true);
    try {
      const base: any = {
        source: state.source, entityId,
        regulator: state.regulator,
        jurisdictionCountry: state.jurisdictionCountry,
        licenseType: state.licenseType,
        licenseReference: state.licenseReference,
        sourceRetrievedAt: new Date(state.sourceRetrievedAt),
        status: "active",
      };
      if (state.source === "esma_mica_register") {
        base.permittedActivities = state.permittedActivities;
        base.passporting = state.passporting;
      } else if (state.source === "bma_manual") {
        base.permittedActivities = state.permittedActivities;
        base.reviewerName = state.reviewerName;
        base.reviewerVerifiedAt = new Date(state.reviewerVerifiedAt);
      } else {
        base.documentPath = state.documentPath;
        base.documentHash = state.documentHash;
      }
      await createLicense(JSON.stringify(base));
      setState(emptyState());
    } catch (err: any) {
      setError(err.message ?? "failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={onSubmit} className="bg-white border border-black/10 p-8">
          <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">SOURCE</label>
          <div className="flex flex-wrap gap-2 mb-8">
            {(["esma_mica_register", "bma_manual", "issuer_asserted"] as const).map(s => (
              <button key={s} type="button" onClick={() => setSource(s)}
                className={`px-4 py-2 text-xs tracking-[0.15em] font-semibold border transition-colors ${
                  state.source === s
                    ? "bg-primary text-white border-primary"
                    : "border-black/10 text-black/60 hover:border-black/30"
                }`}>
                {s.replace(/_/g, " ").toUpperCase()}
              </button>
            ))}
          </div>

          {state.source === "esma_mica_register" && <LicenseSubformMica state={state} update={update} />}
          {state.source === "bma_manual" && <LicenseSubformBma state={state} update={update} />}
          {state.source === "issuer_asserted" && <LicenseSubformAsserted state={state} update={update} />}

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <button type="submit" disabled={saving}
            className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
            {saving ? "SAVING…" : "ADD LICENSE"}
          </button>
        </form>
        <div>
          <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-2">LIVE PREVIEW</p>
          <LicenseCard
            source={state.source}
            regulator={state.regulator || "—"}
            jurisdictionCountry={state.jurisdictionCountry || "—"}
            licenseType={state.licenseType || "—"}
            licenseReference={state.licenseReference || null}
            permittedActivities={state.permittedActivities}
            passporting={state.passporting}
            sourceRetrievedAt={new Date(state.sourceRetrievedAt || new Date())}
            reviewerName={state.reviewerName || null}
            reviewerVerifiedAt={state.reviewerVerifiedAt ? new Date(state.reviewerVerifiedAt) : null}
          />
        </div>
      </div>
    </div>
  );
}
