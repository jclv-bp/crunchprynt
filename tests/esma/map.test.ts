import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { reconcileRows } from "@/lib/esma/map";
import { db } from "@/lib/db";

describe("reconcileRows", () => {
  let groupId: string;
  let websiteGroupId: string;
  const lei = "TESTLEI1234567890XXX";
  beforeAll(async () => {
    const g = await db.group.create({
      data: { slug: "testco-recon", displayName: "TestCo", description: "" },
    });
    groupId = g.id;
    const websiteGroup = await db.group.create({
      data: {
        slug: "circle-recon",
        displayName: "Circle",
        description: "",
        website: "https://www.circle.com/",
      },
    });
    websiteGroupId = websiteGroup.id;
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
    await db.group.delete({ where: { id: websiteGroupId } });
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

  it("extracts CASP services and passporting from the current ESMA columns", async () => {
    const rows = [
      {
        ae_competentAuthority: "Autoriteit Financiele Markten (AFM)",
        ae_homeMemberState: "",
        ae_lei_name: "Example CASP BV",
        ae_lei: "",
        ae_lei_cou_code: "NL",
        ac_serviceCode: [
          "a. providing custody and administration of crypto-assets on behalf of clients",
          "j. providing transfer services for crypto-assets on behalf of clients",
        ],
        ac_serviceCode_cou: ["NL", "BE", "DE"],
      },
    ];
    const diffs = await reconcileRows(rows, "casp_authorized", new Date());
    expect(diffs[0].matchKind).toBe("none");
    expect(diffs[0].entityIncoming?.jurisdictionCountry).toBe("NL");
    expect(diffs[0].licenseIncoming.permittedActivities).toEqual([
      "a. providing custody and administration of crypto-assets on behalf of clients",
      "j. providing transfer services for crypto-assets on behalf of clients",
    ]);
    expect(diffs[0].licenseIncoming.passporting).toEqual(["NL", "BE", "DE"]);
  });

  it("stores white-paper document URLs on MiCA notification records", async () => {
    const rows = [
      {
        ae_competentAuthority: "AFM",
        ae_homeMemberState: "NL",
        ae_lei_name: "Sample Token Issuer BV",
        ae_lei: "549300WHITEPAPER1234",
        wp_url: "https://example.com/whitepaper.pdf",
      },
    ];
    const diffs = await reconcileRows(rows, "whitepapers", new Date());
    expect(diffs[0].licenseIncoming.licenseType).toBe("MiCA Title II white paper notification");
    expect(diffs[0].licenseIncoming.documentPath).toBe("https://example.com/whitepaper.pdf");
  });

  it("suggests an existing group from website-domain logic", async () => {
    const rows = [
      {
        ae_lei: "",
        ae_lei_name: "Circle Internet Financial Europe SAS",
        ae_homeMemberState: "FR",
        ae_commercial_name: "Circle",
        ae_website: "https://www.circle.com/",
        wp_url: "https://www.circle.com/fr/legal/mica-usdc-whitepaper",
      },
    ];
    const diffs = await reconcileRows(rows, "whitepapers", new Date());
    expect(diffs[0].groupSuggestion.action).toBe("matched_existing");
    expect(diffs[0].groupSuggestion.displayName).toBeTruthy();
  });
});
