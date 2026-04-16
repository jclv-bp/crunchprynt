import { describe, it, expect } from "vitest";
import { groupInput } from "@/lib/validators/group";
import { entityInput } from "@/lib/validators/entity";
import { licenseInput } from "@/lib/validators/license";

describe("groupInput", () => {
  it("accepts valid slug + name", () => {
    expect(() => groupInput.parse({
      slug: "circle", displayName: "Circle", description: "x"
    })).not.toThrow();
  });
  it("rejects invalid slug", () => {
    expect(() => groupInput.parse({
      slug: "Circle!", displayName: "Circle", description: ""
    })).toThrow();
  });
});

describe("entityInput", () => {
  it("accepts a 20-char LEI", () => {
    expect(() => entityInput.parse({
      slug: "circle-eu", legalName: "Circle Internet Financial Europe SAS",
      lei: "549300ABCDEFG1234567", jurisdictionCountry: "FR", groupId: "g1"
    })).not.toThrow();
  });
  it("rejects a malformed LEI", () => {
    expect(() => entityInput.parse({
      slug: "x", legalName: "x", lei: "not-an-lei", jurisdictionCountry: "FR", groupId: "g1"
    })).toThrow();
  });
});

describe("licenseInput discriminated union", () => {
  it("requires reviewerName for bma_manual", () => {
    expect(() => licenseInput.parse({
      source: "bma_manual", entityId: "e1", regulator: "BMA",
      jurisdictionCountry: "BM", licenseType: "DABA Class F",
      sourceRetrievedAt: "2026-04-10T00:00:00Z", reviewerVerifiedAt: "2026-04-10T00:00:00Z"
    })).toThrow();
  });
});
