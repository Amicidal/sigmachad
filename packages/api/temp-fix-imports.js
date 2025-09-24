#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Revert to working imports for development
const importMappings = {
  // Use relative paths to existing built services
  '"@memento/knowledge"': '"../../knowledge/dist/index.js"',
  '"@memento/core"': '"../../core/dist/index.js"',
  '"@memento/database"': '"../../knowledge/dist/index.js"', // Fallback to knowledge for now
  '"@memento/testing"': '"../../testing/dist/index.js"',
  '"@memento/sync"': '"../../knowledge/dist/index.js"', // Fallback to knowledge for now
  '"@memento/backup"': '"../../knowledge/dist/index.js"', // Fallback to knowledge for now
};

const files = glob.sync('src/**/*.ts', { cwd: '/Users/Coding/Desktop/sigmachad/packages/api' });

for (const file of files) {
  const filePath = `/Users/Coding/Desktop/sigmachad/packages/api/${file}`;
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [oldImport, newImport] of Object.entries(importMappings)) {
    if (content.includes(oldImport)) {
      content = content.replaceAll(oldImport, newImport);
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`Reverted: ${file}`);
  }
}

console.log('Import reversion complete!');