const attempts = new Map();
const cookieName = 'portfolio_host_access';
const refreshName = 'portfolio_host_refresh';
const supabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = () => process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const cookie = (name, value, age) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const parseCookies = header => Object.fromEntries((header || '').split(';').map(part => part.trim().split(/=(.*)/s)).filter(([key]) => key).map(([key, value]) => [key, decodeURIComponent(value || '')]));

export const json = (response, status, body) => { response.status(status); response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.setHeader('Cache-Control', 'no-store'); response.json(body); };
export const clearSession = response => response.setHeader('Set-Cookie', [cookie(cookieName, '', 0), cookie(refreshName, '', 0)]);
export const setSession = (response, session) => response.setHeader('Set-Cookie', [cookie(cookieName, session.access_token, Math.max(60, session.expires_in || 3600)), cookie(refreshName, session.refresh_token, 60 * 60 * 24 * 14)]);

const authFetch = (path, options = {}) => fetch(`${supabaseUrl()}/auth/v1/${path}`, { ...options, headers: { apikey: supabaseKey(), 'Content-Type': 'application/json', ...(options.headers || {}) } });
const verifyToken = async token => {
  if (!token) return null;
  const response = await authFetch('user', { headers: { Authorization: `Bearer ${token}` } });
  return response.ok ? { token, user: await response.json() } : null;
};
const refreshSession = async token => {
  if (!token) return null;
  const response = await authFetch('token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: token }) });
  return response.ok ? response.json() : null;
};

export async function requireSession(request, response) {
  const cookies = parseCookies(request.headers.cookie);
  const verified = await verifyToken(cookies[cookieName]);
  if (verified) return verified;
  const refreshed = await refreshSession(cookies[refreshName]);
  if (!refreshed) { clearSession(response); return null; }
  setSession(response, refreshed);
  return { token: refreshed.access_token, user: refreshed.user };
}

export async function revokeSession(request, response) {
  const session = await requireSession(request, response);
  if (session) await authFetch('logout', { method: 'POST', headers: { Authorization: `Bearer ${session.token}` } }).catch(() => {});
  clearSession(response);
}

export async function passwordLogin(email, password, request, response) {
  const address = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const record = attempts.get(address) || { failures: [], blockedUntil: 0 };
  record.failures = record.failures.filter(time => now - time < 15 * 60 * 1000);
  if (record.blockedUntil > now) return { error: 'Too many failed attempts. Try again in a few minutes.', status: 429 };
  const auth = await authFetch('token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!auth.ok) {
    record.failures.push(now);
    if (record.failures.length >= 5) record.blockedUntil = now + 5 * 60 * 1000;
    attempts.set(address, record);
    return { error: record.blockedUntil > now ? 'Too many failed attempts. Try again in five minutes.' : 'Invalid email or password.', status: 401 };
  }
  attempts.delete(address);
  const session = await auth.json();
  setSession(response, session);
  return { session };
}

export const environmentReady = () => Boolean(supabaseUrl() && supabaseKey());
export const restConfig = token => ({ url: `${supabaseUrl()}/rest/v1`, headers: { apikey: supabaseKey(), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });

export function sameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
