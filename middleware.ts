import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware for Edge runtime (no Prisma allowed)
// Auth is handled in individual pages/layouts using server-side auth()
export function middleware(request: NextRequest) {
  // Just pass through - auth is handled at page level
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
