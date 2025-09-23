/**
 * RelationshipBuilder - Orchestrates relationship extraction from code entities
 *
 * Refactored as a thin orchestrator that routes AST nodes to specialized builders.
 * Handles coordination between CallRelationshipBuilder, TypeRelationshipBuilder,
 * ImportExportBuilder, and ReferenceRelationshipBuilder.
 */
import * as path from "path";
import { normalizeCodeEdge } from "../../../utils/codeEdges.js";
import { CallRelationshipBuilder, } from "../../../builders/parser/CallRelationshipBuilder.js";
import { TypeRelationshipBuilder, } from "../../../builders/parser/TypeRelationshipBuilder.js";
import { ImportExportBuilder, } from "../../../builders/parser/ImportExportBuilder.js";
import { ReferenceRelationshipBuilder, } from "../../../builders/parser/ReferenceRelationshipBuilder.js";
/**
 * RelationshipBuilder orchestrates the extraction of various types of relationships
 * between code entities by delegating to specialized builders.
 */
export class RelationshipBuilder {
    constructor(options) {
        this.tsProject = options.tsProject;
        this.globalSymbolIndex = options.globalSymbolIndex;
        this.nameIndex = options.nameIndex;
        this.stopNames = options.stopNames;
        this.fileCache = options.fileCache;
        this.shouldUseTypeChecker = options.shouldUseTypeChecker;
        this.takeTcBudget = options.takeTcBudget;
        this.resolveWithTypeChecker = options.resolveWithTypeChecker;
        this.resolveCallTargetWithChecker = options.resolveCallTargetWithChecker;
        this.resolveImportedMemberToFileAndName =
            options.resolveImportedMemberToFileAndName;
        this.getModuleExportMap = options.getModuleExportMap;
        this.normalizeRelPath = options.normalizeRelPath;
        // Initialize specialized builders
        const sharedOptions = {
            tsProject: this.tsProject,
            globalSymbolIndex: this.globalSymbolIndex,
            nameIndex: this.nameIndex,
            stopNames: this.stopNames,
            shouldUseTypeChecker: this.shouldUseTypeChecker,
            takeTcBudget: this.takeTcBudget,
            resolveWithTypeChecker: this.resolveWithTypeChecker,
            resolveCallTargetWithChecker: this.resolveCallTargetWithChecker,
            resolveImportedMemberToFileAndName: this.resolveImportedMemberToFileAndName,
            normalizeRelPath: this.normalizeRelPath,
            createRelationship: this.createRelationship.bind(this),
        };
        this.callBuilder = new CallRelationshipBuilder(sharedOptions);
        this.typeBuilder = new TypeRelationshipBuilder({
            ...sharedOptions,
            stopNames: this.stopNames,
        });
        this.importBuilder = new ImportExportBuilder({
            getModuleExportMap: this.getModuleExportMap,
        });
        this.referenceBuilder = new ReferenceRelationshipBuilder({
            globalSymbolIndex: this.globalSymbolIndex,
            nameIndex: this.nameIndex,
            stopNames: this.stopNames,
            shouldUseTypeChecker: this.shouldUseTypeChecker,
            takeTcBudget: this.takeTcBudget,
            resolveWithTypeChecker: this.resolveWithTypeChecker,
            resolveImportedMemberToFileAndName: this.resolveImportedMemberToFileAndName,
            createRelationship: this.createRelationship.bind(this),
        });
    }
    /**
     * Extracts symbol-level relationships including calls, inheritance, type usage,
     * decorators, method overrides, exceptions, and parameter types.
     */
    extractSymbolRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap) {
        const relationships = [];
        // Build local index for symbol resolution
        const localIndex = this.buildLocalIndex(sourceFile);
        // Route to appropriate builders based on node type and relationship concerns
        relationships.push(...this.callBuilder.extractCallRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
        relationships.push(...this.typeBuilder.extractTypeRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
        return relationships;
    }
    /**
     * Extracts reference relationships using TypeScript AST with best-effort resolution.
     * Analyzes identifiers, type references, instantiations, and read/write operations.
     */
    extractReferenceRelationships(sourceFile, fileEntity, localSymbols, importMap, importSymbolMap) {
        return this.referenceBuilder.extractReferenceRelationships(sourceFile, fileEntity, localSymbols, importMap, importSymbolMap);
    }
    /**
     * Extracts import relationships from a source file, analyzing various import types
     * including default, named, namespace, and side-effect imports.
     */
    extractImportRelationships(sourceFile, fileEntity, importMap, importSymbolMap) {
        return this.importBuilder.extractImportRelationships(sourceFile, fileEntity, importMap, importSymbolMap);
    }
    /**
     * Creates a relationship with proper normalization and metadata handling.
     */
    createRelationship(fromId, toId, type, metadata) {
        // Ensure a sensible default for code-edge source to aid querying
        try {
            if (metadata && metadata.source == null) {
                const md = metadata;
                if (md.usedTypeChecker === true || md.resolution === "type-checker")
                    md.source = "type-checker";
                else
                    md.source = "ast";
            }
        }
        catch (_a) { }
        // Deterministic relationship id using canonical target key for stable identity across resolutions
        const rid = this.canonicalRelationshipId(fromId, {
            toEntityId: toId,
            type,
        });
        const rel = {
            id: rid,
            fromEntityId: fromId,
            toEntityId: toId,
            type,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
            ...(metadata ? { metadata } : {}),
        };
        // Attach a structured toRef for placeholders to aid later resolution
        try {
            if (!rel.toRef) {
                const t = String(toId || "");
                // file:<relPath>:<name> -> fileSymbol
                const mFile = t.match(/^file:(.+?):(.+)$/);
                if (mFile) {
                    rel.toRef = {
                        kind: "fileSymbol",
                        file: mFile[1],
                        symbol: mFile[2],
                        name: mFile[2],
                    };
                }
                else if (t.startsWith("external:")) {
                    // external:<name> -> external
                    rel.toRef = {
                        kind: "external",
                        name: t.slice("external:".length),
                    };
                }
                else if (/^(class|interface|function|typeAlias):/.test(t)) {
                    // kind-qualified placeholder without file: treat as external-like symbolic ref
                    const parts = t.split(":");
                    rel.toRef = {
                        kind: "external",
                        name: parts.slice(1).join(":"),
                    };
                }
                // For sym:/file: IDs, check if they can be parsed as file symbols
                else if (/^(sym:|file:)/.test(t)) {
                    // Check if sym: can be parsed
                    const isParsableSym = t.startsWith("sym:") && /^sym:(.+?)#(.+?)(?:@.+)?$/.test(t);
                    const isParsableFile = t.startsWith("file:") && /^file:(.+?):(.+)$/.test(t);
                    if (!isParsableSym && !isParsableFile) {
                        rel.toRef = { kind: "entity", id: t };
                    }
                }
            }
        }
        catch (_b) { }
        // Attach a basic fromRef to aid coordinator context (file resolution, etc.)
        try {
            if (!rel.fromRef) {
                // We don't attempt to decode file/symbol here; coordinator can fetch entity by id
                rel.fromRef = { kind: "entity", id: fromId };
            }
        }
        catch (_c) { }
        // Normalize code-edge evidence and fields consistently
        return normalizeCodeEdge(rel);
    }
    /**
     * Builds a local symbol index for efficient symbol resolution within a file.
     */
    buildLocalIndex(sourceFile) {
        const localIndex = new Map();
        try {
            const sfPath = (sourceFile.getFilePath && sourceFile.getFilePath()) || "";
            const relPath = path.relative(process.cwd(), sfPath);
            const cached = this.fileCache.get(path.resolve(relPath));
            if (cached && cached.symbolMap) {
                for (const [k, v] of cached.symbolMap.entries()) {
                    const valId = v.id;
                    // Original key format in cache: `${symbolEntity.path}:${symbolEntity.name}`
                    localIndex.set(k, valId);
                    // Also index by simplified key `${fileRelPath}:${name}` to match lookups below
                    const parts = String(k).split(":");
                    if (parts.length >= 2) {
                        const name = parts[parts.length - 1];
                        // symbolEntity.path may itself be `${fileRelPath}:${name}`; rebuild simplified key
                        const simpleKey = `${relPath}:${name}`;
                        localIndex.set(simpleKey, valId);
                    }
                }
            }
        }
        catch (_a) { }
        return localIndex;
    }
    /**
     * Creates a canonical relationship ID for stable identity.
     */
    canonicalRelationshipId(fromId, rel) {
        // Simple implementation - in the original this was imported from utils/codeEdges
        return `${fromId}|${rel.type}|${rel.toEntityId}`;
    }
}
//# sourceMappingURL=RelationshipBuilder.js.map