import { createEntity, updateEntity } from "@/app/admin/_actions";

type Initial = {
  id: string; slug: string; legalName: string; lei: string | null;
  website: string | null; profileSummary: string | null;
  jurisdictionCountry: string; jurisdictionSubdivision: string | null;
  registrationNumber: string | null; groupId: string;
  status: string; verificationStatus: string; claimStatus: string;
  claimPageNote: string | null; kyiReviewedAt: Date | null; coverageLimitationNote: string | null;
};

export function EntityForm({ initial, groups }: {
  initial?: Initial;
  groups: Array<{ id: string; displayName: string }>;
}) {
  const action = initial ? updateEntity.bind(null, initial.id) : createEntity;
  return (
    <form action={action as any} className="bg-white border border-black/10 p-8 max-w-[720px]">
      {([
        ["slug", "SLUG", initial?.slug ?? ""],
        ["legalName", "LEGAL NAME", initial?.legalName ?? ""],
        ["lei", "LEI (20 chars, uppercase alphanumeric)", initial?.lei ?? ""],
        ["website", "WEBSITE (OPTIONAL)", initial?.website ?? ""],
        ["jurisdictionCountry", "JURISDICTION (ISO-3166 alpha-2, e.g. FR)", initial?.jurisdictionCountry ?? ""],
        ["jurisdictionSubdivision", "SUBDIVISION (e.g. US-NY, optional)", initial?.jurisdictionSubdivision ?? ""],
        ["registrationNumber", "REGISTRATION NUMBER (optional)", initial?.registrationNumber ?? ""],
      ] as Array<[string, string, string]>).map(([name, label, value]) => (
        <div key={name} className="mb-6">
          <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">{label}</label>
          <input name={name} defaultValue={value}
            className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
        </div>
      ))}
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">GROUP</label>
        <select name="groupId" defaultValue={initial?.groupId ?? ""} required
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          <option value="" disabled>Select a group…</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.displayName}</option>)}
        </select>
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">STATUS</label>
        <select name="status" defaultValue={initial?.status ?? "active"}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          <option value="active">active</option>
          <option value="wound_down">wound_down</option>
          <option value="revoked">revoked</option>
        </select>
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">PROFILE STATUS</label>
        <select name="verificationStatus" defaultValue={initial?.verificationStatus ?? "imported"}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          <option value="imported">imported</option>
          <option value="enriched">enriched</option>
          <option value="under_review">under_review</option>
          <option value="verified">verified</option>
        </select>
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">CLAIM STATUS</label>
        <select name="claimStatus" defaultValue={initial?.claimStatus ?? "claimable"}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30">
          <option value="claimable">claimable</option>
          <option value="claim_in_review">claim_in_review</option>
          <option value="claimed">claimed</option>
        </select>
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">PROFILE REVIEWED AT (OPTIONAL)</label>
        <input name="kyiReviewedAt" type="date" defaultValue={initial?.kyiReviewedAt ? initial.kyiReviewedAt.toISOString().slice(0, 10) : ""}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">PUBLIC PROFILE SUMMARY (OPTIONAL)</label>
        <textarea name="profileSummary" defaultValue={initial?.profileSummary ?? ""} rows={4}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">CLAIMABILITY / PROFILE NOTE (OPTIONAL)</label>
        <textarea name="claimPageNote" defaultValue={initial?.claimPageNote ?? ""} rows={3}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
      </div>
      <div className="mb-6">
        <label className="text-xs tracking-[0.15em] text-black/60 block mb-2 font-semibold">COVERAGE LIMITATION NOTE (OPTIONAL)</label>
        <textarea name="coverageLimitationNote" defaultValue={initial?.coverageLimitationNote ?? ""} rows={3}
          className="w-full px-4 py-3 bg-input-bg border border-black/10 text-sm focus:outline-none focus:border-black/30" />
      </div>
      <button type="submit" className="bg-accent-blue text-white px-8 py-3 text-sm tracking-[0.15em] font-semibold hover:bg-accent-blue/90 transition-colors">
        {initial ? "SAVE" : "CREATE ENTITY"}
      </button>
    </form>
  );
}
