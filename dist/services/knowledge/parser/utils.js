/**
 * Shared Utilities for AST Parser Modules
 * Consolidates common functions to reduce code duplication
 */
import * as crypto from "crypto";
import * as path from "path";
/**
 * Create a SHA256 hash from content
 * @param content - Content to hash
 * @returns Hex string of the hash
 */
export function createHash(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}
/**
 * Create a short hash for IDs (8 characters)
 * @param content - Content to hash
 * @returns Short hex string
 */
export function createShortHash(content) {
    return crypto.createHash("sha1").update(content).digest("hex").slice(0, 8);
}
/**
 * Normalize a relative path by standardizing separators and removing trailing slashes
 * @param filePath - Path to normalize
 * @returns Normalized path string
 */
export function normalizeRelPath(filePath) {
    let s = String(filePath || "").replace(/\\/g, "/");
    s = s.replace(/\/+/g, "/");
    s = s.replace(/\/+$/g, "");
    return s;
}
/**
 * Detect the programming language from file extension
 * @param filePath - Path to the file
 * @returns Language identifier
 */
export function detectLanguage(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const languageMap = {
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".py": "python",
        ".java": "java",
        ".cpp": "cpp",
        ".c": "c",
        ".cs": "csharp",
        ".go": "go",
        ".rs": "rust",
        ".php": "php",
        ".rb": "ruby",
        ".swift": "swift",
        ".kt": "kotlin",
        ".scala": "scala",
    };
    return languageMap[extension] || "unknown";
}
/**
 * Extract import dependencies from file content
 * @param content - File content as string
 * @returns Array of dependency names
 */
export function extractDependencies(content) {
    const dependencies = [];
    // TypeScript/JavaScript import patterns
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const moduleName = match[1];
        if (!moduleName.startsWith(".") && !moduleName.startsWith("/")) {
            dependencies.push(moduleName.split("/")[0]); // Get package name
        }
    }
    while ((match = requireRegex.exec(content)) !== null) {
        const moduleName = match[1];
        if (!moduleName.startsWith(".") && !moduleName.startsWith("/")) {
            dependencies.push(moduleName.split("/")[0]);
        }
    }
    return [...new Set(dependencies)]; // Remove duplicates
}
/**
 * Calculate cyclomatic complexity of an AST node
 * @param node - The AST node to analyze
 * @returns Complexity score
 */
export function calculateComplexity(node) {
    // Simplified cyclomatic complexity calculation
    let complexity = 1;
    if (!node || typeof node.getDescendants !== "function") {
        return complexity;
    }
    const descendants = node.getDescendants();
    for (const descendant of descendants) {
        if (descendant.getKind && (descendant.getKind() === 227 || // IfStatement
            descendant.getKind() === 232 || // ForStatement
            descendant.getKind() === 233 || // WhileStatement
            descendant.getKind() === 234 || // DoStatement
            descendant.getKind() === 284 || // CaseClause
            descendant.getKind() === 218 // ConditionalExpression
        )) {
            complexity++;
        }
    }
    return complexity;
}
/**
 * Parse file path into directory and file name components
 * @param filePath - Full file path
 * @returns Object with directory path and file name
 */
export function parseFilePath(filePath) {
    const normalized = normalizeRelPath(filePath);
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash === -1) {
        return { dirPath: "", fileName: normalized };
    }
    return {
        dirPath: normalized.substring(0, lastSlash),
        fileName: normalized.substring(lastSlash + 1),
    };
}
/**
 * Get the depth of a path (number of directory levels)
 * @param filePath - Path to analyze
 * @returns Depth as a number
 */
export function getPathDepth(filePath) {
    const normalized = normalizeRelPath(filePath);
    if (!normalized)
        return 0;
    return normalized.split("/").filter(p => p).length;
}
/**
 * Check if one path is a parent of another
 * @param parentPath - Potential parent path
 * @param childPath - Potential child path
 * @returns True if parentPath is a parent of childPath
 */
export function isParentPath(parentPath, childPath) {
    const normalizedParent = normalizeRelPath(parentPath);
    const normalizedChild = normalizeRelPath(childPath);
    if (!normalizedParent || !normalizedChild)
        return false;
    if (normalizedParent === normalizedChild)
        return false;
    return normalizedChild.startsWith(normalizedParent + "/");
}
/**
 * Check if a symbol name should be filtered out as noise
 * @param name - Symbol name to check
 * @param stopNames - Set of names to filter out
 * @param minLength - Minimum name length to consider useful
 * @returns True if name should be filtered out
 */
export function isNoiseSymbol(name, stopNames, minLength = 2) {
    if (!name || typeof name !== "string")
        return true;
    if (name.length < minLength)
        return true;
    if (stopNames.has(name.toLowerCase()))
        return true;
    // Filter out common test framework globals and browser globals
    const testGlobals = ["describe", "it", "test", "expect", "beforeeach", "aftereach", "beforeall", "afterall"];
    const browserGlobals = ["window", "document", "console", "navigator", "location"];
    return testGlobals.includes(name.toLowerCase()) || browserGlobals.includes(name.toLowerCase());
}
/**
 * Create a stable, deterministic entity ID
 * @param type - Entity type prefix
 * @param path - File path or entity path
 * @param name - Entity name
 * @param signature - Optional signature for disambiguation
 * @returns Stable entity ID
 */
export function createEntityId(type, path, name, signature) {
    if (name && signature) {
        const sigHash = createShortHash(signature);
        return `${type}:${path}#${name}@${sigHash}`;
    }
    else if (name) {
        return `${type}:${path}:${name}`;
    }
    else {
        return `${type}:${path}`;
    }
}
/**
 * Batch process items with a limit to prevent memory issues
 * @param items - Items to process
 * @param processor - Function to process each batch
 * @param batchSize - Number of items per batch
 * @returns Array of processed results
 */
export async function processBatched(items, processor, batchSize = 50) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);
    }
    return results;
}
//# sourceMappingURL=utils.js.map