#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Revert to working imports using the existing dist structure
const importMappings = {
  '"@memento/knowledge"': '"../../../dist/services/knowledge/index.js"',
  '"@memento/core"': '"../../../dist/services/core/index.js"',
  '"@memento/database"': '"../../../dist/services/database/index.js"',
  '"@memento/testing"': '"../../../dist/services/testing/index.js"',
  '"@memento/sync"': '"../../../dist/services/synchronization/index.js"',
  '"@memento/backup"': '"../../../dist/services/backup/index.js"',
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

console.log('Import reversion complete - using existing built services!');