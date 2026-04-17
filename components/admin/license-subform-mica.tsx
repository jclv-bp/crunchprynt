"use client";
import type { LicenseFormState } from "./license-editor";

type Props = {
  state: LicenseFormState;
  update: <K extends keyof LicenseFormState>(k: K, v: LicenseFormState[K]) => void;
};

const fieldCls = "w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30";

const micaRecordTypes = [
  "MiCA EMT authorization",
  "MiCA ART authorization",
  "MiCA CASP authorization",
  "MiCA Title II white paper notification",
];

export function LicenseSubformMica({ state, update }: Props) {
  return (
    <>
      <Row label="REGULATOR / COMPETENT AUTHORITY">
        <input className={fieldCls} value={state.regulator} onChange={e => update("regulator", e.target.value)} />
      </Row>
      <Row label="JURISDICTION (ISO alpha-2)">
        <input className={fieldCls} value={state.jurisdictionCountry} onChange={e => update("jurisdictionCountry", e.target.value)} />
      </Row>
      <Row label="RECORD TYPE">
        <input
          list="mica-record-types"
          className={fieldCls}
          value={state.licenseType}
          onChange={e => update("licenseType", e.target.value)}
        />
        <datalist id="mica-record-types">
          {micaRecordTypes.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </Row>
      <Row label="REFERENCE (E.G. LEI)">
        <input className={fieldCls} value={state.licenseReference} onChange={e => update("licenseReference", e.target.value)} />
      </Row>
      <Row label="PERMITTED ACTIVITIES (COMMA-SEPARATED)">
        <input className={fieldCls} value={state.permittedActivities.join(", ")}
          onChange={e => update("permittedActivities", splitCsv(e.target.value))} />
      </Row>
      <Row label="PASSPORTED TO (COMMA-SEPARATED ISO CODES)">
        <input className={fieldCls} value={state.passporting.join(", ")}
          onChange={e => update("passporting", splitCsv(e.target.value))} />
      </Row>
      <Row label="DOCUMENT URL (OPTIONAL)">
        <input className={fieldCls} value={state.documentPath}
          onChange={e => update("documentPath", e.target.value)} />
      </Row>
      <Row label="SOURCE RETRIEVED AT">
        <input type="date" className={fieldCls} value={state.sourceRetrievedAt} onChange={e => update("sourceRetrievedAt", e.target.value)} />
      </Row>
      <p className="text-xs text-black/60 mb-6">
        Use the Title II white-paper notification type for MiCA white papers covering crypto-assets other than ART and EMT. Document URL is useful when one entity has multiple notified white papers across jurisdictions.
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{label}</label>
      {children}
    </div>
  );
}
function splitCsv(v: string) { return v.split(",").map(s => s.trim()).filter(Boolean); }
