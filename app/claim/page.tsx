import Link from "next/link";
import { db } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { submitClaimRequest } from "./_actions";

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; asset?: string; submitted?: string }>;
}) {
  const { entity: entitySlug, asset: assetId, submitted } = await searchParams;
  const entity = entitySlug
    ? await db.entity.findUnique({ where: { slug: entitySlug }, include: { group: true } })
    : null;
  const asset = assetId
    ? await db.asset.findUnique({ where: { id: assetId } })
    : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-[960px] px-6 py-16 md:px-8">
        <section className="border border-black/10 bg-white p-8">
          <p className="text-xs font-semibold tracking-[0.15em] text-black/60">BLUPRYNT CLAIM INTAKE</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">Claim a registry profile</h1>
          <p className="mt-3 max-w-2xl text-base leading-[1.7] text-black/70">
            Submit an issuer claim so Bluprynt can review your authority, connect supporting records, and start the verification workflow for the public profile.
          </p>
          {entity ? (
            <div className="mt-6 border border-black/10 bg-surface p-5 text-sm text-black/75">
              <strong className="block text-xs font-semibold tracking-[0.15em] text-black/60">CLAIM TARGET</strong>
              <p className="mt-2">
                Entity: <span className="font-semibold text-black">{entity.legalName}</span>
                {" · "}
                Group: <span className="font-semibold text-black">{entity.group.displayName}</span>
              </p>
              {asset ? (
                <p className="mt-2">
                  Asset context: <span className="font-semibold text-black">{asset.symbol} on {asset.chain}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {submitted === "1" ? (
          <section className="mt-8 border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
            <strong className="block text-xs font-semibold tracking-[0.15em]">CLAIM REQUEST SUBMITTED</strong>
            <p className="mt-2">
              Bluprynt now has your claim request. We can review authority, supporting links, and any asset context you included.
            </p>
            {entity ? (
              <p className="mt-3">
                <Link href={`/entities/${entity.slug}`} className="text-emerald-900 underline underline-offset-4">
                  Return to {entity.legalName}
                </Link>
              </p>
            ) : null}
          </section>
        ) : null}

        <form action={submitClaimRequest} className="mt-8 border border-black/10 bg-white p-8">
          <input type="hidden" name="entityId" value={entity?.id ?? ""} />
          <input type="hidden" name="assetId" value={asset?.id ?? ""} />
          <div className="grid gap-6 md:grid-cols-2">
            {[
              ["claimantName", "YOUR NAME", ""],
              ["claimantEmail", "WORK EMAIL", ""],
              ["organization", "ORGANIZATION", entity?.legalName ?? ""],
              ["role", "ROLE / TITLE", ""],
              ["website", "WEBSITE (OPTIONAL)", entity?.website ?? ""],
            ].map(([name, label, value]) => (
              <div key={name}>
                <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">{label}</label>
                <input
                  name={name}
                  defaultValue={value}
                  required={name !== "website"}
                  className="w-full border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">AUTHORITY BASIS</label>
            <textarea
              name="authorityBasis"
              required
              rows={4}
              placeholder="Explain why you are authorized to claim this issuer profile: officer title, GC sign-off, delegated authority, etc."
              className="w-full border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">WALLET ADDRESSES (OPTIONAL)</label>
            <textarea
              name="walletAddresses"
              rows={3}
              placeholder="List any wallets or deployments that should be reviewed as part of this claim."
              className="w-full border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">SUPPORTING LINKS (OPTIONAL)</label>
            <textarea
              name="supportingLinks"
              rows={3}
              placeholder="Company page, authorization page, regulator listing, issuer docs, etc."
              className="w-full border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold tracking-[0.15em] text-black/60">ADDITIONAL NOTES (OPTIONAL)</label>
            <textarea
              name="notes"
              rows={4}
              placeholder="Anything Bluprynt should know before reviewing this claim."
              className="w-full border border-black/10 bg-input-bg px-4 py-3 text-sm focus:outline-none focus:border-black/30"
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-xs leading-[1.6] text-black/55">
              Claiming does not overwrite regulator-derived records. It starts an issuer workflow so Bluprynt can verify authority, enrich the public profile, and connect asset-level verification where applicable.
            </p>
            <button
              type="submit"
              disabled={!entity}
              className="border border-accent-blue bg-accent-blue px-6 py-3 text-sm font-semibold tracking-[0.15em] text-white transition-colors hover:bg-accent-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              SUBMIT CLAIM REQUEST
            </button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
