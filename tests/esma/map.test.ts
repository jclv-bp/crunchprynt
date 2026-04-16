import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { reconcileRows } from "@/lib/esma/map";
import { db } from "@/lib/db";

describe("reconcileRows", () => {
  let groupId: string;
  const lei = "TESTLEI1234567890XXX";
  beforeAll(async () => {
    const g = await db.group.create({
      data: { slug: "testco-recon", displayName: "TestCo", description: "" },
    });
    groupId = g.id;
    await db.entity.create({
      data: {
        slug: "testco-eu-recon",
        legalName: "TestCo EU S.A.",
        lei,
        jurisdictionCountry: "FR",
        groupId,
      },
    });
  });
  afterAll(async () => {
    await db.entity.deleteMany({ where: { groupId } });
    await db.group.delete({ where: { id: groupId } });
    await db.$disconnect();
  });

  it("matches on LEI", async () => {
    const rows = [
      {
        LEI: lei,
        "Legal Name": "TestCo EU S.A.",
        "Home Member State": "FR",
        "Competent Authority": "AMF",
        "Authorisation Date": new Date("2024-07-01"),
        "Passporting Member States": [],
      },
    ];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].matchKind).toBe("lei");
    expect(diffs[0].matchedEntityId).toBeTruthy();
  });

  it("creates new when LEI unknown", async () => {
    const rows = [
      {
        LEI: "UNKNOWN00000000000XX",
        "Legal Name": "Other S.A.",
        "Home Member State": "DE",
        "Competent Authority": "BaFin",
        "Authorisation Date": new Date("2024-07-01"),
        "Passporting Member States": [],
      },
    ];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].matchKind).toBe("none");
    expect(diffs[0].matchedEntityId).toBeNull();
  });
});
