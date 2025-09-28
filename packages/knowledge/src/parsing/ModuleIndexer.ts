/**
 * ModuleIndexer
 * Creates Module entities from package manifests (package.json) to close the model gap.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { Module } from '@memento/shared-types.js';

export class ModuleIndexer {
  constructor(private kg: KnowledgeGraphService) {}

  /** Index root package.json as a Module entity if present. */
  async indexRootPackage(dir: string = process.cwd()): Promise<Module | null> {
    try {
      const pkgPath = path.join(dir, 'package.json');
      const raw = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      const name: string = pkg.name || path.basename(dir);
      const version: string = pkg.version || '0.0.0';
      const entryPoint: string = pkg.module || pkg.main || 'index.js';
      const id = `module:${name}`;
      const now = new Date();

      const mod: Module = {
        id,
        type: 'module',
        path: path.relative(process.cwd(), pkgPath),
        hash: crypto.createHash('sha256').update(raw).digest('hex'),
        language: 'node',
        lastModified: now,
        created: now,
        name,
        version,
        packageJson: pkg,
        entryPoint,
        metadata: { workspace: false },
      } as any;

      await this.kg.createOrUpdateEntity(mod);
      return mod;
    } catch {
      return null;
    }
  }
}
