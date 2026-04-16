"use client";
import type { LicenseFormState } from "./license-editor";

type Props = {
  state: LicenseFormState;
  update: <K extends keyof LicenseFormState>(k: K, v: LicenseFormState[K]) => void;
};
const fieldCls = "w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30";

export function LicenseSubformBma({ state, update }: Props) {
  return (
    <>
      <Row label="REGULATOR">
        <input className={fieldCls} value={state.regulator} onChange={e => update("regulator", e.target.value)} />
      </Row>
      <Row label="JURISDICTION (ISO alpha-2, e.g. BM)">
        <input className={fieldCls} value={state.jurisdictionCountry} onChange={e => update("jurisdictionCountry", e.target.value)} />
      </Row>
      <Row label="LICENSE TYPE (e.g. DABA Class F)">
        <input className={fieldCls} value={state.licenseType} onChange={e => update("licenseType", e.target.value)} />
      </Row>
      <Row label="LICENSE REFERENCE">
        <input className={fieldCls} value={state.licenseReference} onChange={e => update("licenseReference", e.target.value)} />
      </Row>
      <Row label="PERMITTED ACTIVITIES (COMMA-SEPARATED)">
        <input className={fieldCls} value={state.permittedActivities.join(", ")}
          onChange={e => update("permittedActivities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
      </Row>
      <Row label="REVIEWER NAME (REQUIRED)">
        <input className={fieldCls} required value={state.reviewerName} onChange={e => update("reviewerName", e.target.value)} />
      </Row>
      <Row label="DATE OF VERIFICATION (REQUIRED)">
        <input type="date" className={fieldCls} required value={state.reviewerVerifiedAt} onChange={e => update("reviewerVerifiedAt", e.target.value)} />
      </Row>
      <p className="text-xs text-black/60 mb-6">
        Reviewer name and verification date are non-editable after save. Re-verification creates a new license record, not an edit.
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="mb-6"><label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{label}</label>{children}</div>);
}
