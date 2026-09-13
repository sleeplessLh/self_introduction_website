import { supabase } from '../lib/supabase.js';
const cacheKey = 'portfolio-cms-content-v2';
const cache = value => { try { localStorage.setItem(cacheKey, JSON.stringify(value)); } catch { /* Large image drafts may exceed browser cache; Supabase remains authoritative. */ } };
const readCache = () => { try { return JSON.parse(localStorage.getItem(cacheKey)); } catch { return null; } };

export async function loadContent() {
  const { data, error } = await supabase.from('portfolio_content').select('id,content').limit(1).maybeSingle();
  if (!error && data?.content) { cache(data); return data; }
  return readCache();
}

export async function saveContent(content) {
  const response = await fetch('/api/content', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || (response.status === 401 ? 'Host authentication required.' : 'Could not save changes.'));
  const saved = { id: data.id, content };
  cache(saved);
  return saved;
}
