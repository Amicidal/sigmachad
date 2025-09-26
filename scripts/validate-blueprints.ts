import fs from 'node:fs';
import path from 'node:path';

type CheckResult = {
  file: string;
  fixed: boolean;
  errors: string[];
};

const ROOT = process.cwd();
const BLUEPRINTS_DIR = path.join(ROOT, 'Docs', 'Blueprints');
const GUIDES_DIR = path.join(ROOT, 'Docs', 'Guides');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');

function walkMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(p));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(p);
    }
  }
  return files;
}

function toTitleCase(s: string): string {
  return s
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function deriveScopeFromPath(filePath: string): string {
  // Docs/Blueprints/<scope>/file.md -> <scope>
  const parts = filePath.split(path.sep);
  let idx = parts.indexOf('Blueprints');
  if (idx === -1) idx = parts.indexOf('Guides');
  if (idx !== -1 && parts.length > idx + 2) {
    const maybeScope = parts[idx + 1];
    // If the immediate child of Blueprints is a file (no subdir), scope "root"
    if (maybeScope.endsWith('.md')) return 'root';
    return maybeScope;
  }
  return 'root';
}

function hasHeading(content: string, pattern: RegExp): boolean {
  return pattern.test(content);
}

function ensureSection(content: string, heading: string, body: string): { updated: string; added: boolean } {
  const headingPattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(\\s|$)`, 'mi');
  if (headingPattern.test(content)) return { updated: content, added: false };
  // Append at end with a separating newline
  const updated = content.replace(/\s*$/m, `\n\n## ${heading}\n\n${body}\n`);
  return { updated, added: true };
}

function validateAndFix(file: string): CheckResult {
  const original = fs.readFileSync(file, 'utf8');
  let content = original;
  const errors: string[] = [];
  let fixed = false;

  // 1) Ensure H1 title
  if (!/^#\s+.+/m.test(content)) {
    const base = path.basename(file, path.extname(file));
    const title = toTitleCase(base);
    content = `# ${title}\n\n` + content;
    fixed = true;
    errors.push('Missing H1 title');
  }

  // 2) Ensure Overview section exists
  if (!hasHeading(content, /^##\s+\d*\.?\s*Overview\b/m)) {
    const { updated, added } = ensureSection(
      content,
      'Overview',
      '_Concise purpose, target outcomes, and context._'
    );
    content = updated;
    if (added) {
      fixed = true;
      errors.push('Missing Overview section');
    }
  }

  // 3) Ensure Desired Capabilities (or Next Steps / Backlog) section exists
  if (!hasHeading(content, /^##\s+\d*\.?\s*(Desired Capabilities|Next Steps|Backlog)\b/m)) {
    const { updated, added } = ensureSection(
      content,
      'Desired Capabilities',
      '- [ ] Define required capabilities and acceptance criteria.\n- [ ] Note API/Graph impacts.'
    );
    content = updated;
    if (added) {
      fixed = true;
      errors.push('Missing Desired Capabilities section');
    }
  }

  // 4) Ensure Working TODO checklist exists
  if (!hasHeading(content, /^##\s+\d*\.?\s*Working\s+TODO\b/m)) {
    const scope = deriveScopeFromPath(file);
    const { updated, added } = ensureSection(
      content,
      'Working TODO',
      `- [ ] Add/update Scope metadata (Scope: ${scope}).\n- [ ] Confirm Desired Capabilities with acceptance tests.\n- [ ] Link to code touchpoints (packages/, api routes).\n- [ ] Add migration/backfill plan if needed.`
    );
    content = updated;
    if (added) {
      fixed = true;
      errors.push('Missing Working TODO section');
    }
  }

  // 5) Ensure a Metadata section with at least Scope
  if (!hasHeading(content, /^##\s+\d*\.?\s*Metadata\b/m) || !/\bScope\s*:/i.test(content)) {
    const scope = deriveScopeFromPath(file);
    const { updated, added } = ensureSection(
      content,
      'Metadata',
      `- Scope: ${scope}\n- Status: Draft\n- Last Updated: ${new Date().toISOString().slice(0, 10)}`
    );
    content = updated;
    if (added) {
      fixed = true;
      errors.push('Missing Metadata section with Scope');
    }
  }

  if (FIX && content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }

  return { file: path.relative(ROOT, file), fixed, errors };
}

function main() {
  if (!fs.existsSync(BLUEPRINTS_DIR)) {
    console.error(`Blueprints directory not found at ${BLUEPRINTS_DIR}`);
    process.exit(1);
  }

  const blueprintFiles = walkMarkdownFiles(BLUEPRINTS_DIR).filter((f) => !/README\.md$/i.test(f));
  const blueprintResults = blueprintFiles.map(validateAndFix);

  // Guides: enforce a lighter template (Overview, Metadata, Working TODO optional, at least one of Steps/Procedure/Playbook)
  let guideResults: CheckResult[] = [];
  if (fs.existsSync(GUIDES_DIR)) {
    const guides = walkMarkdownFiles(GUIDES_DIR).filter((f) => !/README\.md$/i.test(f));
    guideResults = guides.map((file) => {
      const original = fs.readFileSync(file, 'utf8');
      let content = original;
      const errors: string[] = [];
      let fixed = false;

      if (!/^#\s+.+/m.test(content)) {
        const base = path.basename(file, path.extname(file));
        const title = toTitleCase(base);
        content = `# ${title}\n\n` + content;
        fixed = true;
        errors.push('Missing H1 title');
      }

      if (!/^##\s+\d*\.?\s*Overview\b/m.test(content)) {
        const added = ensureSection(content, 'Overview', '_What this guide covers and when to use it._');
        content = added.updated;
        if (added.added) {
          fixed = true;
          errors.push('Missing Overview section');
        }
      }

      // Ensure one of Steps/Procedure/Playbook exists
      if (!/^##\s+\d*\.?\s*(Steps|Procedure|Playbook)\b/m.test(content)) {
        const added = ensureSection(content, 'Steps', '- Step 1\n- Step 2\n- Step 3');
        content = added.updated;
        if (added.added) {
          fixed = true;
          errors.push('Missing Steps/Procedure/Playbook section');
        }
      }

      // Audience or Prerequisites
      if (!/^##\s+\d*\.?\s*(Audience|Prerequisites)\b/m.test(content)) {
        const added = ensureSection(content, 'Prerequisites', '- Access, roles, and environment assumptions.');
        content = added.updated;
        if (added.added) {
          fixed = true;
          errors.push('Missing Audience/Prerequisites section');
        }
      }

      // Metadata with Scope
      if (!/^##\s+\d*\.?\s*Metadata\b/m.test(content) || !/\bScope\s*:/i.test(content)) {
        const scope = deriveScopeFromPath(file);
        const added = ensureSection(content, 'Metadata', `- Scope: ${scope}\n- Status: Draft\n- Last Updated: ${new Date().toISOString().slice(0, 10)}`);
        content = added.updated;
        if (added.added) {
          fixed = true;
          errors.push('Missing Metadata section with Scope');
        }
      }

      if (FIX && content !== original) fs.writeFileSync(file, content, 'utf8');
      return { file: path.relative(ROOT, file), fixed, errors };
    });
  }

  const results = [...blueprintResults, ...guideResults];

  const remainingIssues = results.filter((r) => r.errors.length > 0);
  // Compact summary
  for (const r of results) {
    if (r.errors.length > 0) {
      console.log(`- ${r.file}: ${r.fixed ? 'fixed' : 'needs-fix'} -> ${r.errors.join(', ')}`);
    }
  }

  if (!FIX && remainingIssues.length > 0) {
    console.error(`\nDocs validation failed for ${remainingIssues.length} file(s). Run: pnpm docs:fix`);
    process.exit(1);
  }
}

main();
