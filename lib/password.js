// Password hashing with scrypt from node:crypto.
//
// No native dependency to build (unlike bcrypt/argon2), and scrypt is memory-hard
// so it resists GPU cracking. Format: scrypt$N$r$p$<salt-b64>$<hash-b64>
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt);

const N = 16384; // CPU/memory cost
const r = 8;     // block size
const p = 1;     // parallelisation
const KEYLEN = 64;

export async function hashPassword(plain) {
  const salt = randomBytes(16);
  const key = await scrypt(plain, salt, KEYLEN, { N, r, p, maxmem: 128 * N * r * 2 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(plain, stored) {
  const parts = String(stored ?? '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, blockSize, par, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const opts = { N: +n, r: +blockSize, p: +par, maxmem: 128 * +n * +blockSize * 2 };

  const actual = await scrypt(plain, salt, expected.length, opts);
  // Constant-time — never short-circuit on the first differing byte.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
