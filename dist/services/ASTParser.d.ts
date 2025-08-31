/**
 * AST Parser Service for Memento
 * Parses TypeScript/JavaScript code using ts-morph and tree-sitter
 */
import { Entity } from '../models/entities.js';
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
export declare class ASTParser {
    private tsProject;
    private jsParser;
    constructor();
    initialize(): Promise<void>;
    parseFile(filePath: string): Promise<ParseResult>;
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