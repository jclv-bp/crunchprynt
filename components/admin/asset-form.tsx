import { createAsset, updateAsset } from "@/app/admin/_actions";

type Initial = {
  id: string; chain: string; address: string; symbol: string; name: string;
  issuerEntityId: string; issuanceRegime: string; attestationRef: string | null;
};

const chains = ["solana", "ethereum", "base", "polygon", "tron", "arbitrum", "optimism"];
const regimes = ["MiCA-EMT", "MiCA-ART", "MiCA-Other", "DABA", "None"];

export function AssetForm({ initial, entities }: {
  initial?: Initial;
  entities: Array<{ id: string; legalName: string }>;
}) {
  const action = initial ? updateAsset.bind(null, initial.id) : createAsset;
  return (
    <form action={action as any} className="bg-white border border-black/10 p-8 max-w-[720px]">
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">CHAIN</label>
        <select name="chain" defaultValue={initial?.chain ?? "ethereum"} className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          {chains.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {([
        ["address", "CONTRACT ADDRESS", initial?.address ?? ""],
        ["symbol", "SYMBOL", initial?.symbol ?? ""],
        ["name", "NAME", initial?.name ?? ""],
        ["attestationRef", "ATTESTATION REFERENCE (OPTIONAL)", initial?.attestationRef ?? ""],
      ] as Array<[string, string, string]>).map(([name, label, value]) => (
        <div key={name} className="mb-6">
          <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{label}</label>
          <input name={name} defaultValue={value} className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
        </div>
      ))}
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">ISSUER ENTITY</label>
        <select name="issuerEntityId" defaultValue={initial?.issuerEntityId ?? ""} required className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          <option value="" disabled>Select an entity…</option>
          {entities.map(e => <option key={e.id} value={e.id}>{e.legalName}</option>)}
        </select>
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">ISSUANCE REGIME</label>
        <select name="issuanceRegime" defaultValue={initial?.issuanceRegime ?? "None"} className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          {regimes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <button type="submit" className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 transition-colors">
        {initial ? "SAVE" : "CREATE ASSET"}
      </button>
    </form>
  );
}
