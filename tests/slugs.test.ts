import { describe, it, expect } from "vitest";
import { isCanonicalId } from "@/lib/slugs";

describe("isCanonicalId", () => {
  it("recognizes cuid-shaped canonical ids", () => {
    expect(isCanonicalId("clz3x8a0e0000xyzabc123456")).toBe(true);
  });
  it("rejects human slugs", () => {
    expect(isCanonicalId("circle")).toBe(false);
    expect(isCanonicalId("circle-internet-financial")).toBe(false);
  });
});
