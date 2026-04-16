import type { Group, Entity } from "@prisma/client";

export function isCanonicalId(input: string): boolean {
  return /^c[a-z0-9]{24}$/.test(input);
}

export async function resolveGroup(input: string): Promise<Group | null> {
  const { db } = await import("@/lib/db");
  if (isCanonicalId(input)) return db.group.findUnique({ where: { id: input } });
  const byAlias = await db.slugAlias.findUnique({ where: { alias: input } });
  if (byAlias?.groupId) return db.group.findUnique({ where: { id: byAlias.groupId } });
  return db.group.findUnique({ where: { slug: input } });
}

export async function resolveEntity(input: string): Promise<Entity | null> {
  const { db } = await import("@/lib/db");
  if (isCanonicalId(input)) return db.entity.findUnique({ where: { id: input } });
  const byAlias = await db.slugAlias.findUnique({ where: { alias: input } });
  if (byAlias?.entityId) return db.entity.findUnique({ where: { id: byAlias.entityId } });
  return db.entity.findUnique({ where: { slug: input } });
}
