/**
 * ModuleIndexer
 * Creates Module entities from package manifests (package.json) to close the model gap.
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
export class ModuleIndexer {
    constructor(kg) {
        this.kg = kg;
    }
    /** Index root package.json as a Module entity if present. */
    async indexRootPackage(dir = process.cwd()) {
        try {
            const pkgPath = path.join(dir, 'package.json');
            const raw = await fs.readFile(pkgPath, 'utf-8');
            const pkg = JSON.parse(raw);
            const name = pkg.name || path.basename(dir);
            const version = pkg.version || '0.0.0';
            const entryPoint = pkg.module || pkg.main || 'index.js';
            const id = `module:${name}`;
            const now = new Date();
            const mod = {
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
            };
            await this.kg.createOrUpdateEntity(mod);
            return mod;
        }
        catch (_a) {
            return null;
        }
    }
}
//# sourceMappingURL=ModuleIndexer.js.map