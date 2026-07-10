// One-time bootstrap: set a password for an existing account so it can log
// into /admin with the new username+password flow (accounts created via the
// old passwordless magic-link flow have no password set yet).
//
// Usage:
//   node --env-file=.env.local scripts/set-admin-password.mjs you@example.com "your-new-password"

import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/set-admin-password.mjs <email> "<password>"',
  );
  process.exit(1);
}

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set them in .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let targetUser = null;
let page = 1;

while (!targetUser) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 200,
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  targetUser = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (targetUser || data.users.length < 200) break;
  page += 1;
}

if (!targetUser) {
  console.error(`No account found with email ${email}`);
  process.exit(1);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(
  targetUser.id,
  { password },
);

if (updateError) {
  console.error(updateError.message);
  process.exit(1);
}

console.log(`Password set for ${email}. You can now log in at /admin.`);
