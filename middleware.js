import { NextResponse } from "next/server";
import { GATE_COOKIE_NAME, verifyGateToken } from "./lib/site-gate";

// Site-wide access gate. Applies to everything the matcher below allows
// through EXCEPT /battle — team members reach that page via a private
// room+token link with no account at all, by design, so it must never
// require this gate's shared credentials.
export async function middleware(request) {
  const secret = process.env.SITE_GATE_SECRET || "";
  if (!secret) {
    // Fails open only if the gate was never configured — avoids locking
    // the whole site out due to a missing env var.
    return NextResponse.next();
  }

  const token = request.cookies.get(GATE_COOKIE_NAME)?.value;
  const isValid = await verifyGateToken(token, secret);
  if (isValid) {
    return NextResponse.next();
  }

  const gateUrl = new URL("/gate", request.url);
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (target && target !== "/") {
    gateUrl.searchParams.set("redirect", target);
  }
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|battle|gate|api/site-gate|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)",
  ],
};
