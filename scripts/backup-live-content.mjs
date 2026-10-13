import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const target = process.argv[2];
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!target || !url || !key) throw new Error('Pass a backup directory and configured Supabase URL/publishable key.');

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.from('portfolio_content').select('*');
if (error) throw new Error(`Read-only content export failed: ${error.message}`);
if (!data?.length) throw new Error('No rows were visible; refusing to create an empty content backup.');

const destination = resolve(target);
const body = JSON.stringify({ exportedAt: new Date().toISOString(), rows: data }, null, 2);
const checksum = createHash('sha256').update(body).digest('hex');
await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, 'supabase-portfolio-content.json'), body, { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ rows: data.length, bytes: Buffer.byteLength(body), sha256: checksum, destination }, null, 2));
