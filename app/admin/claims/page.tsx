import { db } from "@/lib/db";
import { updateClaimRequestStatus } from "./update";

export default async function AdminClaimsPage() {
  const claims = await db.claimRequest.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      entity: { select: { legalName: true, slug: true } },
      asset: { select: { symbol: true, chain: true, address: true } },
    },
  });

  return (
    <>
      <h1 className="mb-2 text-3xl font-semibold tracking-[-0.02em]">Claims</h1>
      <p className="mb-8 max-w-2xl text-black/60">
        Review incoming issuer claim requests, move them through review, and keep the public profile status aligned with real intake progress.
      </p>
      <div className="space-y-4">
        {claims.length === 0 ? (
          <div className="border border-black/10 bg-white p-6 text-sm text-black/60">No claim requests yet.</div>
        ) : (
          claims.map((claim) => (
            <section key={claim.id} className="border border-black/10 bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-black/55">CLAIM REQUEST</p>
                  <h2 className="mt-2 text-xl font-semibold">{claim.entity.legalName}</h2>
                  <p className="mt-2 text-sm text-black/65">
                    {claim.claimantName} · {claim.role} · {claim.organization}
                  </p>
                  <p className="mt-1 text-sm text-black/65">{claim.claimantEmail}</p>
                  {claim.asset ? (
                    <p className="mt-3 text-sm text-black/70">
                      Asset context: <span className="font-semibold text-black">{claim.asset.symbol} on {claim.asset.chain}</span>
                    </p>
                  ) : null}
                </div>
                <div className="text-xs text-black/50">
                  <div className="font-semibold tracking-[0.15em] text-black/60">{claim.status}</div>
                  <div className="mt-1">{claim.submittedAt.toISOString().slice(0, 10)}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-black/60">AUTHORITY BASIS</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-black/75">{claim.authorityBasis}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-black/60">SUPPORTING CONTEXT</h3>
                  <div className="mt-2 space-y-2 text-sm text-black/75">
                    {claim.website ? <p>Website: {claim.website}</p> : null}
                    {claim.walletAddresses ? <p>Wallets: {claim.walletAddresses}</p> : null}
                    {claim.supportingLinks ? <p>Links: {claim.supportingLinks}</p> : null}
                    {claim.notes ? <p>Notes: {claim.notes}</p> : null}
                  </div>
                </div>
              </div>

              <form action={updateClaimRequestStatus} className="mt-6 flex flex-col gap-3 border-t border-black/5 pt-4 md:flex-row md:items-end">
                <input type="hidden" name="claimId" value={claim.id} />
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">STATUS</label>
                  <select
                    name="status"
                    defaultValue={claim.status}
                    className="border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
                  >
                    <option value="submitted">submitted</option>
                    <option value="reviewing">reviewing</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">ADMIN NOTES</label>
                  <input
                    name="adminNotes"
                    defaultValue={claim.adminNotes ?? ""}
                    className="w-full border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
                  />
                </div>
                <button
                  type="submit"
                  className="border border-accent-blue bg-accent-blue px-5 py-3 text-sm font-semibold tracking-[0.15em] text-white transition-colors hover:bg-accent-blue/90"
                >
                  UPDATE CLAIM
                </button>
              </form>
            </section>
          ))
        )}
      </div>
    </>
  );
}
