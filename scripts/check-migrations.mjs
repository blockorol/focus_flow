import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './process.mjs';

const directories = [
  join(root, 'backend', 'migrations'),
  join(root, 'backend', 'testdata', 'migrations'),
];

const seen = new Set();
let failed = false;

for (const directory of directories) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (!statSync(path).isFile() || !name.endsWith('.sql')) continue;
    const match = /^(\d{6,})_[a-z0-9_]+\.sql$/.exec(name);
    if (!match) {
      console.error(`${path}: migration names must be <version>_<name>.sql`);
      failed = true;
      continue;
    }
    const key = `${directory}:${match[1]}`;
    if (seen.has(key)) {
      console.error(`${path}: duplicate migration version`);
      failed = true;
    }
    seen.add(key);
    const body = readFileSync(path, 'utf8');
    if (!body.includes('-- +goose Up')) {
      console.error(`${path}: missing -- +goose Up`);
      failed = true;
    }
    if (!body.includes('-- +goose Down')) {
      console.error(`${path}: missing -- +goose Down`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
