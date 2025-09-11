#!/usr/bin/env node
import { promises as fs } from 'fs';
import { join } from 'path';

function patchSpecifiers(code) {
  const addJs = (match, p1) => {
    const spec = p1;
    if (/\.(js|mjs|cjs|json)$/.test(spec)) return match; // already has ext
    return match.replace(spec, spec + '.js');
  };
  // from "./..."
  code = code.replace(/from\s+"(\.{1,2}\/[^"\n]+?)"/g, addJs);
  // export * from "./..."
  code = code.replace(/export\s+\*\s+from\s+"(\.{1,2}\/[^"\n]+?)"/g, addJs);
  // guard require.main checks
  code = code.replace(
    /if \(require\.main === module\)/g,
    'if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module)'
  );
  return code;
}

async function listJsFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listJsFiles(p)));
    else if (e.isFile() && p.endsWith('.js')) out.push(p);
  }
  return out;
}

async function main() {
  const files = await listJsFiles('dist');
  let count = 0;
  for (const file of files) {
    const code = await fs.readFile(file, 'utf8');
    const patched = patchSpecifiers(code);
    if (patched !== code) {
      await fs.writeFile(file, patched);
      count++;
    }
  }
  console.log(`Patched ${count} files for ESM import/export compatibility.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
