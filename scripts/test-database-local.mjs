import { join } from 'node:path';
import { root, run } from './process.mjs';

const compose = ['compose', '-p', 'focusflow-test', '-f', 'docker-compose.test.yml'];
const databaseURL = 'postgres://focusflow_test:focusflow-test@127.0.0.1:55432/focusflow_test?sslmode=disable';

run('docker', [...compose, 'up', '--build', '-d', '--wait', 'postgres']);

try {
  run('docker', [...compose, 'run', '--rm', '--no-deps', 'backend', '/app/bin/migrate', 'up']);
  run('docker', [...compose, 'run', '--rm', '--no-deps', 'backend', '/app/bin/migrate', 'down']);
  run('docker', [...compose, 'run', '--rm', '--no-deps', 'backend', '/app/bin/migrate', 'up']);
  run('go', ['test', './internal/storage/postgres', '-run', 'Integration', '-count=1'], {
    cwd: join(root, 'backend'),
    env: { ...process.env, DATABASE_URL: databaseURL },
  });
} finally {
  run('docker', [...compose, 'down', '--volumes']);
}
