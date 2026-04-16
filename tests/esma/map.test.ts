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
        ae_lei: lei,
        ae_lei_name: "TestCo EU S.A.",
        ae_homeMemberState: "FR",
        ae_competentAuthority: "AMF",
        ac_authorisationNotificationDate: new Date("2024-07-01"),
        ae_authorisation_other_emt: "Electronic money institution",
      },
    ];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].matchKind).toBe("lei");
    expect(diffs[0].matchedEntityId).toBeTruthy();
  });

  it("creates new when LEI unknown", async () => {
    const rows = [
      {
        ae_lei: "UNKNOWN00000000000XX",
        ae_lei_name: "Other S.A.",
        ae_homeMemberState: "DE",
        ae_competentAuthority: "BaFin",
        ac_authorisationNotificationDate: new Date("2024-07-01"),
      },
    ];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].matchKind).toBe("none");
    expect(diffs[0].matchedEntityId).toBeNull();
  });

  it("extracts permitted activities from ae_authorisation_other_emt", async () => {
    const rows = [
      {
        ae_lei: lei,
        ae_lei_name: "TestCo EU S.A.",
        ae_homeMemberState: "FR",
        ae_competentAuthority: "AMF",
        ac_authorisationNotificationDate: new Date("2024-07-01"),
        ae_authorisation_other_emt: "Electronic money institution",
      },
    ];
    const diffs = await reconcileRows(rows, "emt", new Date());
    expect(diffs[0].licenseIncoming.permittedActivities).toEqual([
      "Electronic money institution",
    ]);
  });
});
