import { headers } from "next/headers";

export async function requireAdmin() {
  const h = await headers();
  const auth = h.get("authorization");
  if (!auth?.startsWith("Basic ")) throw new Error("unauthorized");
  const decoded = Buffer.from(auth.slice(6), "base64").toString();
  const [user, pw] = decoded.split(":");
  if (user !== "admin" || pw !== process.env.ADMIN_PASSWORD) throw new Error("unauthorized");
  return { user };
}
