import { z } from "zod";
export const assetInput = z.object({
  chain: z.enum(["solana", "ethereum", "base", "polygon", "tron", "arbitrum", "optimism"]),
  address: z.string().min(1),
  symbol: z.string().min(1).max(16),
  name: z.string().min(1),
  issuerEntityId: z.string(),
  issuanceRegime: z.enum(["MiCA-EMT", "MiCA-ART", "MiCA-Other", "DABA", "None"]),
  attestationRef: z.string().optional().or(z.literal("")),
});
export type AssetInput = z.infer<typeof assetInput>;
