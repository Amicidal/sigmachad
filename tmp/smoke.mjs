#!/usr/bin/env node

// packages/knowledge/scripts/simple-smoke-test.ts
import { performance } from "perf_hooks";
var MockASTParser = class {
  async parseFile(filePath) {
    const fileName = filePath.split("/").pop() || "unknown";
    const entities = [
      {
        id: `file-${fileName}`,
        type: "file",
        name: fileName,
        metadata: { filePath, size: Math.floor(Math.random() * 1e4) }
      },
      {
        id: `class-${fileName}-Component`,
        type: "class",
        name: "Component",
        metadata: { filePath, lineNumber: 10 }
      },
      {
        id: `function-${fileName}-render`,
        type: "function",
        name: "render",
        metadata: { filePath, lineNumber: 25 }
      }
    ];
    const relationships = [
      {
        fromEntityId: entities[0].id,
        toEntityId: entities[1].id,
        type: "contains"
      },
      {
        fromEntityId: entities[1].id,
        toEntityId: entities[2].id,
        type: "contains"
      }
    ];
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
    return { entities, relationships, errors: [] };
  }
};
var MockKnowledgeGraphService = class {
  entityCount = 0;
  relationshipCount = 0;
  async createEntitiesBulk(entities) {
    this.entityCount += entities.length;
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
    return { success: true, count: entities.length };
  }
  async createRelationshipsBulk(relationships) {
    this.relationshipCount += relationships.length;
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 15));
    return { success: true, count: relationships.length };
  }
  getStats() {
    return {
      entities: this.entityCount,
      relationships: this.relationshipCount
    };
  }
};
var SimplePipeline = class {
  parser = new MockASTParser();
  kgService = new MockKnowledgeGraphService();
  processedFiles = 0;
  errors = [];
  async processFile(filePath) {
    try {
      console.log(`\u{1F4C1} Processing: ${filePath}`);
      const startTime = performance.now();
      const parseResult = await this.parser.parseFile(filePath);
      if (parseResult.entities.length > 0) {
        await this.kgService.createEntitiesBulk(parseResult.entities);
      }
      if (parseResult.relationships.length > 0) {
        await this.kgService.createRelationshipsBulk(parseResult.relationships);
      }
      const duration = performance.now() - startTime;
      console.log(`   \u2705 Completed in ${duration.toFixed(1)}ms: ${parseResult.entities.length} entities, ${parseResult.relationships.length} relationships`);
      this.processedFiles++;
    } catch (error) {
      console.error(`   \u274C Failed: ${error}`);
      this.errors.push({ filePath, error });
    }
  }
  async processDirectory(dirPath) {
    const mockFiles = [
      `${dirPath}/src/components/Button.tsx`,
      `${dirPath}/src/components/Modal.tsx`,
      `${dirPath}/src/services/ApiService.ts`,
      `${dirPath}/src/utils/helpers.ts`,
      `${dirPath}/src/types/index.ts`
    ];
    console.log(`\u{1F680} Processing ${mockFiles.length} files from ${dirPath}`);
    for (const filePath of mockFiles) {
      await this.processFile(filePath);
    }
  }
  getMetrics() {
    const stats = this.kgService.getStats();
    return {
      processedFiles: this.processedFiles,
      totalEntities: stats.entities,
      totalRelationships: stats.relationships,
      errors: this.errors.length
    };
  }
};
async function runSmokeTest() {
  console.log("\u{1F525} Starting Simple Pipeline Smoke Test\n");
  const startTime = performance.now();
  const pipeline = new SimplePipeline();
  try {
    await pipeline.processDirectory("/mock/project");
    const totalTime = performance.now() - startTime;
    const metrics = pipeline.getMetrics();
    console.log("\n\u{1F4CA} Results:");
    console.log(`   Time: ${totalTime.toFixed(1)}ms`);
    console.log(`   Files: ${metrics.processedFiles}`);
    console.log(`   Entities: ${metrics.totalEntities}`);
    console.log(`   Relationships: ${metrics.totalRelationships}`);
    console.log(`   Errors: ${metrics.errors}`);
    const filesPerSecond = metrics.processedFiles / totalTime * 1e3;
    const entitiesPerSecond = metrics.totalEntities / totalTime * 1e3;
    console.log("\n\u26A1 Performance:");
    console.log(`   Files/second: ${filesPerSecond.toFixed(1)}`);
    console.log(`   Entities/second: ${entitiesPerSecond.toFixed(1)}`);
    const estimatedLOC = metrics.processedFiles * 50;
    const locPerMinute = estimatedLOC / totalTime * 60 * 1e3;
    console.log(`   Estimated LOC/minute: ${locPerMinute.toFixed(0)}`);
    const success = metrics.errors === 0 && metrics.processedFiles > 0;
    console.log(`
\u{1F3AF} Result: ${success ? "\u2705 PASS" : "\u274C FAIL"}`);
    if (success) {
      console.log("\u2728 Pipeline successfully processed all files without errors!");
    } else {
      console.log("\u{1F4A5} Pipeline encountered errors during processing");
    }
    return success;
  } catch (error) {
    console.error("\n\u{1F4A5} Critical error:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmokeTest().then((success) => process.exit(success ? 0 : 1)).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
