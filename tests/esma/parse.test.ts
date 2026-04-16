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
  it("flags malformed LEIs", () => {
    const bad =
      "LEI,Legal Name,Home Member State,Competent Authority,Authorisation Date\nXX,Test,FR,AMF,2024-01-01";
    const r = parseEsmaCsv(bad, "emt");
    expect(r.ok).toBe(false);
  });
});
