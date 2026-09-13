import { environmentReady, json, requireSession } from '../_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Method not allowed.' });
  if (!environmentReady()) return json(response, 503, { authenticated: false });
  const session = await requireSession(request, response);
  if (!session) return json(response, 401, { authenticated: false });
  return json(response, 200, { authenticated: true, user: { id: session.user?.id, email: session.user?.email } });
}
