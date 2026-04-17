ALTER TABLE "Entity" ADD COLUMN "website" TEXT;
ALTER TABLE "Entity" ADD COLUMN "profileSummary" TEXT;

UPDATE "Entity"
SET "verificationStatus" = CASE "verificationStatus"
  WHEN 'pending_review' THEN 'imported'
  WHEN 'claim_ready' THEN 'claimable'
  WHEN 'kyi_pending' THEN 'under_review'
  WHEN 'kyi_verified' THEN 'verified'
  ELSE "verificationStatus"
END;

UPDATE "Entity"
SET "claimStatus" = CASE "claimStatus"
  WHEN 'unclaimed' THEN 'claimable'
  ELSE "claimStatus"
END;
