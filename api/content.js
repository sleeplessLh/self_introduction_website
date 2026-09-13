import { json, requireSession, restConfig, sameOrigin } from './_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'PUT') return json(response, 405, { error: 'Method not allowed.' });
  if (!sameOrigin(request)) return json(response, 403, { error: 'Request origin rejected.' });
  const session = await requireSession(request, response);
  if (!session) return json(response, 401, { error: 'Host authentication required.' });
  const content = request.body?.content;
  if (!content || typeof content !== 'object') return json(response, 400, { error: 'Valid portfolio content is required.' });
  const config = restConfig(session.token);
  const currentResponse = await fetch(`${config.url}/portfolio_content?select=id&limit=1`, { headers: config.headers });
  if (!currentResponse.ok) return json(response, currentResponse.status, { error: 'Unable to read the protected content record.' });
  const current = (await currentResponse.json())[0];
  const body = JSON.stringify({ content, updated_at: new Date().toISOString() });
  const savedResponse = current
    ? await fetch(`${config.url}/portfolio_content?id=eq.${encodeURIComponent(current.id)}&select=id`, { method: 'PATCH', headers: { ...config.headers, Prefer: 'return=representation' }, body })
    : await fetch(`${config.url}/portfolio_content?select=id`, { method: 'POST', headers: { ...config.headers, Prefer: 'return=representation' }, body });
  if (!savedResponse.ok) return json(response, savedResponse.status, { error: 'The protected content save was rejected.' });
  const saved = (await savedResponse.json())[0];
  return json(response, 200, { id: saved?.id || current?.id });
}
