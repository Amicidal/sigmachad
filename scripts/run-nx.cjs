#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const nxBin = require.resolve('nx/bin/nx.js');
const args = process.argv.slice(2);
const env = { ...process.env };

if (!env.NX_ISOLATE_PLUGINS) {
  env.NX_ISOLATE_PLUGINS = 'false';
}

const result = spawnSync(process.execPath, [nxBin, ...args], {
  stdio: 'inherit',
  env,
});

if (result.error) {
  throw result.error;
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
} else {
  process.exit(1);
}
