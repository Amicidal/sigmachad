#!/usr/bin/env node
import { promises as fs } from 'fs';
import { join } from 'path';

const ALLOWED_EXT = ['.js', '.mjs', '.cjs', '.json'];

function hasAllowedExt(spec) {
  return ALLOWED_EXT.some((e) => spec.endsWith(e));
}

function findBadSpecifiers(code, file) {
  const bad = [];
  const re = /(from\s+"(\.{1,2}\/[^"\n]+)")/g;
  let m;
  while ((m = re.exec(code))) {
    const spec = m[2];
    if (!hasAllowedExt(spec)) {
      bad.push({ file, spec });
    }
  }
  const re2 = /(export\s+\*\s+from\s+"(\.{1,2}\/[^"\n]+)")/g;
  while ((m = re2.exec(code))) {
    const spec = m[2];
    if (!hasAllowedExt(spec)) {
      bad.push({ file, spec });
    }
  }
  return bad;
}

async function listFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p)));
    else if (e.isFile() && p.endsWith('.js')) out.push(p);
  }
  return out;
}

async function main() {
  const dist = 'dist';
  try {
    await fs.access(dist);
  } catch {
    console.error('dist/ not found; run build first.');
    process.exit(1);
  }
  const files = await listFiles(dist);
  const allBad = [];
  for (const f of files) {
    const code = await fs.readFile(f, 'utf8');
    allBad.push(...findBadSpecifiers(code, f));
  }
  if (allBad.length) {
    console.error('Invalid relative imports without extensions found:');
    for (const { file, spec } of allBad) {
      console.error(` - ${file}: ${spec}`);
    }
    process.exit(2);
  }
  console.log('dist imports OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

