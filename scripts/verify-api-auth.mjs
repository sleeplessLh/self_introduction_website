import contentHandler from '../api/content.js';
import loginHandler from '../api/host/login.js';

process.env.SUPABASE_URL = 'https://fixture.supabase.test';
process.env.SUPABASE_PUBLISHABLE_KEY = 'fixture-publishable-key';

const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), method: options.method || 'GET', body: options.body });
  const json = value => ({ ok: true, status: 200, json: async () => value });
  if (String(url).endsWith('/auth/v1/user')) return json({ id: 'fixture-host', email: 'qa@example.test' });
  if (String(url).includes('/auth/v1/token?grant_type=password')) return json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, user: { id: 'fixture-host', email: 'qa@example.test' } });
  if (String(url).includes('/rest/v1/portfolio_content?select=id&limit=1')) return json([{ id: 'fixture-row' }]);
  if (String(url).includes('/rest/v1/portfolio_content?id=eq.fixture-row')) return json([{ id: 'fixture-row' }]);
  throw new Error(`Unexpected fixture request: ${url}`);
};

const response = () => {
  const result = { headers: {}, code: null, body: null };
  result.status = code => { result.code = code; return result; };
  result.setHeader = (name, value) => { result.headers[name.toLowerCase()] = value; };
  result.json = body => { result.body = body; return result; };
  return result;
};
const request = (method, origin, cookie = '') => ({ method, headers: { origin, host: 'portfolio.example.test', cookie }, body: { content: { profile: { name: 'Fixture only' } } }, socket: { remoteAddress: '127.0.0.1' } });
try {
  const rejectedOrigin = response();
  await contentHandler(request('PUT', 'https://elsewhere.example.test'), rejectedOrigin);
  if (rejectedOrigin.code !== 403 || calls.length) throw new Error('Cross-origin content write was not rejected before upstream access');
  const guest = response();
  await contentHandler(request('PUT', 'https://portfolio.example.test'), guest);
  if (guest.code !== 401 || calls.length) throw new Error('Guest content write was not rejected');
  const login = response();
  await loginHandler({ ...request('POST', 'https://portfolio.example.test'), body: { email: 'qa@example.test', password: 'fixture-password' } }, login);
  const cookie = login.headers['set-cookie'];
  if (login.code !== 200 || !Array.isArray(cookie) || cookie.length !== 2 || cookie.some(value => !/HttpOnly; Secure; SameSite=Strict/.test(value))) throw new Error('Host login did not issue secure access and refresh cookies');
  const saved = response();
  await contentHandler(request('PUT', 'https://portfolio.example.test', 'portfolio_host_access=fixture-access'), saved);
  const patch = calls.find(call => call.method === 'PATCH');
  if (saved.code !== 200 || !patch || JSON.parse(patch.body).content.profile.name !== 'Fixture only') throw new Error('Authenticated content write did not target the correct fixture row');
  console.log(JSON.stringify({ rejectedOrigin: rejectedOrigin.code, rejectedGuest: guest.code, login: login.code, secureCookies: cookie.length, authenticatedSave: saved.code, upstreamCalls: calls.length, productionCalls: 0 }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
}
