// Site-wide access gate: a single shared username/password that stands in
// front of the whole app, independent of the normal per-user Supabase
// login/register system. Uses the Web Crypto API (not Node's `crypto`
// module) so the same code runs unmodified in both the Edge middleware and
// the Node.js API route.
export const GATE_COOKIE_NAME = "site_gate";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string comparison — avoids leaking how many leading
// characters matched via response-time differences.
export function timingSafeStringEqual(a, b) {
  const strA = String(a ?? "");
  const strB = String(b ?? "");
  if (strA.length !== strB.length) return false;
  let mismatch = 0;
  for (let i = 0; i < strA.length; i += 1) {
    mismatch |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return mismatch === 0;
}

// Stateless signed token: `<expiryTimestamp>.<hmac>` — nothing to store
// server-side, and it can't be forged without SITE_GATE_SECRET.
export async function createGateToken(secret) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const signature = await hmacHex(secret, `gate:${expires}`);
  return { token: `${expires}.${signature}`, maxAge: MAX_AGE_SECONDS };
}

export async function verifyGateToken(token, secret) {
  if (!token) return false;
  const [expiresRaw, signature] = token.split(".");
  if (!expiresRaw || !signature) return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expected = await hmacHex(secret, `gate:${expiresRaw}`);
  return timingSafeStringEqual(expected, signature);
}
