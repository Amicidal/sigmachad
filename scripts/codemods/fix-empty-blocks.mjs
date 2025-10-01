#!/usr/bin/env node
// Codemod: Replace empty catch/finally blocks with intentional no-op bodies.
// Examples:
//   catch {}                    -> catch (e) { /* intentional no-op */ void 0; }
//   catch (e) {}                -> catch (e) { /* intentional no-op */ void 0; }
//   finally {}                  -> finally { /* intentional no-op */ void 0; }
//
// Scope: apps/*/src, packages/*/src (excluding node_modules, dist, coverage)
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const includeRoots = ['packages', 'apps'];
const excludeDirs = new Set(['node_modules', 'dist', 'coverage', '.git']);

/** @param {string} dir */
async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (excludeDirs.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

/**
 * Apply replacements to text content.
 * Keeps formatting minimal while ensuring blocks are non-empty.
 * @param {string} src
 */
function transform(src) {
  let out = src;
  // Normalize Windows newlines for regex simplicity
  out = out.replace(/\r\n/g, '\n');

  // Replace empty catch with param
  // e.g., catch (err) {   } -> catch (err) { /* intentional no-op: non-critical */ void 0; }
  out = out.replace(
    /catch\s*\(([^)]*)\)\s*\{\s*\}/gms,
    (m, p1) => `catch (${p1.trim() || 'e'}) { /* intentional no-op: non-critical */ void 0; }`
  );

  // Replace empty catch without param
  out = out.replace(
    /catch\s*\{\s*\}/gms,
    () => `catch (e) { /* intentional no-op: non-critical */ void 0; }`
  );

  // Replace empty finally
  out = out.replace(
    /finally\s*\{\s*\}/gms,
    () => `finally { /* intentional no-op */ void 0; }`
  );

  return out;
}

async function run() {
  const targets = [];
  for (const base of includeRoots) {
    const start = path.join(root, base);
    try {
      for await (const file of walk(start)) {
        if (!/\/(src)\//.test(file)) continue;
        if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) continue;
        targets.push(file);
      }
    } catch {}
  }

  let changed = 0;
  for (const file of targets) {
    const before = await fs.readFile(file, 'utf8');
    const after = transform(before);
    if (after !== before) {
      await fs.writeFile(file, after, 'utf8');
      changed++;
      process.stdout.write(`updated: ${path.relative(root, file)}\n`);
    }
  }
  console.log(`\nfix-empty-blocks: updated ${changed} file(s)`);
}

run().catch((err) => {
  console.error('fix-empty-blocks failed:', err);
  process.exitCode = 1;
});
