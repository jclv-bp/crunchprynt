import { z } from "zod";
export const groupInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(64),
  displayName: z.string().min(1).max(128),
  description: z.string().max(1000),
  website: z.string().url().optional().or(z.literal("")),
  logoPath: z.string().optional(),
  commentary: z.string().max(4000).optional(),
});
export type GroupInput = z.infer<typeof groupInput>;
