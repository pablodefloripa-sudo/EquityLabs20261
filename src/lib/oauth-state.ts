const GOOGLE_OAUTH_PENDING_KEY = 'eq_google_oauth_pending';

export const markGoogleOAuthPending = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(GOOGLE_OAUTH_PENDING_KEY, '1');
};

export const hasPendingGoogleOAuth = () => {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(GOOGLE_OAUTH_PENDING_KEY) === '1';
};

export const clearPendingGoogleOAuth = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY);
};
