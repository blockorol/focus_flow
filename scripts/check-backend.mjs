import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { go } from './go.mjs';
import { run } from './process.mjs';

const backendDir = fileURLToPath(new URL('../backend/', import.meta.url));

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
go(['build', './cmd/api']);
go(['build', './cmd/hash-password']);
