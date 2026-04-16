-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT,
    "logoPath" TEXT,
    "commentary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "lei" TEXT,
    "jurisdictionCountry" TEXT NOT NULL,
    "jurisdictionSubdivision" TEXT,
    "registrationNumber" TEXT,
    "groupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "coverageLimitationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRetrievedAt" DATETIME NOT NULL,
    "regulator" TEXT NOT NULL,
    "jurisdictionCountry" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseReference" TEXT,
    "permittedActivities" TEXT,
    "passporting" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reviewerName" TEXT,
    "reviewerVerifiedAt" DATETIME,
    "documentPath" TEXT,
    "documentHash" TEXT,
    "importBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "License_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ControlledWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "attestationRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlledWallet_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuerEntityId" TEXT NOT NULL,
    "issuanceRegime" TEXT NOT NULL,
    "linkedWhitePaperId" TEXT,
    "relatedGroupId" TEXT,
    "attestationRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_issuerEntityId_fkey" FOREIGN KEY ("issuerEntityId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Asset_linkedWhitePaperId_fkey" FOREIGN KEY ("linkedWhitePaperId") REFERENCES "License" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlugAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "groupId" TEXT,
    "entityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlugAlias_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SlugAlias_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "esmaFileType" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowsConfirmed" INTEGER NOT NULL,
    "rowsRejected" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "PendingImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "esmaFileType" TEXT NOT NULL,
    "diffsJson" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_lei_key" ON "Entity"("lei");

-- CreateIndex
CREATE UNIQUE INDEX "ControlledWallet_chain_address_key" ON "ControlledWallet"("chain", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_chain_address_key" ON "Asset"("chain", "address");

-- CreateIndex
CREATE UNIQUE INDEX "SlugAlias_alias_key" ON "SlugAlias"("alias");
