import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { usePortfolio } from '../context/PortfolioContext.jsx';

const initial = { name: 'YOUR NAME', role: 'Software Engineer / Student', intro: 'I build considered software.', email: 'your.email@example.com', accent: '#c9ee6b' };

export default function HostAccess() {
  const { refreshProfile } = usePortfolio();
  const [open, setOpen] = useState(false), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [note, setNote] = useState(''), [host, setHost] = useState(false), [form, setForm] = useState(initial);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  async function login(event) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setNote('Login failed. Check your email and password.');
    const { data } = await supabase.from('portfolio_content').select('content').limit(1).maybeSingle();
    setForm({ ...initial, ...(data?.content || {}) }); setHost(true); setNote('');
  }
  async function save() {
    const { data: row } = await supabase.from('portfolio_content').select('id').limit(1).maybeSingle();
    const request = row ? supabase.from('portfolio_content').update({ content: form, updated_at: new Date().toISOString() }).eq('id', row.id) : supabase.from('portfolio_content').insert({ content: form });
    const { error } = await request;
    if (error) return setNote(error.message);
    await refreshProfile(); setNote('Saved. Your public page is updated now.');
  }
  return <><button className="host-access" onClick={() => setOpen(true)}>HOST ACCESS</button>{open && <div className="host-dialog"><div>{!host ? <form onSubmit={login}><button type="button" onClick={() => setOpen(false)}>×</button><p>PRIVATE HOST ACCESS</p><h2>Manage your portfolio.</h2><input type="email" placeholder="Email" required value={email} onChange={event => setEmail(event.target.value)} /><input type="password" placeholder="Password" required value={password} onChange={event => setPassword(event.target.value)} /><button>Unlock editor ↗</button><small>{note}</small></form> : <section><button onClick={() => setOpen(false)}>×</button><p>HOST MODE</p><h2>Profile & design</h2><label>Name<input value={form.name} onChange={event => set('name', event.target.value)} /></label><label>Role<input value={form.role} onChange={event => set('role', event.target.value)} /></label><label>Introduction<textarea value={form.intro} onChange={event => set('intro', event.target.value)} /></label><label>Email<input value={form.email} onChange={event => set('email', event.target.value)} /></label><label>Primary colour<input type="color" value={form.accent} onChange={event => set('accent', event.target.value)} /></label><button onClick={save}>Save changes</button><small>{note}</small></section>}</div></div>}</>;
}
