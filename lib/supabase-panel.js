import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

// A separate browser client (with its own localStorage key) from the main
// site's `supabase` client in lib/supabase.js. The admin panel and the
// public game site must never share a session — logging into /admin should
// not sign a visitor into the game, and a regular player account should
// never be treated as an admin session just because it's the same browser.
export const supabasePanel = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'sovereignty-panel-auth',
  },
});
