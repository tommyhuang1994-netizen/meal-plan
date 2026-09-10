// Put the Supabase database password into .env.local without it ever being
// typed into a chat, a command line, or shell history.
//
//   node scripts/set-db-password.mjs
//
// Input is hidden while typing. The password is percent-encoded before it goes
// into the URL, so characters like @ : / # ? — which would otherwise split the
// connection string in the wrong place — are safe to use.

import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createInterface } from 'node:readline';

const FILE = new URL('../.env.local', import.meta.url);

if (!existsSync(FILE)) {
  console.error('.env.local not found — run this from the project root.');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Swallow the echoed characters so the password never appears on screen.
    const onData = (char) => {
      if (['\n', '\r', ''].includes(char.toString())) return;
      process.stdout.write('[2K[200D' + question + '*'.repeat(rl.line.length));
    };
    process.stdin.on('data', onData);
    rl.question(question, (answer) => {
      process.stdin.removeListener('data', onData);
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

// Two ways in. The prompt needs a real terminal, which some runners do not
// provide — there, pass --from-file and put the password in a scratch file
// instead, so it still never appears on a command line.
const fileArg = process.argv.indexOf('--from-file');
let pw;

if (fileArg !== -1) {
  const path = process.argv[fileArg + 1] ?? '.db-password.txt';
  if (!existsSync(path)) {
    console.error(`${path} not found.`);
    process.exit(1);
  }
  pw = readFileSync(path, 'utf8').trim();
} else if (!process.stdin.isTTY) {
  console.error('No terminal available for a hidden prompt.');
  console.error('Run:  node scripts/set-db-password.mjs --from-file .db-password.txt');
  process.exit(1);
} else {
  pw = (await askHidden('Supabase database password: ')).trim();
}

if (!pw) {
  console.error('Password was empty — no change made.');
  process.exit(1);
}

const src = readFileSync(FILE, 'utf8');
if (!src.includes('[YOUR-PASSWORD]')) {
  console.error('No [YOUR-PASSWORD] placeholder left in .env.local — already filled in?');
  process.exit(1);
}

const out = src.replaceAll('[YOUR-PASSWORD]', encodeURIComponent(pw));
writeFileSync(FILE, out);

const count = src.split('[YOUR-PASSWORD]').length - 1;
console.log(`Saved. Filled ${count} placeholder${count === 1 ? '' : 's'} in .env.local.`);

// Delete the scratch file so the password is not left lying around in plain
// text next to the project.
if (fileArg !== -1) {
  const path = process.argv[fileArg + 1] ?? '.db-password.txt';
  rmSync(path);
  console.log(`Deleted ${path}.`);
}
console.log('The password was not printed and is not in your shell history.');
