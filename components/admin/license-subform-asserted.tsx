"use client";
import type { LicenseFormState } from "./license-editor";

type Props = {
  state: LicenseFormState;
  update: <K extends keyof LicenseFormState>(k: K, v: LicenseFormState[K]) => void;
};
const fieldCls = "w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30";

export function LicenseSubformAsserted({ state, update }: Props) {
  return (
    <>
      <Row label="REGULATOR / ASSERTED AUTHORITY">
        <input className={fieldCls} value={state.regulator} onChange={e => update("regulator", e.target.value)} />
      </Row>
      <Row label="JURISDICTION (ISO alpha-2)">
        <input className={fieldCls} value={state.jurisdictionCountry} onChange={e => update("jurisdictionCountry", e.target.value)} />
      </Row>
      <Row label="DOCUMENT TYPE (e.g. MiCA White Paper)">
        <input className={fieldCls} value={state.licenseType} onChange={e => update("licenseType", e.target.value)} />
      </Row>
      <Row label="DOCUMENT PATH (URL or local path)">
        <input className={fieldCls} required value={state.documentPath} onChange={e => update("documentPath", e.target.value)} />
      </Row>
      <Row label="DOCUMENT HASH (SHA-256 hex)">
        <input className={fieldCls} required value={state.documentHash} onChange={e => update("documentHash", e.target.value)} />
      </Row>
      <p className="text-xs text-black/60 mb-6">
        Bluprynt hosts and hashes issuer-asserted artifacts. The issuer represents; Bluprynt does not independently confirm content.
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="mb-6"><label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{label}</label>{children}</div>);
}
