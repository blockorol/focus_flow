import { resolve } from 'node:path';
import { go } from './go.mjs';
import { run } from './process.mjs';

go(['tool', 'oapi-codegen', '-config', 'oapi-codegen.yaml', '../contracts/openapi.yaml']);
run(process.execPath, [
  resolve('node_modules/openapi-typescript/bin/cli.js'),
  'contracts/openapi.yaml',
  '-o',
  'frontend/src/api/generated/schema.d.ts',
]);
run('git', ['diff', '--exit-code', '--', 'backend/internal/api/generated', 'frontend/src/api/generated']);

const untracked = run('git', ['ls-files', '--others', '--exclude-standard', '--', 'backend/internal/api/generated', 'frontend/src/api/generated'], {
  stdio: 'pipe',
});

if (untracked.stdout.toString().trim() !== '') {
  process.stderr.write(untracked.stdout);
  throw new Error('Generated output contains untracked files.');
}
