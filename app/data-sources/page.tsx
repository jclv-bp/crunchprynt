import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SourceBadge } from "@/components/registry/source-badge";

export default function DataSources() {
  const notCovered = [
    "NYDFS (US, New York)",
    "FCA (UK)",
    "MAS (Singapore)",
    "FINMA (Switzerland)",
    "FSA (Japan)",
    "VARA (UAE)",
    "SEC (US federal, where distinct from state-level)",
    "BaFin direct (beyond MiCA authorizations)",
    "ADGM / FSRA (Abu Dhabi)",
    "CNMV (Spain, beyond MiCA authorizations)",
    "Gibraltar GFSC",
  ];
  const tiers: Array<["esma_mica_register" | "bma_manual" | "issuer_asserted", string, string]> = [
    ["esma_mica_register", "Register-derived", "We redisplay what a primary regulatory register publishes, as of the retrieval date."],
    ["bma_manual", "Bluprynt-verified", "Bluprynt's own attestation — KYB, wallet control, and (today) manual license confirmation against the regulator's public register."],
    ["issuer_asserted", "Issuer-asserted", "Issuer-provided artifacts that Bluprynt hashes and timestamps. We host; the issuer represents."],
  ];
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="max-w-[900px] mx-auto px-6 py-16 md:px-8">
        <p className="text-xs tracking-[0.15em] text-black/60 font-semibold">METHODOLOGY</p>
        <h1 className="text-5xl font-semibold tracking-[-0.02em] mt-3 mb-8">Data sources</h1>
        <p className="text-lg text-black/70 leading-[1.6] mb-12">
          Where this registry's data comes from, how current it is, and what we do — and do not — do to collect it.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">The three trust tiers</h2>
          <div className="space-y-5">
            {tiers.map(([src, title, body]) => (
              <div key={src} className="bg-white border border-black/10 p-5 flex items-start gap-4">
                <SourceBadge source={src} />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-black/70 mt-1 leading-[1.6]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">MiCA (ESMA interim register)</h2>
          <p className="text-black/70 leading-[1.6] mb-3">
            Source: ESMA's interim MiCA register, published as weekly CSVs covering white papers, ART issuers, EMT issuers, authorised CASPs, and non-compliant CASPs. ESMA's transition to an integrated IT system is expected by mid-2026.
          </p>
          <p className="text-black/70 leading-[1.6] mb-3">
            For Title II white papers, ESMA notes that the listed white papers have not been reviewed or approved by an EU competent authority and that the offeror and/or issuer is solely responsible for the content. We therefore treat those entries as register-derived notifications, not as authorizations.
          </p>
          <p className="text-black/70 leading-[1.6]">
            In the PoC, data is hand-curated into pilot seed files via our internal CSV importer. In production, this importer runs automatically with "last synced" timestamps shown per entity and per white-paper notification.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">BMA (Bermuda Monetary Authority)</h2>
          <p className="text-black/70 leading-[1.6]">
            BMA licensing data is sourced from the BMA's public register search at{" "}
            <a
              className="text-accent-blue hover:underline"
              href="https://bma.bm/regulated-entities"
              target="_blank"
              rel="noreferrer"
            >
              bma.bm/regulated-entities
            </a>
            . During the PoC, each BMA entry was manually verified by a Bluprynt reviewer against the public register and is labeled on every entity page with reviewer name and verification date. We are in active conversation with the Authority regarding a structured data feed for production.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Coverage limitations</h2>
          <p className="text-black/70 leading-[1.6] mb-4">
            Licenses held in the following jurisdictions are <strong className="text-black">not</strong> currently reflected in the registry. The Paxos entity page demonstrates this concretely.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-black/80">
            {notCovered.map(j => (
              <li key={j} className="flex gap-2">
                <span className="text-black/30">·</span>
                <span>{j}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">What we do not scrape</h2>
          <p className="text-black/70 leading-[1.6]">
            Bluprynt does not operate automated crawlers against regulator websites that restrict crawling. Where a regulator's public data is available only through a human-browsable interface and the regulator has not provided a structured feed, we perform manual verification by a human reviewer and label the data accordingly. We prefer to build regulator relationships and request structured data directly.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
