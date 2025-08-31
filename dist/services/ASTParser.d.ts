/**
 * AST Parser Service for Memento
 * Parses TypeScript/JavaScript code using ts-morph and tree-sitter
 */
import { Entity, Symbol as SymbolEntity } from '../models/entities.js';
import { GraphRelationship } from '../models/relationships.js';
export interface ParseResult {
    entities: Entity[];
    relationships: GraphRelationship[];
    errors: ParseError[];
}
export interface ParseError {
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
}
export interface CachedFileInfo {
    hash: string;
    entities: Entity[];
    relationships: GraphRelationship[];
    lastModified: Date;
    symbolMap: Map<string, SymbolEntity>;
}
export interface IncrementalParseResult extends ParseResult {
    isIncremental: boolean;
    addedEntities: Entity[];
    removedEntities: Entity[];
    updatedEntities: Entity[];
    addedRelationships: GraphRelationship[];
    removedRelationships: GraphRelationship[];
}
export declare class ASTParser {
    private tsProject;
    private jsParser;
    private fileCache;
    constructor();
    initialize(): Promise<void>;
    parseFile(filePath: string): Promise<ParseResult>;
    parseFileIncremental(filePath: string): Promise<IncrementalParseResult>;
    private createSymbolMap;
    private computeIncrementalChanges;
    clearCache(): void;
    getCacheStats(): {
        files: number;
        totalEntities: number;
    };
    private parseTypeScriptFile;
    private parseJavaScriptFile;
    private parseOtherFile;
    private walkJavaScriptAST;
    private createFileEntity;
    private createSymbolEntity;
    private createJavaScriptFunctionEntity;
    private createJavaScriptClassEntity;
    private extractSymbolRelationships;
    private extractImportRelationships;
    private createRelationship;
    private getSymbolName;
    private getJavaScriptSymbolName;
    private getSymbolSignature;
    private getSymbolKind;
    private getSymbolDocstring;
    private getSymbolVisibility;
    private isSymbolExported;
    private isSymbolDeprecated;
    private getFunctionParameters;
    private getFunctionReturnType;
    private isFunctionAsync;
    private isFunctionGenerator;
    private calculateComplexity;
    private getClassExtends;
    private getClassImplements;
    private isClassAbstract;
    private getInterfaceExtends;
    private getTypeAliasType;
    private isTypeUnion;
    private isTypeIntersection;
    private detectLanguage;
    private extractDependencies;
    parseMultipleFiles(filePaths: string[]): Promise<ParseResult>;
}
//# sourceMappingURL=ASTParser.d.ts.map