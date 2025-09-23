#!/usr/bin/env tsx
import { Project } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

console.log('Starting import migration...');

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
});

// Add all TypeScript files from packages and src
project.addSourceFilesAtPaths([
  'packages/**/src/**/*.ts',
  'src/**/*.ts'
]);

// Define import replacements
const replacements: Array<{ pattern: RegExp; replacement: string | ((match: string, ...args: string[]) => string) }> = [
  // Knowledge service imports
  { pattern: /from ['"]\.\.\/knowledge\/([^'"]+)['"]/g, replacement: 'from "@memento/knowledge/$1"' },
  { pattern: /from ['"]\.\.\/\.\.\/services\/knowledge\/([^'"]+)['"]/g, replacement: 'from "@memento/knowledge/$1"' },
  { pattern: /from ['"]@\/services\/knowledge\/([^'"]+)['"]/g, replacement: 'from "@memento/knowledge/$1"' },

  // Database service imports
  { pattern: /from ['"]\.\.\/database\/([^'"]+)['"]/g, replacement: 'from "@memento/database/$1"' },
  { pattern: /from ['"]\.\.\/\.\.\/services\/database\/([^'"]+)['"]/g, replacement: 'from "@memento/database/$1"' },
  { pattern: /from ['"]@\/services\/database\/([^'"]+)['"]/g, replacement: 'from "@memento/database/$1"' },

  // Core utilities imports
  { pattern: /from ['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g, replacement: 'from "@memento/core/utils/$1"' },
  { pattern: /from ['"]@\/utils\/([^'"]+)['"]/g, replacement: 'from "@memento/core/utils/$1"' },

  // Core config imports
  { pattern: /from ['"]\.\.\/\.\.\/config\/([^'"]+)['"]/g, replacement: 'from "@memento/core/config/$1"' },
  { pattern: /from ['"]@\/config\/([^'"]+)['"]/g, replacement: 'from "@memento/core/config/$1"' },

  // Core types imports
  { pattern: /from ['"]\.\.\/\.\.\/models\/types['"]/g, replacement: 'from "@memento/core/types/types"' },
  { pattern: /from ['"]@\/models\/types['"]/g, replacement: 'from "@memento/core/types/types"' },

  // API imports
  { pattern: /from ['"]\.\.\/api\/([^'"]+)['"]/g, replacement: 'from "@memento/api/$1"' },
  { pattern: /from ['"]@\/api\/([^'"]+)['"]/g, replacement: 'from "@memento/api/$1"' },

  // Testing imports
  { pattern: /from ['"]\.\.\/testing\/([^'"]+)['"]/g, replacement: 'from "@memento/testing/$1"' },
  { pattern: /from ['"]\.\.\/\.\.\/services\/testing\/([^'"]+)['"]/g, replacement: 'from "@memento/testing/$1"' },
  { pattern: /from ['"]@\/services\/testing\/([^'"]+)['"]/g, replacement: 'from "@memento/testing/$1"' },
];

let totalReplacements = 0;

// Process each source file
project.getSourceFiles().forEach(sourceFile => {
  const filePath = sourceFile.getFilePath();

  // Skip node_modules and dist
  if (filePath.includes('node_modules') || filePath.includes('/dist/')) {
    return;
  }

  let fileContent = sourceFile.getFullText();
  let fileChanged = false;

  replacements.forEach(({ pattern, replacement }) => {
    const originalContent = fileContent;
    if (typeof replacement === 'string') {
      fileContent = fileContent.replace(pattern, replacement);
    } else {
      fileContent = fileContent.replace(pattern, replacement);
    }

    if (originalContent !== fileContent) {
      fileChanged = true;
      // Count number of replacements
      const matches = originalContent.match(pattern);
      if (matches) {
        totalReplacements += matches.length;
      }
    }
  });

  if (fileChanged) {
    sourceFile.replaceWithText(fileContent);
    console.log(`✓ Updated imports in: ${path.relative(process.cwd(), filePath)}`);
  }
});

// Save all changes
console.log('\nSaving changes...');
project.saveSync();

console.log(`\n✅ Migration complete! Updated ${totalReplacements} imports.`);
console.log('\nNext steps:');
console.log('1. Run "pnpm install" to install workspace dependencies');
console.log('2. Run "pnpm build" to verify the packages compile');
console.log('3. Run "pnpm test" to ensure tests still pass');