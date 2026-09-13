import { environmentReady, json, sameOrigin, sendPasswordRecovery } from '../_auth.js';

const requests = new Map();
const genericMessage = 'If that email exists, a password reset link has been sent.';

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed.' });
  if (!sameOrigin(request)) return json(response, 403, { error: 'Request origin rejected.' });
  if (!environmentReady()) return json(response, 503, { error: 'Host verification is not configured.' });

  const address = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (requests.get(address) || []).filter(time => now - time < 15 * 60 * 1000);
  if (recent.length >= 3) return json(response, 200, { message: genericMessage });
  requests.set(address, [...recent, now]);

  const email = String(request.body?.email || '').trim().toLowerCase();
  if (email && email.length <= 254) {
    const origin = new URL(request.headers.origin);
    await sendPasswordRecovery(email, `${origin.origin}/reset-password`).catch(() => false);
  }
  return json(response, 200, { message: genericMessage });
}
