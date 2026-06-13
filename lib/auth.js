export const normalizeEmail = (email) => email.trim().toLowerCase();

export const validateRegistration = ({ name, email, password, confirmPassword }) => {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2 || cleanName.length > 40) {
    return 'اسم المستخدم يجب أن يكون بين حرفين و40 حرفًا.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return 'يرجى إدخال بريد إلكتروني صحيح.';
  }

  if (password.length < 8) {
    return 'كلمة المرور يجب ألا تقل عن 8 أحرف.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل.';
  }

  if (password !== confirmPassword) {
    return 'كلمة المرور وتأكيدها غير متطابقين.';
  }

  return '';
};

export const getSafeRedirect = (fallback = '/') => {
  if (typeof window === 'undefined') return fallback;

  const redirect = new URLSearchParams(window.location.search).get('redirect');
  return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : fallback;
};

export const getUserDisplayName = (user) =>
  user?.user_metadata?.display_name?.trim() ||
  user?.user_metadata?.name?.trim() ||
  user?.email?.split('@')[0] ||
  'مستخدم';
