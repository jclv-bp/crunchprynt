-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "lei" TEXT,
    "website" TEXT,
    "profileSummary" TEXT,
    "jurisdictionCountry" TEXT NOT NULL,
    "jurisdictionSubdivision" TEXT,
    "registrationNumber" TEXT,
    "groupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "verificationStatus" TEXT NOT NULL DEFAULT 'imported',
    "claimStatus" TEXT NOT NULL DEFAULT 'claimable',
    "claimPageNote" TEXT,
    "kyiReviewedAt" DATETIME,
    "coverageLimitationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Entity" ("claimPageNote", "claimStatus", "coverageLimitationNote", "createdAt", "groupId", "id", "jurisdictionCountry", "jurisdictionSubdivision", "kyiReviewedAt", "legalName", "lei", "profileSummary", "registrationNumber", "slug", "status", "updatedAt", "verificationStatus", "website") SELECT "claimPageNote", "claimStatus", "coverageLimitationNote", "createdAt", "groupId", "id", "jurisdictionCountry", "jurisdictionSubdivision", "kyiReviewedAt", "legalName", "lei", "profileSummary", "registrationNumber", "slug", "status", "updatedAt", "verificationStatus", "website" FROM "Entity";
DROP TABLE "Entity";
ALTER TABLE "new_Entity" RENAME TO "Entity";
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");
CREATE UNIQUE INDEX "Entity_lei_key" ON "Entity"("lei");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
