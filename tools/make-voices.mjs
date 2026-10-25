// Generates the story voice lines with ElevenLabs into ../audio/<file>.mp3.
// Only missing files are generated, so re-running costs nothing.
// Usage: node tools/make-voices.mjs [--only intro,q1a] [--dry]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const STORY = require(path.join(here, '..', 'story.js'));
const OUT = path.join(here, '..', 'audio');
const KEY = fs.readFileSync(path.join(process.env.USERPROFILE, '.eleven_key.txt'), 'utf8').trim();
const HARD_STOP = 0.9; // same threshold as the HQ quota guard

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const dry = args.includes('--dry');
const spoken = t => t.replace(/\{hero\}/g, 'hero');

fs.mkdirSync(OUT, { recursive: true });
const todo = STORY.LINES.filter(l => (!only || only.includes(l.file)) && !fs.existsSync(path.join(OUT, l.file + '.mp3')));
const chars = todo.reduce((n, l) => n + spoken(l.text).length, 0);
console.log(`${todo.length} lines to generate, ${chars} characters`);
if (!todo.length || dry) process.exit(0);

// HQ quota guard (RULE-042), run as its own process: exits 1 at the hard stop
let q;
try { q = JSON.parse(execFileSync('node', [path.join(here, '..', '..', 'aigen', 'tts-quota-guard.mjs'), '--json'], { encoding: 'utf8' })); }
catch (e) { console.log('STOP: quota guard refused or failed', (e.stdout || e.message || '').slice(0, 300)); process.exit(1); }
const after = (q.character_count + chars) / q.character_limit;
console.log(`quota: ${q.character_count}/${q.character_limit} used; after this run ${(after * 100).toFixed(1)}%`);
if (after >= HARD_STOP) { console.log('STOP: this run would pass the 90% hard stop'); process.exit(1); }

for (const l of todo) {
  const voice = STORY.PEOPLE[l.who].voice;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: spoken(l.text),
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!r.ok) { console.log(`FAILED ${l.file}: ${r.status} ${(await r.text()).slice(0, 200)}`); process.exit(1); }
  fs.writeFileSync(path.join(OUT, l.file + '.mp3'), Buffer.from(await r.arrayBuffer()));
  console.log(`ok ${l.file} (${STORY.PEOPLE[l.who].name})`);
}
