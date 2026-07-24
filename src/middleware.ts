import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection / redirects. Currently a pass-through; add auth checks here
// when the account area needs to be gated.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/rentals/:path*"],
};
