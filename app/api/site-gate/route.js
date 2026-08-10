import { NextResponse } from "next/server";
import {
  GATE_COOKIE_NAME,
  createGateToken,
  timingSafeStringEqual,
} from "../../../lib/site-gate";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");

  const expectedUsername = process.env.SITE_GATE_USERNAME || "";
  const expectedPassword = process.env.SITE_GATE_PASSWORD || "";
  const secret = process.env.SITE_GATE_SECRET || "";

  if (!expectedUsername || !expectedPassword || !secret) {
    return NextResponse.json(
      { error: "الحماية غير مُفعّلة بشكل صحيح على السيرفر." },
      { status: 500 },
    );
  }

  // Compare both fields unconditionally (not short-circuited) so a wrong
  // username can't be distinguished from a wrong password by timing.
  const validUsername = timingSafeStringEqual(username, expectedUsername);
  const validPassword = timingSafeStringEqual(password, expectedPassword);

  if (!validUsername || !validPassword) {
    return NextResponse.json(
      { error: "بيانات الدخول غير صحيحة." },
      { status: 401 },
    );
  }

  const { token, maxAge } = await createGateToken(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
