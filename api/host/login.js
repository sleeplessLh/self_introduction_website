import { environmentReady, json, passwordLogin, sameOrigin } from '../_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed.' });
  if (!sameOrigin(request)) return json(response, 403, { error: 'Request origin rejected.' });
  if (!environmentReady()) return json(response, 503, { error: 'Host authentication is not configured.' });
  const { email = '', password = '' } = request.body || {};
  if (!email || !password) return json(response, 400, { error: 'Email and password are required.' });
  const result = await passwordLogin(String(email).trim(), String(password), request, response);
  if (result.error) return json(response, result.status, { error: result.error });
  return json(response, 200, { authenticated: true, user: { id: result.session.user?.id, email: result.session.user?.email } });
}
