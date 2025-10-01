#!/usr/bin/env tsx
/*
 Lightweight secrets scanner for staged files.
 - Usage: pnpm run security:secrets:check:file <filePath>
 - Exits 1 if a likely secret is detected; otherwise 0.
*/
import fs from 'node:fs';
import path from 'node:path';

const [, , fileArg] = process.argv;

function isTextual(file: string): boolean {
  const exts = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.yml',
    '.yaml',
    '.md',
    '.env',
    '.sh',
    '.cjs',
    '.mjs',
    '.css',
    '.html',
  ];
  const ext = path.extname(file).toLowerCase();
  return exts.includes(ext);
}

function main(): void {
  if (!fileArg) process.exit(0);
  if (!fs.existsSync(fileArg)) process.exit(0);
  if (!isTextual(fileArg)) process.exit(0);

  const content = fs.readFileSync(fileArg, 'utf8');

  const patterns: Array<{ name: string; re: RegExp }> = [
    // Generic private keys
    { name: 'Private Key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    // AWS Access Key ID
    { name: 'AWS Access Key ID', re: /AKIA[0-9A-Z]{16}/ },
    // AWS Secret Access Key (weak heuristic)
    { name: 'AWS Secret Access Key', re: /(aws_)?secret(_|)access(_|)key\s*[=:]\s*[A-Za-z0-9\/+=]{20,}/i },
    // OpenAI / generic API keys starting with sk-
    { name: 'OpenAI-like API Key', re: /sk-[A-Za-z0-9]{20,}/ },
    // GitHub tokens
    { name: 'GitHub Token', re: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
    // Slack tokens
    { name: 'Slack Token', re: /xox[abopr]-[A-Za-z0-9-]{10,}/ },
    // Generic "API_KEY" assignment
    { name: 'Generic API Key', re: /API[_-]?KEY\s*[=:]\s*['\"][A-Za-z0-9_-]{16,}['\"]/i },
  ];

  for (const { name, re } of patterns) {
    if (re.test(content)) {
      console.error(`🔒 Potential secret detected: ${name} in ${fileArg}`);
      process.exit(1);
    }
  }

  process.exit(0);
}

main();

