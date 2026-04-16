import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

async function main() {
  // Order matters for FK integrity.
  await db.license.deleteMany();
  await db.controlledWallet.deleteMany();
  await db.asset.deleteMany();
  await db.slugAlias.deleteMany();
  await db.entity.deleteMany();
  await db.importBatch.deleteMany();
  await db.pendingImport.deleteMany();
  await db.group.deleteMany();

  // =============== CIRCLE ===============
  const circle = await db.group.create({
    data: {
      slug: "circle",
      displayName: "Circle",
      description: "Issuer of USDC and EURC; multi-entity group with US, EU, Irish, and Bermudian operations.",
      website: "https://www.circle.com",
      logoPath: "/logos/circle.png",
    },
  });

  const circleUS = await db.entity.create({
    data: {
      slug: "circle-internet-financial-llc",
      legalName: "Circle Internet Financial, LLC",
      jurisdictionCountry: "US",
      jurisdictionSubdivision: "US-DE",
      registrationNumber: "5234567",
      groupId: circle.id,
    },
  });

  const circleEU = await db.entity.create({
    data: {
      slug: "circle-internet-financial-europe-sas",
      legalName: "Circle Internet Financial Europe SAS",
      lei: "549300XFFE1Z1R9ZDY90",
      jurisdictionCountry: "FR",
      registrationNumber: "879237548",
      groupId: circle.id,
    },
  });

  const circleIE = await db.entity.create({
    data: {
      slug: "circle-internet-financial-limited",
      legalName: "Circle Internet Financial Limited",
      jurisdictionCountry: "IE",
      registrationNumber: "636450",
      groupId: circle.id,
      coverageLimitationNote: "Central Bank of Ireland coverage not included in this PoC.",
    },
  });

  const circleBM = await db.entity.create({
    data: {
      slug: "circle-internet-bermuda-limited",
      legalName: "Circle Internet Bermuda Limited",
      jurisdictionCountry: "BM",
      registrationNumber: "54321",
      groupId: circle.id,
    },
  });

  await db.license.create({
    data: {
      entityId: circleEU.id,
      source: "esma_mica_register",
      sourceRetrievedAt: new Date("2026-04-10"),
      regulator: "AMF",
      jurisdictionCountry: "FR",
      licenseType: "MiCA EMT authorization",
      licenseReference: "549300XFFE1Z1R9ZDY90",
      permittedActivities: JSON.stringify(["Issuance of e-money tokens"]),
      passporting: JSON.stringify(["FR", "DE", "IE", "NL", "IT", "ES", "AT", "BE", "LU"]),
    },
  });

  await db.license.create({
    data: {
      entityId: circleBM.id,
      source: "bma_manual",
      sourceRetrievedAt: new Date("2026-04-10"),
      regulator: "Bermuda Monetary Authority",
      jurisdictionCountry: "BM",
      licenseType: "DABA Class F",
      licenseReference: "DABA-2021-001",
      permittedActivities: JSON.stringify(["Full digital asset business activities"]),
      reviewerName: "Bluprynt Compliance",
      reviewerVerifiedAt: new Date("2026-04-10"),
    },
  });

  await db.controlledWallet.createMany({
    data: [
      {
        entityId: circleUS.id,
        chain: "ethereum",
        address: "0x55FE002aefF02F77364de339a1292923A15844B8",
        attestationRef: "bp:att:circle-us-eth-01",
      },
    ],
  });

  await db.asset.createMany({
    data: [
      {
        chain: "solana",
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        name: "USD Coin",
        issuerEntityId: circleUS.id,
        issuanceRegime: "None",
        relatedGroupId: "usdc-branded",
      },
      {
        chain: "ethereum",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        name: "USD Coin",
        issuerEntityId: circleUS.id,
        issuanceRegime: "None",
        relatedGroupId: "usdc-branded",
      },
      {
        chain: "base",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        symbol: "USDC",
        name: "USD Coin",
        issuerEntityId: circleUS.id,
        issuanceRegime: "None",
        relatedGroupId: "usdc-branded",
      },
    ],
  });

  await db.slugAlias.create({
    data: { alias: "circle-inc", kind: "group", groupId: circle.id },
  });

  // =============== TETHER ===============
  const tether = await db.group.create({
    data: {
      slug: "tether",
      displayName: "Tether",
      description: "Issuer of USDT, the largest stablecoin by supply.",
      website: "https://tether.to",
      logoPath: "/logos/tether.png",
      commentary:
        "Tether is not authorized under MiCA. Following MiCA's application in December 2024, USDT was removed from major EU-regulated exchange venues. Tether has publicly stated it is pursuing compliance in other jurisdictions.",
    },
  });

  const tetherOps = await db.entity.create({
    data: {
      slug: "tether-operations-limited",
      legalName: "Tether Operations Limited",
      jurisdictionCountry: "VG",
      registrationNumber: "1840998",
      groupId: tether.id,
      coverageLimitationNote:
        "Tether Operations Limited is not registered with ESMA as a MiCA-authorized issuer as of 2026-04-10. Absence of a license record here reflects absence of authorization in the registry's covered jurisdictions, not an editorial claim.",
    },
  });

  await db.asset.createMany({
    data: [
      {
        chain: "ethereum",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        name: "Tether USD",
        issuerEntityId: tetherOps.id,
        issuanceRegime: "None",
        relatedGroupId: "usdt-branded",
      },
      {
        chain: "solana",
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        symbol: "USDT",
        name: "Tether USD",
        issuerEntityId: tetherOps.id,
        issuanceRegime: "None",
        relatedGroupId: "usdt-branded",
      },
      {
        chain: "tron",
        address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        symbol: "USDT",
        name: "Tether USD",
        issuerEntityId: tetherOps.id,
        issuanceRegime: "None",
        relatedGroupId: "usdt-branded",
      },
    ],
  });

  // =============== PAXOS ===============
  const paxos = await db.group.create({
    data: {
      slug: "paxos",
      displayName: "Paxos",
      description: "Regulated issuer of pyUSD and USDP; New York trust company with MiCA EMT authorization in Estonia.",
      website: "https://paxos.com",
      logoPath: "/logos/paxos.png",
    },
  });

  const paxosUS = await db.entity.create({
    data: {
      slug: "paxos-trust-company-llc",
      legalName: "Paxos Trust Company, LLC",
      jurisdictionCountry: "US",
      jurisdictionSubdivision: "US-NY",
      registrationNumber: "NY-LTC-2015",
      groupId: paxos.id,
      coverageLimitationNote:
        "Licensed by NYDFS as a limited-purpose trust company. NYDFS coverage is not included in this PoC; the license held by Paxos Trust Company does not appear in this registry's license records until NYDFS is added as a covered jurisdiction.",
    },
  });

  const paxosEE = await db.entity.create({
    data: {
      slug: "paxos-issuance-europe-ou",
      legalName: "Paxos Issuance Europe OÜ",
      lei: "549300A7ABCDEF123456",
      jurisdictionCountry: "EE",
      registrationNumber: "16456789",
      groupId: paxos.id,
    },
  });

  await db.license.create({
    data: {
      entityId: paxosEE.id,
      source: "esma_mica_register",
      sourceRetrievedAt: new Date("2026-04-10"),
      regulator: "Finantsinspektsioon",
      jurisdictionCountry: "EE",
      licenseType: "MiCA EMT authorization",
      licenseReference: "549300A7ABCDEF123456",
      permittedActivities: JSON.stringify(["Issuance of e-money tokens"]),
      passporting: JSON.stringify(["EE", "FI", "IE", "NL", "DE", "FR"]),
    },
  });

  await db.asset.createMany({
    data: [
      {
        chain: "solana",
        address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
        symbol: "pyUSD",
        name: "PayPal USD",
        issuerEntityId: paxosUS.id,
        issuanceRegime: "None",
        relatedGroupId: "pyusd-branded",
      },
      {
        chain: "ethereum",
        address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
        symbol: "pyUSD",
        name: "PayPal USD",
        issuerEntityId: paxosUS.id,
        issuanceRegime: "None",
        relatedGroupId: "pyusd-branded",
      },
    ],
  });

  // =============== APEX GROUP ===============
  const apex = await db.group.create({
    data: {
      slug: "apex-group",
      displayName: "Apex Group",
      description: "Financial services provider; Bermudian fund administration and digital asset services entity included here.",
      website: "https://theapexgroup.com",
      logoPath: "/logos/apex.png",
    },
  });

  const apexBM = await db.entity.create({
    data: {
      slug: "apex-fund-services-bermuda-ltd",
      legalName: "Apex Fund Services (Bermuda) Ltd",
      jurisdictionCountry: "BM",
      registrationNumber: "34567",
      groupId: apex.id,
    },
  });

  await db.license.create({
    data: {
      entityId: apexBM.id,
      source: "bma_manual",
      sourceRetrievedAt: new Date("2026-04-10"),
      regulator: "Bermuda Monetary Authority",
      jurisdictionCountry: "BM",
      licenseType: "Fund administration services",
      licenseReference: null,
      permittedActivities: JSON.stringify(["Fund administration", "Digital asset service provision"]),
      reviewerName: "Bluprynt Compliance",
      reviewerVerifiedAt: new Date("2026-04-10"),
    },
  });

  console.log("Seeded:", {
    groups: await db.group.count(),
    entities: await db.entity.count(),
    licenses: await db.license.count(),
    assets: await db.asset.count(),
    wallets: await db.controlledWallet.count(),
    aliases: await db.slugAlias.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
