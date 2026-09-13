import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [note, setNote] = useState('Checking your secure reset link…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    window.history.replaceState({}, '', '/reset-password');
    if (!accessToken || !refreshToken || params.get('type') !== 'recovery') {
      setNote('This password reset link is invalid or has expired.');
      return;
    }
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) return setNote('This password reset link is invalid or has expired.');
      setReady(true);
      setNote('Choose a new password with at least 10 characters.');
    });
  }, []);

  const submit = async event => {
    event.preventDefault();
    if (password.length < 10) return setNote('Password must contain at least 10 characters.');
    if (password !== confirm) return setNote('The passwords do not match.');
    setNote('Updating password…');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setNote(error.message || 'Password could not be updated.');
    await supabase.auth.signOut();
    setReady(false);
    setPassword('');
    setConfirm('');
    setNote('Password updated. You can now return and sign in with your new password.');
  };

  return <main className="reset-password-page"><form onSubmit={submit}><p>PRIVATE HOST ACCESS</p><h1>Set a new password.</h1><p className="reset-note" role="status">{note}</p>{ready && <><label>New password<input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required /></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} required /></label><button>Update password ↗</button></>}<a href="/">Return to portfolio</a></form></main>;
}
