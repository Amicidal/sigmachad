import { execSync } from 'node:child_process';

type CouplingRule = {
  match: RegExp;
  domains: string[]; // e.g., ['knowledge-graph']
  note?: string;
};

// Map code paths to required blueprint domains
const RULES: CouplingRule[] = [
  { match: /^packages\/graph\//, domains: ['knowledge-graph'] },
  { match: /^packages\/knowledge\//, domains: ['knowledge-graph'] },
  { match: /^packages\/sync\//, domains: ['sync', 'operations'] },
  { match: /^packages\/api\//, domains: ['api'] },
  { match: /^packages\/testing\//, domains: ['testing', 'knowledge-graph'] },
  { match: /^packages\/agents\//, domains: ['orchestration'] },
  { match: /^packages\/database\//, domains: ['database'] },
  { match: /^packages\/backup\//, domains: ['rollback'] },
  { match: /^apps\/mcp-server\//, domains: ['mcp'] },
  { match: /^apps\/web\//, domains: ['api'] },
];

function getStagedFiles(): string[] {
  const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isCodeChange(file: string): boolean {
  if (file.startsWith('Docs/')) return false;
  if (file.startsWith('dist/') || file.includes('/dist/')) return false;
  if (file.endsWith('.md') || file.endsWith('.MD')) return false;
  if (file.endsWith('.json') && !file.includes('package.json')) return false;
  // configs that don't require docs
  const configNames = ['.eslintrc', 'eslint.config', 'tsconfig', '.prettierrc', 'vitest.config'];
  if (configNames.some((n) => file.includes(n))) return false;
  // changes under tests don't require docs coupling
  if (/\btests?\b\//.test(file) || /\.test\.[tj]sx?$/.test(file)) return false;
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

function domainsFor(file: string): string[] {
  for (const rule of RULES) {
    if (rule.match.test(file)) return rule.domains;
  }
  return [];
}

function main() {
  if (process.env.SKIP_DOCS_COUPLING === '1') {
    console.log('⚠️  Skipping docs coupling check (SKIP_DOCS_COUPLING=1)');
    return;
  }

  const staged = getStagedFiles();
  if (staged.length === 0) return;

  const codeFiles = staged.filter(isCodeChange);
  if (codeFiles.length === 0) return; // nothing requiring docs

  // Determine required domains from changed code files
  const requiredDomains = new Set<string>();
  for (const f of codeFiles) {
    for (const d of domainsFor(f)) requiredDomains.add(d);
  }

  if (requiredDomains.size === 0) return; // no mapping hit

  // Check if any doc in each required domain changed
  const docChangedByDomain = new Map<string, boolean>();
  for (const d of requiredDomains) docChangedByDomain.set(d, false);

  for (const f of staged) {
    if (!f.startsWith('Docs/')) continue;
    // Match Docs/Blueprints/<domain>/... or Docs/Guides/<domain>/...
    const m = f.match(/^Docs\/(?:Blueprints|Guides)\/([^\/]+)\//);
    if (m) {
      const domain = m[1];
      if (docChangedByDomain.has(domain)) {
        docChangedByDomain.set(domain, true);
      }
    }
  }

  // Also count package-level README changes as satisfying docs update
  for (const f of staged) {
    const pkgReadme = f.match(/^packages\/([^\/]+)\/README\.md$/);
    if (pkgReadme) {
      const pkg = pkgReadme[1];
      // map package to domains
      const doms = domainsFor(`packages/${pkg}/src/index.ts`);
      for (const d of doms) {
        if (docChangedByDomain.has(d)) docChangedByDomain.set(d, true);
      }
    }
  }

  const missing = Array.from(docChangedByDomain.entries())
    .filter(([, changed]) => !changed)
    .map(([d]) => d);

  if (missing.length > 0) {
    console.error('\n❌ Pre-commit blocked: relevant blueprints not updated.');
    console.error('Changed code requires docs in these domains:');
    for (const d of missing) {
      console.error(` - Docs/Blueprints/${d}/`);
    }
    console.error('\nHow to fix:');
    console.error(' - Update the appropriate blueprint(s) in the listed domain(s),');
    console.error('   or update the package README with a “Blueprints & Guides” note.');
    console.error(' - To bypass in rare cases, set SKIP_DOCS_COUPLING=1 and re-commit.');
    process.exit(1);
  }
}

main();
