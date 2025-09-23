/**
 * Shared Utilities for AST Parser Modules
 * Consolidates common functions to reduce code duplication
 */
/**
 * Create a SHA256 hash from content
 * @param content - Content to hash
 * @returns Hex string of the hash
 */
export declare function createHash(content: string): string;
/**
 * Create a short hash for IDs (8 characters)
 * @param content - Content to hash
 * @returns Short hex string
 */
export declare function createShortHash(content: string): string;
/**
 * Normalize a relative path by standardizing separators and removing trailing slashes
 * @param filePath - Path to normalize
 * @returns Normalized path string
 */
export declare function normalizeRelPath(filePath: string): string;
/**
 * Detect the programming language from file extension
 * @param filePath - Path to the file
 * @returns Language identifier
 */
export declare function detectLanguage(filePath: string): string;
/**
 * Extract import dependencies from file content
 * @param content - File content as string
 * @returns Array of dependency names
 */
export declare function extractDependencies(content: string): string[];
/**
 * Calculate cyclomatic complexity of an AST node
 * @param node - The AST node to analyze
 * @returns Complexity score
 */
export declare function calculateComplexity(node: any): number;
/**
 * Parse file path into directory and file name components
 * @param filePath - Full file path
 * @returns Object with directory path and file name
 */
export declare function parseFilePath(filePath: string): {
    dirPath: string;
    fileName: string;
};
/**
 * Get the depth of a path (number of directory levels)
 * @param filePath - Path to analyze
 * @returns Depth as a number
 */
export declare function getPathDepth(filePath: string): number;
/**
 * Check if one path is a parent of another
 * @param parentPath - Potential parent path
 * @param childPath - Potential child path
 * @returns True if parentPath is a parent of childPath
 */
export declare function isParentPath(parentPath: string, childPath: string): boolean;
/**
 * Check if a symbol name should be filtered out as noise
 * @param name - Symbol name to check
 * @param stopNames - Set of names to filter out
 * @param minLength - Minimum name length to consider useful
 * @returns True if name should be filtered out
 */
export declare function isNoiseSymbol(name: string, stopNames: Set<string>, minLength?: number): boolean;
/**
 * Create a stable, deterministic entity ID
 * @param type - Entity type prefix
 * @param path - File path or entity path
 * @param name - Entity name
 * @param signature - Optional signature for disambiguation
 * @returns Stable entity ID
 */
export declare function createEntityId(type: string, path: string, name?: string, signature?: string): string;
/**
 * Batch process items with a limit to prevent memory issues
 * @param items - Items to process
 * @param processor - Function to process each batch
 * @param batchSize - Number of items per batch
 * @returns Array of processed results
 */
export declare function processBatched<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, batchSize?: number): Promise<R[]>;
//# sourceMappingURL=utils.d.ts.map