ALTER TABLE "Entity" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'pending_review';
ALTER TABLE "Entity" ADD COLUMN "claimStatus" TEXT NOT NULL DEFAULT 'unclaimed';
ALTER TABLE "Entity" ADD COLUMN "claimPageNote" TEXT;
ALTER TABLE "Entity" ADD COLUMN "kyiReviewedAt" DATETIME;
