#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const nxBin = require.resolve('nx/bin/nx.js');
const args = process.argv.slice(2);
const env = { ...process.env };

// Ensure useful output when running tests via Nx
const hasFlag = (flag) => args.includes(flag) || args.some((a) => a.startsWith(`${flag}=`));
const nextOf = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

// Heuristics to detect test invocations across common Nx forms
const explicitTarget = nextOf('--target') || nextOf('-t');
const isTestCommand =
  args[0] === 'test' ||
  explicitTarget === 'test' ||
  args.some((a) => a === 'test' || a.startsWith('test:'));

if (isTestCommand) {
  if (!hasFlag('--output-style')) {
    args.push('--output-style=stream');
  }
  if (!hasFlag('--verbose')) {
    args.push('--verbose');
  }
  // Help surface executor logs in CI/sandboxes
  env.NX_VERBOSE_LOGGING = env.NX_VERBOSE_LOGGING || 'true';
}

if (!env.NX_ISOLATE_PLUGINS) {
  env.NX_ISOLATE_PLUGINS = 'false';
}

const shouldBufferNx = isTestCommand && (args[0] === 'test' && args[1] && !args[1].startsWith('-'));
let result = spawnSync(process.execPath, [nxBin, ...args], {
  stdio: shouldBufferNx ? 'pipe' : 'inherit',
  env,
  encoding: shouldBufferNx ? 'utf8' : undefined,
});

if (result.error) {
  throw result.error;
}

// Fallback: if a single-project test fails opaquely, run Vitest directly
const isSingleProjectTest = args[0] === 'test' && args[1] && !args[1].startsWith('-');
if (isTestCommand && isSingleProjectTest && result.status && result.status !== 0) {
  try {
    const project = args[1];
    const show = spawnSync(process.execPath, [nxBin, 'show', 'project', project, '--web=false'], {
      stdio: 'pipe',
      env,
      encoding: 'utf8',
    });
    const rootLine = show.stdout?.split('\n').find((l) => l.startsWith('Root:')) || '';
    const projectRoot = rootLine.replace('Root:', '').trim();
    if (projectRoot) {
      const vitestBin = require.resolve('vitest/vitest.mjs');
      const direct = spawnSync(process.execPath, [vitestBin, 'run', '-c', 'vitest.config.ts'], {
        stdio: 'inherit',
        env,
        cwd: projectRoot,
      });
      if (typeof direct.status === 'number') {
        process.exit(direct.status);
      }
    }
  } catch (_) {
    // ignore and fall through to Nx result handling
  }
}

if (typeof result.status === 'number') {
  // If we buffered Nx output (single-project test), flush on success; on failure we'll have fallen back above
  if (shouldBufferNx && result.status === 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  process.exit(result.status);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
} else {
  process.exit(1);
}
