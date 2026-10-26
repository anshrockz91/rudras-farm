// Sets the admin code: node tools/set-admin-code.mjs MYCODE
// Writes admin-key.js with a salted PBKDF2 hash (the code itself is never stored). Deploy afterwards.
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const code = String(process.argv[2] || '').trim().toUpperCase();
if (code.length < 4) { console.error('Use a code of at least 4 letters/numbers.'); process.exit(1); }
const ITER = 310000;
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(code, Buffer.from(salt, 'hex'), ITER, 32, 'sha256').toString('hex');
writeFileSync(new URL('../admin-key.js', import.meta.url),
  `// Admin code check for admin.html (set with tools/set-admin-code.mjs). Only a salted hash is kept here.\nwindow.ADMIN_KEY = { salt: '${salt}', iter: ${ITER}, hash: '${hash}' };\n`);
console.log('admin code set; now deploy');
