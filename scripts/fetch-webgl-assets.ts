#!/usr/bin/env tsx

import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const GRAPH_VIEWER_DIR = path.resolve('web/graph-viewer');
const GRAPH_VIEWER_DIST = path.join(GRAPH_VIEWER_DIR, 'dist');
const TARGET_DIR = path.resolve('public/ui/graph');

async function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function ensureDistBuilt() {
  if (existsSync(path.join(GRAPH_VIEWER_DIST, 'index.html'))) {
    return;
  }
  console.log('🛠️ Building graph viewer assets...');
  await run('pnpm', ['--dir', GRAPH_VIEWER_DIR, 'build']);
}

async function copyDirectory(source: string, destination: string) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('📦 Fetching WebGL assets for graph viewer...');
  await ensureDistBuilt();

  try {
    const stats = await stat(GRAPH_VIEWER_DIST);
    if (!stats.isDirectory()) {
      throw new Error('Graph viewer dist directory is not available. Did the build succeed?');
    }
  } catch (err) {
    throw new Error(`Graph viewer assets not found at ${GRAPH_VIEWER_DIST}: ${(err as Error).message}`);
  }

  if (existsSync(TARGET_DIR)) {
    console.log(`🧹 Clearing existing assets in ${TARGET_DIR}`);
    await rm(TARGET_DIR, { recursive: true, force: true });
  }

  await copyDirectory(GRAPH_VIEWER_DIST, TARGET_DIR);
  console.log(`✅ Copied graph viewer assets to ${TARGET_DIR}`);
}

main().catch((err) => {
  console.error('❌ Failed to fetch WebGL assets:', err);
  process.exitCode = 1;
});
