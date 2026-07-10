export const normalizeEmail = (email) => email.trim().toLowerCase();

export const generatePassword = () => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

// Best-effort username suggestion from the local part of an email —
// strips anything that isn't a letter/digit/underscore, keeps Arabic too.
export const suggestUsernameFromEmail = (email) => {
  const local = email.split('@')[0] || '';
  return local.replace(/[^a-zA-Z0-9_؀-ۿ]/g, '').slice(0, 40);
};

export const getSafeRedirect = (fallback = '/') => {
  if (typeof window === 'undefined') return fallback;

  const redirect = new URLSearchParams(window.location.search).get('redirect');
  return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : fallback;
};

export const redirectWithVerifiedSession = async (client, session, redirectPath) => {
  if (!session?.access_token || !session?.refresh_token) {
    throw new Error('لم يتم إنشاء جلسة تسجيل دخول صالحة.');
  }

  const { error: sessionError } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (sessionError) throw sessionError;

  let verifiedSession = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data } = await client.auth.getSession();
    verifiedSession = data.session;
    if (verifiedSession?.user) break;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }

  if (!verifiedSession?.user) {
    throw new Error('تعذر حفظ جلسة الدخول على هذا المتصفح. تأكد أن الكوكيز والتخزين المحلي غير محظورين.');
  }

  window.sessionStorage.setItem('sovereignty_login_verified', String(Date.now()));
  window.location.replace(redirectPath);
};

export const getUserDisplayName = (user) => {
  if (!user) return 'مستخدم';

  // Priority 1: Display name (username set during registration)
  const displayName = user?.user_metadata?.display_name?.trim() ||
    user?.user_metadata?.name?.trim();
  if (displayName) return displayName;

  // Priority 2: Phone (show last 4 digits)
  if (user.phone) {
    const phone = user.phone;
    if (phone.length > 4) {
      return `••• ${phone.slice(-4)}`;
    }
    return phone;
  }

  // Priority 3: Email (truncated)
  if (user.email) {
    const email = user.email;
    const atIndex = email.indexOf('@');
    if (atIndex > 8) {
      return `${email.slice(0, 8)}...`;
    }
    if (atIndex > 0) {
      return email.slice(0, atIndex);
    }
    return email.slice(0, 10);
  }

  return 'مستخدم';
};
