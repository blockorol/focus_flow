import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { go } from './go.mjs';
import { run } from './process.mjs';

const backendDir = fileURLToPath(new URL('../backend/', import.meta.url));
const buildDir = join(backendDir, '.tmp', 'check-backend');

function buildOutput(name) {
  return join(buildDir, process.platform === 'win32' ? `${name}.exe` : name);
}

function checkGofmt() {
  const result = spawnSync('gofmt', ['-l', '.'], {
    cwd: backendDir,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`gofmt failed (exit ${result.status ?? result.signal}).`);
  }

  if (result.stdout.trim() !== '') {
    process.stderr.write(result.stdout);
    throw new Error('Go files are not formatted. Run go fmt ./...');
  }
}

go(['mod', 'verify']);
checkGofmt();
go(['vet', './...']);
go(['tool', 'staticcheck', './...']);
go(['test', './...']);
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
go(['build', '-o', buildOutput('api'), './cmd/api']);
go(['build', '-o', buildOutput('hash-password'), './cmd/hash-password']);
