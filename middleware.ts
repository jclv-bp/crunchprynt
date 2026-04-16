import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return new NextResponse("ADMIN_PASSWORD not set", { status: 500 });
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [user, pw] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (user === "admin" && pw === pass) return NextResponse.next();
  }
  return new NextResponse("Authorization required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}
