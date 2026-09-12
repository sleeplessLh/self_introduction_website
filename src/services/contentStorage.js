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
  const current = await loadContent();
  const request = current?.id
    ? supabase.from('portfolio_content').update({ content, updated_at: new Date().toISOString() }).eq('id', current.id).select('id').single()
    : supabase.from('portfolio_content').insert({ content }).select('id').single();
  const { data, error } = await request;
  if (error) throw error;
  const saved = { id: data?.id || current?.id, content };
  cache(saved);
  return saved;
}
