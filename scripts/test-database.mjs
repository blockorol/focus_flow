import { run } from './process.mjs';

run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'check:migrations']);
await import('./test-database-local.mjs');
