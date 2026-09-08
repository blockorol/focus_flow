import { run } from './process.mjs';

const compose = ['compose', '-p', 'focusflow-test', '-f', 'docker-compose.test.yml'];
run('docker', [...compose, 'up', '--build', '-d', '--wait', 'postgres']);

try {
  run('docker', [...compose, 'run', '--rm', '--no-deps', 'backend', '/app/bin/migrate', 'up']);
  run('docker', [...compose, 'run', '--rm', '--no-deps', 'backend', '/app/bin/migrate', 'down']);
  run('docker', [...compose, 'run', '--rm', '--no-deps', 'backend', '/app/bin/migrate', 'up']);
} finally {
  run('docker', [...compose, 'down', '--volumes']);
}
