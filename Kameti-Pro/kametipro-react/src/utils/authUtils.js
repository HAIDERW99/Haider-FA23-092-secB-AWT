/**
 * Auth utilities — token stored under key 'kp_token', user under 'kp_user'.
 * No Redux, no Context — plain localStorage helpers.
 */

const TOKEN_KEY = 'kp_token';
const USER_KEY  = 'kp_user';

/** Returns true if a JWT exists in localStorage */
export const isLoggedIn = () => !!localStorage.getItem(TOKEN_KEY);

/** Returns the raw JWT string or null */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Returns the stored user object or null */
export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Persist token + user after successful login / signup */
export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/** Clear all auth data and redirect to login */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};
