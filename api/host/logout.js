import { json, revokeSession, sameOrigin } from '../_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed.' });
  if (!sameOrigin(request)) return json(response, 403, { error: 'Request origin rejected.' });
  await revokeSession(request, response);
  return json(response, 200, { authenticated: false });
}
