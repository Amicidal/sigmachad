/**
 * Symbol Extractor for AST Parser
 * Extracts and creates symbol entities from TypeScript/JavaScript AST nodes
 */
import { Node } from "ts-morph";
import { File, FunctionSymbol, ClassSymbol, Symbol as SymbolEntity } from "../../../models/entities.js";
/**
 * Handles symbol extraction from AST nodes
 * Creates typed symbol entities with metadata
 */
export declare class SymbolExtractor {
    /**
     * Create a symbol entity from a ts-morph AST node
     * @param node - The AST node to extract from
     * @param fileEntity - The file entity containing this symbol
     * @returns Symbol entity or null if extraction fails
     */
    createSymbolEntity(node: Node, fileEntity: File): SymbolEntity | null;
    /**
     * Create a JavaScript function entity from a tree-sitter node
     * @param node - The tree-sitter AST node
     * @param fileEntity - The file entity containing this function
     * @returns FunctionSymbol or null if extraction fails
     */
    createJavaScriptFunctionEntity(node: any, fileEntity: File): FunctionSymbol | null;
    /**
     * Create a JavaScript class entity from a tree-sitter node
     * @param node - The tree-sitter AST node
     * @param fileEntity - The file entity containing this class
     * @returns ClassSymbol or null if extraction fails
     */
    createJavaScriptClassEntity(node: any, fileEntity: File): ClassSymbol | null;
    /**
     * Get the name of a symbol from an AST node
     * @param node - The AST node
     * @returns Symbol name or undefined
     */
    getSymbolName(node: Node): string | undefined;
    /**
     * Get the name of a JavaScript symbol from a tree-sitter node
     * @param node - The tree-sitter node
     * @returns Symbol name or undefined
     */
    getJavaScriptSymbolName(node: any): string | undefined;
    /**
     * Get the full text signature of a symbol
     * @param node - The AST node
     * @returns Symbol signature as a string
     */
    getSymbolSignature(node: Node): string;
    /**
     * Get the kind/type of a symbol
     * @param node - The AST node
     * @returns Symbol kind as a string
     */
    getSymbolKind(node: Node): string;
    /**
     * Extract documentation string from a symbol
     * @param node - The AST node
     * @returns Documentation string
     */
    getSymbolDocstring(node: Node): string;
    /**
     * Get the visibility of a symbol
     * @param node - The AST node
     * @returns Visibility level
     */
    getSymbolVisibility(node: Node): "public" | "private" | "protected";
    /**
     * Check if a symbol is exported
     * @param node - The AST node
     * @returns True if exported
     */
    isSymbolExported(node: Node): boolean;
    /**
     * Check if a symbol is deprecated
     * @param node - The AST node
     * @returns True if deprecated
     */
    isSymbolDeprecated(node: Node): boolean;
    /**
     * Get function parameters
     * @param node - The function AST node
     * @returns Array of parameter information
     */
    getFunctionParameters(node: Node): any[];
    /**
     * Get function return type
     * @param node - The function AST node
     * @returns Return type as a string
     */
    getFunctionReturnType(node: Node): string;
    /**
     * Check if function is async
     * @param node - The function AST node
     * @returns True if async
     */
    isFunctionAsync(node: Node): boolean;
    /**
     * Check if function is a generator
     * @param node - The function AST node
     * @returns True if generator
     */
    isFunctionGenerator(node: Node): boolean;
    /**
     * Calculate cyclomatic complexity of a function
     * @param node - The function AST node
     * @returns Complexity score
     */
    calculateComplexity(node: Node): number;
    /**
     * Get classes that a class extends
     * @param node - The class AST node
     * @returns Array of extended class names
     */
    getClassExtends(node: Node): string[];
    /**
     * Get interfaces that a class implements
     * @param node - The class AST node
     * @returns Array of implemented interface names
     */
    getClassImplements(node: Node): string[];
    /**
     * Check if class is abstract
     * @param node - The class AST node
     * @returns True if abstract
     */
    isClassAbstract(node: Node): boolean;
    /**
     * Get interfaces that an interface extends
     * @param node - The interface AST node
     * @returns Array of extended interface names
     */
    getInterfaceExtends(node: Node): string[];
    /**
     * Get the type that a type alias refers to
     * @param node - The type alias AST node
     * @returns Type string
     */
    getTypeAliasType(node: Node): string;
    /**
     * Check if type is a union type
     * @param node - The type alias AST node
     * @returns True if union type
     */
    isTypeUnion(node: Node): boolean;
    /**
     * Check if type is an intersection type
     * @param node - The type alias AST node
     * @returns True if intersection type
     */
    isTypeIntersection(node: Node): boolean;
    /**
     * Detect the language of a file from its extension
     * @param filePath - Path to the file
     * @returns Language identifier
     */
    detectLanguage(filePath: string): string;
    /**
     * Extract dependencies from file content
     * @param content - File content as string
     * @returns Array of dependency names
     */
    extractDependencies(content: string): string[];
    /**
     * Create a file entity from file information
     * @param filePath - Absolute path to the file
     * @param fileRelPath - Relative path to the file
     * @param content - File content
     * @returns File entity
     */
    createFileEntity(filePath: string, fileRelPath: string, content: string): File;
}
//# sourceMappingURL=SymbolExtractor.d.ts.map