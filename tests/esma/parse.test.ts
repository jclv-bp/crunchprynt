import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEsmaCsv } from "@/lib/esma/parse";
import type { EsmaFileType } from "@/lib/esma/schemas";

const load = (name: string) =>
  readFileSync(path.join(process.cwd(), "public/fixtures", name), "utf8");

describe("parseEsmaCsv", () => {
  it("parses EMT fixture", () => {
    const r = parseEsmaCsv(load("esma-emt-sample.csv"), "emt");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rows).toHaveLength(2);
  });
  it("parses all five fixture types", () => {
    const files: Array<[string, EsmaFileType]> = [
      ["esma-emt-sample.csv", "emt"],
      ["esma-art-sample.csv", "art"],
      ["esma-casp-authorized-sample.csv", "casp_authorized"],
      ["esma-casp-noncompliant-sample.csv", "casp_noncompliant"],
      ["esma-whitepapers-sample.csv", "whitepapers"],
    ];
    for (const [f, t] of files) {
      const r = parseEsmaCsv(load(f), t);
      expect(r.ok, `${f} failed to parse: ${JSON.stringify(r)}`).toBe(true);
    }
  });
  it("normalizes malformed LEIs instead of rejecting regulator rows", () => {
    const bad =
      "ae_competentAuthority,ae_homeMemberState,ae_lei_name,ae_lei,ac_authorisationNotificationDate\nAMF,FR,Test,XX,01/01/2024";
    const r = parseEsmaCsv(bad, "emt");
    expect(r.ok).toBe(true);
    if (r.ok) {
      const first = r.rows[0] as { ae_lei: string };
      expect(first.ae_lei).toBe("");
    }
  });
  it("parses DD/MM/YYYY dates correctly", () => {
    const r = parseEsmaCsv(
      readFileSync(path.join(process.cwd(), "public/fixtures/esma-emt-sample.csv"), "utf8"),
      "emt",
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const first = r.rows[0] as { ac_authorisationNotificationDate: Date };
      expect(first.ac_authorisationNotificationDate.toISOString().slice(0, 10)).toBe("2024-07-01");
    }
  });
  it("accepts the current ART register header shape", () => {
    const csv =
      "ae_competentAuthority,ae_homeMemberState,ae_lei_name,ae_lei,ae_lei_cou_code,ae_commercial_name,ae_address,ae_website,ac_authorisationNotificationDate,ac_authorisationEndDate,ae_credit_institution,wp_url,wp_authorisationNotificationDate,wp_url_cou,wp_comments,wp_lastupdate\n" +
      "BaFin,DE,Example ART Issuer AG,213800ARTISSUER00012,DE,xART,\"Berlin, Germany\",https://example-art.de/,20/01/2025,,No,https://example-art.de/whitepaper.pdf,20/01/2025,DE,Initial ART authorisation for xART,10/04/2026";
    const r = parseEsmaCsv(csv, "art");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rows).toHaveLength(1);
  });
  it("accepts the current CASP register header shape", () => {
    const r = parseEsmaCsv(load("esma-casp-authorized-sample.csv"), "casp_authorized");
    expect(r.ok).toBe(true);
    if (r.ok) {
      const second = r.rows[1] as { ae_homeMemberState: string; ae_lei: string };
      expect(second.ae_homeMemberState).toBe("");
      expect(second.ae_lei).toBe("");
    }
  });
  it("accepts the current non-compliant CASP register header shape", () => {
    const r = parseEsmaCsv(load("esma-casp-noncompliant-sample.csv"), "casp_noncompliant");
    expect(r.ok).toBe(true);
    if (r.ok) {
      const first = r.rows[0] as { ae_homeMemberState: string; ae_lei_name: string };
      expect(first.ae_homeMemberState).toBe("MT");
      expect(first.ae_lei_name).toBe("Unlicensed Crypto Ltd");
    }
  });
});
