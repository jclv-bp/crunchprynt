import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function HowClaimingWorks() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-[900px] mx-auto px-8 py-16">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">EXPLAINER</p>
        <h1 className="text-5xl font-semibold tracking-[-0.02em] mt-3 mb-8">
          How claiming a registry profile works
        </h1>
        <p className="text-lg text-black/70 leading-[1.6] mb-12">
          This page describes the production claim flow. Claiming is not live during the PoC — this registry is populated and maintained by Bluprynt reviewers.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Who can claim</h2>
          <p className="text-black/70 leading-[1.6] mb-3">
            <strong className="text-black">Entity-level claim</strong> — requires authority to represent the legal entity: officer, general counsel, or equivalent sign-off.
          </p>
          <p className="text-black/70 leading-[1.6] mb-3">
            <strong className="text-black">Group-level claim</strong> — requires corporate authorization to represent the whole group.
          </p>
          <p className="text-black/70 leading-[1.6]">
            <strong className="text-black">Wallet binding</strong> — requires an on-chain signature from the wallet, attributable to a claimed entity.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">The three-step flow</h2>
          <ol className="space-y-6">
            {[
              ["KYB verification", "Bluprynt verifies the claimant's authority to represent the entity."],
              ["Entity and wallet binding", "Signature challenge links the claimed wallet(s) to the verified entity."],
              ["Profile becomes claimed", "The registry profile switches from unclaimed to claimed across every page that references the entity or its assets."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-6">
                <span className="text-xs tracking-[0.15em] text-black/40 font-semibold mt-1 w-6 shrink-0">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-base">{title}</h3>
                  <p className="text-black/70 mt-1 leading-[1.6]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What claiming changes</h2>
          <p className="text-black/70 leading-[1.6] mb-3">
            A <em>Claimed by issuer</em> badge appears on the entity page. The issuer-asserted documents section becomes available — white papers, authorization information documents, and policies can be uploaded, hashed, and timestamped by Bluprynt.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What claiming does not change</h2>
          <p className="text-black/70 leading-[1.6]">
            Register-derived data is not modifiable by the issuer. Licenses sourced from ESMA, BMA, or other regulators are the regulators' to correct. The issuer owns the narrative on issuer-asserted artifacts but not on regulator-sourced facts — that distinction is the registry's authority posture.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Disputes and corrections</h2>
          <p className="text-black/70 leading-[1.6]">
            A dispute process exists for contested register-derived data (for example, an issuer believes a license is mis-attributed). Contact{" "}
            <a href="mailto:registry@bluprynt.com" className="text-accent-blue hover:underline">
              registry@bluprynt.com
            </a>{" "}
            with the specific field, the issuer of record, and the alternative reading of the primary register.
          </p>
        </section>

        <section>
          <h2 className="text-xs tracking-[0.15em] text-black/60 font-semibold mb-4">FLOW MOCKUPS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Claim entry", "KYB step", "Post-claim profile"].map(label => (
              <div key={label}>
                <div className="bg-surface border border-black/10 aspect-[16/10] flex items-center justify-center">
                  <span className="text-xs tracking-[0.15em] text-black/30 font-semibold">MOCKUP</span>
                </div>
                <p className="text-xs tracking-[0.15em] text-black/60 font-semibold mt-2">{label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
