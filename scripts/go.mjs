import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { root, run } from './process.mjs';

export function go(args, options = {}) {
  return run('go', args, { cwd: resolve(root, 'backend'), ...options });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { go(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
