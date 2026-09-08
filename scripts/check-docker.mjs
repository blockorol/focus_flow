import { run } from './process.mjs';

run('docker', ['build', '-f', 'backend/Dockerfile', '-t', 'focusflow-backend:local', 'backend']);
run('docker', ['compose', '-f', 'docker-compose.local.yml', 'config', '--quiet']);
run('docker', ['compose', '-f', 'docker-compose.test.yml', 'config', '--quiet']);
