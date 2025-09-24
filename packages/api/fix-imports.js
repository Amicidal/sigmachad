#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Import mapping rules
const importMappings = {
  // Knowledge package
  '"../../services/knowledge/KnowledgeGraphService.js"': '"@memento/knowledge"',
  '"../../services/knowledge/ASTParser.js"': '"@memento/knowledge"',
  '"../../services/knowledge/DocumentationParser.js"': '"@memento/knowledge"',
  '"../services/knowledge/KnowledgeGraphService.js"': '"@memento/knowledge"',
  '"../services/knowledge/ASTParser.js"': '"@memento/knowledge"',
  '"../services/knowledge/DocumentationParser.js"': '"@memento/knowledge"',
  '"../../../services/knowledge/KnowledgeGraphService.js"': '"@memento/knowledge"',
  '"../../../services/knowledge/ASTParser.js"': '"@memento/knowledge"',
  '"../../../services/knowledge/DocumentationParser.js"': '"@memento/knowledge"',

  // Core package (services only, not DatabaseService)
  '"../../services/core/FileWatcher.js"': '"@memento/core"',
  '"../../services/core/LoggingService.js"': '"@memento/core"',
  '"../../services/core/MaintenanceService.js"': '"@memento/core"',
  '"../../services/core/ConfigurationService.js"': '"@memento/core"',
  '"../services/core/FileWatcher.js"': '"@memento/core"',
  '"../services/core/LoggingService.js"': '"@memento/core"',
  '"../services/core/MaintenanceService.js"': '"@memento/core"',
  '"../services/core/ConfigurationService.js"': '"@memento/core"',

  // Database package (use core for now since database package has issues)
  '"../../services/core/DatabaseService.js"': '"@memento/core"',
  '"../services/core/DatabaseService.js"': '"@memento/core"',

  // Models (moved to core)
  '"../../models/types.js"': '"@memento/core"',
  '"../../models/entities.js"': '"@memento/core"',
  '"../../models/relationships.js"': '"@memento/core"',
  '"../models/types.js"': '"@memento/core"',
  '"../models/entities.js"': '"@memento/core"',
  '"../models/relationships.js"': '"@memento/core"',
  '"../../../models/types.js"': '"@memento/core"',
  '"../../../models/entities.js"': '"@memento/core"',
  '"../../../models/relationships.js"': '"@memento/core"',

  // Config (moved to core)
  '"../../config/noise.js"': '"@memento/core"',
  '"../config/noise.js"': '"@memento/core"',

  // Utils (moved to core)
  '"../../utils/performanceFilters.js"': '"@memento/core"',
  '"../utils/performanceFilters.js"': '"@memento/core"',

  // Testing package
  '"../../services/testing/TestEngine.js"': '"@memento/testing"',
  '"../../services/testing/SecurityScanner.js"': '"@memento/testing"',
  '"../../services/testing/SpecService.js"': '"@memento/testing"',
  '"../../services/testing/TestPlanningService.js"': '"@memento/testing"',
  '"../../services/testing/MaintenanceMetrics.js"': '"@memento/testing"',
  '"../services/testing/TestEngine.js"': '"@memento/testing"',
  '"../services/testing/SecurityScanner.js"': '"@memento/testing"',
  '"../services/testing/SpecService.js"': '"@memento/testing"',
  '"../services/testing/TestPlanningService.js"': '"@memento/testing"',
  '"../services/testing/MaintenanceMetrics.js"': '"@memento/testing"',
  '"../../../services/testing/TestEngine.js"': '"@memento/testing"',
  '"../../../services/testing/SecurityScanner.js"': '"@memento/testing"',
  '"../../../services/testing/SpecService.js"': '"@memento/testing"',
  '"../../../services/testing/TestPlanningService.js"': '"@memento/testing"',
  '"../../../services/testing/MaintenanceMetrics.js"': '"@memento/testing"',

  // Sync package
  '"../../services/synchronization/SynchronizationCoordinator.js"': '"@memento/sync"',
  '"../../services/synchronization/SynchronizationMonitoring.js"': '"@memento/sync"',
  '"../../services/scm/ConflictResolution.js"': '"@memento/sync"',
  '"../../services/scm/RollbackCapabilities.js"': '"@memento/sync"',
  '"../../services/scm/GitService.js"': '"@memento/sync"',
  '"../../services/scm/SCMService.js"': '"@memento/sync"',
  '"../../services/scm/LocalGitProvider.js"': '"@memento/sync"',
  '"../../services/scm/SCMProvider.js"': '"@memento/sync"',
  '"../services/synchronization/SynchronizationCoordinator.js"': '"@memento/sync"',
  '"../services/synchronization/SynchronizationMonitoring.js"': '"@memento/sync"',
  '"../services/scm/ConflictResolution.js"': '"@memento/sync"',
  '"../services/scm/RollbackCapabilities.js"': '"@memento/sync"',
  '"../services/scm/GitService.js"': '"@memento/sync"',
  '"../services/scm/SCMService.js"': '"@memento/sync"',
  '"../services/scm/LocalGitProvider.js"': '"@memento/sync"',
  '"../services/scm/SCMProvider.js"': '"@memento/sync"',

  // Backup package
  '"../../services/backup/BackupService.js"': '"@memento/backup"',
  '"../services/backup/BackupService.js"': '"@memento/backup"',

  // Base file fix
  '"../base.js"': '"./base.js"',
  '"../../base.js"': '"../base.js"',
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
    console.log(`Updated: ${file}`);
  }
}

console.log('Import fixing complete!');