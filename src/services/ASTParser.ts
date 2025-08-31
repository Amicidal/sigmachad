/**
 * AST Parser Service for Memento
 * Parses TypeScript/JavaScript code using ts-morph and tree-sitter
 */

import { Project, Node, SourceFile, SyntaxKind } from 'ts-morph';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import {
  Entity,
  File,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Symbol as SymbolEntity
} from '../models/entities.js';
import { GraphRelationship, RelationshipType } from '../models/relationships.js';

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

export class ASTParser {
  private tsProject: Project;
  private jsParser: any | null = null;

  constructor() {
    // Initialize TypeScript project
    this.tsProject = new Project({
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
        allowJs: true,
        checkJs: false,
        declaration: false,
        sourceMap: false,
        skipLibCheck: true,
      },
    });
  }

  async initialize(): Promise<void> {
    // Lazily load tree-sitter and its JavaScript grammar. If unavailable, JS parsing is disabled.
    try {
      const { default: Parser } = await import('tree-sitter');
      const { default: JavaScript } = await import('tree-sitter-javascript');
      this.jsParser = new Parser();
      this.jsParser.setLanguage(JavaScript as any);
    } catch (error) {
      console.warn('tree-sitter JavaScript grammar unavailable; JS parsing disabled.', error);
      this.jsParser = null;
    }
  }

  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      const extension = path.extname(filePath).toLowerCase();

      // Determine parser based on file extension
      if (['.ts', '.tsx'].includes(extension)) {
        return this.parseTypeScriptFile(filePath, content);
      } else if (['.js', '.jsx'].includes(extension)) {
        return this.parseJavaScriptFile(filePath, content);
      } else {
        return this.parseOtherFile(filePath, content);
      }
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      return {
        entities: [],
        relationships: [],
        errors: [{
          file: filePath,
          line: 0,
          column: 0,
          message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        }],
      };
    }
  }

  private async parseTypeScriptFile(filePath: string, content: string): Promise<ParseResult> {
    const entities: Entity[] = [];
    const relationships: GraphRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Add file to TypeScript project
      const sourceFile = this.tsProject.createSourceFile(filePath, content, { overwrite: true });

      // Parse file entity
      const fileEntity = await this.createFileEntity(filePath, content);
      entities.push(fileEntity);

      // Extract symbols and relationships
      const symbols = sourceFile.getDescendants().filter(node =>
        Node.isClassDeclaration(node) ||
        Node.isFunctionDeclaration(node) ||
        Node.isInterfaceDeclaration(node) ||
        Node.isTypeAliasDeclaration(node) ||
        Node.isVariableDeclaration(node) ||
        Node.isMethodDeclaration(node) ||
        Node.isPropertyDeclaration(node)
      );

      for (const symbol of symbols) {
        try {
          const symbolEntity = this.createSymbolEntity(symbol, fileEntity);
          if (symbolEntity) {
            entities.push(symbolEntity);

            // Create relationship between file and symbol
            relationships.push(this.createRelationship(
              fileEntity.id,
              symbolEntity.id,
              RelationshipType.DEFINES
            ));

            // Extract relationships for this symbol
            const symbolRelationships = this.extractSymbolRelationships(symbol, symbolEntity, sourceFile);
            relationships.push(...symbolRelationships);
          }
        } catch (error) {
          errors.push({
            file: filePath,
            line: symbol.getStartLineNumber(),
            column: symbol.getStart() - symbol.getStartLinePos(),
            message: `Symbol parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'warning',
          });
        }
      }

      // Extract import/export relationships
      const importRelationships = this.extractImportRelationships(sourceFile, fileEntity);
      relationships.push(...importRelationships);

    } catch (error) {
      errors.push({
        file: filePath,
        line: 0,
        column: 0,
        message: `TypeScript parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }

    return { entities, relationships, errors };
  }

  private async parseJavaScriptFile(filePath: string, content: string): Promise<ParseResult> {
    const entities: Entity[] = [];
    const relationships: GraphRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Parse with tree-sitter if available; otherwise, return minimal result
      if (!this.jsParser) {
        // Fallback: treat as other file when JS parser is unavailable
        return this.parseOtherFile(filePath, content);
      }

      const tree = this.jsParser.parse(content);

      // Create file entity
      const fileEntity = await this.createFileEntity(filePath, content);
      entities.push(fileEntity);

      // Walk the AST and extract symbols
      this.walkJavaScriptAST(tree.rootNode, fileEntity, entities, relationships, filePath);

    } catch (error) {
      errors.push({
        file: filePath,
        line: 0,
        column: 0,
        message: `JavaScript parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }

    return { entities, relationships, errors };
  }

  private async parseOtherFile(filePath: string, content: string): Promise<ParseResult> {
    const fileEntity = await this.createFileEntity(filePath, content);
    return {
      entities: [fileEntity],
      relationships: [],
      errors: [],
    };
  }

  private walkJavaScriptAST(
    node: any,
    fileEntity: File,
    entities: Entity[],
    relationships: GraphRelationship[],
    filePath: string
  ): void {
    // Extract function declarations
    if (node.type === 'function_declaration' || node.type === 'function') {
      const functionEntity = this.createJavaScriptFunctionEntity(node, fileEntity);
      if (functionEntity) {
        entities.push(functionEntity);
        relationships.push(this.createRelationship(
          fileEntity.id,
          functionEntity.id,
          RelationshipType.DEFINES
        ));
      }
    }

    // Extract class declarations
    if (node.type === 'class_declaration') {
      const classEntity = this.createJavaScriptClassEntity(node, fileEntity);
      if (classEntity) {
        entities.push(classEntity);
        relationships.push(this.createRelationship(
          fileEntity.id,
          classEntity.id,
          RelationshipType.DEFINES
        ));
      }
    }

    // Recursively walk child nodes
    for (const child of node.children || []) {
      this.walkJavaScriptAST(child, fileEntity, entities, relationships, filePath);
    }
  }

  private async createFileEntity(filePath: string, content: string): Promise<File> {
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    return {
      id: crypto.randomUUID(),
      type: 'file',
      path: relativePath,
      hash: crypto.createHash('sha256').update(content).digest('hex'),
      language: this.detectLanguage(filePath),
      lastModified: stats.mtime,
      created: stats.birthtime,
      extension: path.extname(filePath),
      size: stats.size,
      lines: content.split('\n').length,
      isTest: /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) || /__tests__/.test(filePath),
      isConfig: /(package\.json|tsconfig\.json|webpack\.config|jest\.config)/.test(filePath),
      dependencies: this.extractDependencies(content),
    };
  }

  private createSymbolEntity(node: Node, fileEntity: File): SymbolEntity | null {
    const id = crypto.randomUUID();
    const name = this.getSymbolName(node);
    const signature = this.getSymbolSignature(node);

    if (!name) return null;

    const baseSymbol = {
      id,
      type: 'symbol' as const,
      path: `${fileEntity.path}:${name}`,
      hash: crypto.createHash('sha256').update(signature).digest('hex'),
      language: fileEntity.language,
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      name,
      kind: this.getSymbolKind(node) as any,
      signature,
      docstring: this.getSymbolDocstring(node),
      visibility: this.getSymbolVisibility(node),
      isExported: this.isSymbolExported(node),
      isDeprecated: this.isSymbolDeprecated(node),
    };

    // Create specific symbol types
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return {
        ...baseSymbol,
        type: 'symbol',
        kind: 'function',
        parameters: this.getFunctionParameters(node),
        returnType: this.getFunctionReturnType(node),
        isAsync: this.isFunctionAsync(node),
        isGenerator: this.isFunctionGenerator(node),
        complexity: this.calculateComplexity(node),
        calls: [], // Will be populated by relationship analysis
      } as unknown as FunctionSymbol;
    }

    if (Node.isClassDeclaration(node)) {
      return {
        ...baseSymbol,
        type: 'symbol',
        kind: 'class',
        extends: this.getClassExtends(node),
        implements: this.getClassImplements(node),
        methods: [],
        properties: [],
        isAbstract: this.isClassAbstract(node),
      } as unknown as ClassSymbol;
    }

    if (Node.isInterfaceDeclaration(node)) {
      return {
        ...baseSymbol,
        type: 'symbol',
        kind: 'interface',
        extends: this.getInterfaceExtends(node),
        methods: [],
        properties: [],
      } as unknown as InterfaceSymbol;
    }

    if (Node.isTypeAliasDeclaration(node)) {
      return {
        ...baseSymbol,
        type: 'symbol',
        kind: 'typeAlias',
        aliasedType: this.getTypeAliasType(node),
        isUnion: this.isTypeUnion(node),
        isIntersection: this.isTypeIntersection(node),
      } as unknown as TypeAliasSymbol;
    }

    // Return baseSymbol as the Symbol entity
    return baseSymbol;
  }

  private createJavaScriptFunctionEntity(node: any, fileEntity: File): FunctionSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: 'symbol',
      path: `${fileEntity.path}:${name}`,
      hash: crypto.createHash('sha256').update(name).digest('hex'),
      language: 'javascript',
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      metadata: {},
      name,
      kind: 'function' as any,
      signature: `function ${name}()`,
      docstring: '',
      visibility: 'public',
      isExported: false,
      isDeprecated: false,
      parameters: [],
      returnType: 'any',
      isAsync: false,
      isGenerator: false,
      complexity: 1,
      calls: [],
    };
  }

  private createJavaScriptClassEntity(node: any, fileEntity: File): ClassSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: 'symbol',
      path: `${fileEntity.path}:${name}`,
      hash: crypto.createHash('sha256').update(name).digest('hex'),
      language: 'javascript',
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      name,
      kind: 'class',
      signature: `class ${name}`,
      docstring: '',
      visibility: 'public',
      isExported: false,
      isDeprecated: false,
      extends: [],
      implements: [],
      methods: [],
      properties: [],
      isAbstract: false,
    };
  }

  private extractSymbolRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    // Extract function calls
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const calls = node.getDescendants().filter(descendant =>
        Node.isCallExpression(descendant)
      );

      for (const call of calls) {
        const callText = call.getText();
        // This is a simplified example - would need more sophisticated analysis
        if (callText.includes('.')) {
          relationships.push(this.createRelationship(
            symbolEntity.id,
            `external:${callText.split('.')[0]}`, // Placeholder for actual symbol resolution
            RelationshipType.CALLS
          ));
        }
      }
    }

    // Extract class inheritance
    if (Node.isClassDeclaration(node)) {
      const heritageClauses = node.getHeritageClauses();
      for (const clause of heritageClauses) {
        if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
          for (const type of clause.getTypeNodes()) {
            relationships.push(this.createRelationship(
              symbolEntity.id,
              `class:${type.getText()}`, // Placeholder for actual symbol resolution
              RelationshipType.EXTENDS
            ));
          }
        }
        if (clause.getToken() === SyntaxKind.ImplementsKeyword) {
          for (const type of clause.getTypeNodes()) {
            relationships.push(this.createRelationship(
              symbolEntity.id,
              `interface:${type.getText()}`, // Placeholder for actual symbol resolution
              RelationshipType.IMPLEMENTS
            ));
          }
        }
      }
    }

    return relationships;
  }

  private extractImportRelationships(sourceFile: SourceFile, fileEntity: File): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    const imports = sourceFile.getImportDeclarations();
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (moduleSpecifier) {
        const namedImports = importDecl.getNamedImports();
        for (const namedImport of namedImports) {
          relationships.push(this.createRelationship(
            fileEntity.id,
            `import:${moduleSpecifier}:${namedImport.getName()}`,
            RelationshipType.IMPORTS
          ));
        }
      }
    }

    return relationships;
  }

  private createRelationship(fromId: string, toId: string, type: RelationshipType): GraphRelationship {
    return {
      id: crypto.randomUUID(),
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
    } as GraphRelationship;
  }

  // Helper methods for symbol extraction
  private getSymbolName(node: Node): string | undefined {
    if (Node.isClassDeclaration(node)) return node.getName();
    if (Node.isFunctionDeclaration(node)) return node.getName();
    if (Node.isInterfaceDeclaration(node)) return node.getName();
    if (Node.isTypeAliasDeclaration(node)) return node.getName();
    if (Node.isMethodDeclaration(node)) return node.getName();
    if (Node.isPropertyDeclaration(node)) return node.getName();
    if (Node.isVariableDeclaration(node)) return node.getName();
    return undefined;
  }

  private getJavaScriptSymbolName(node: any): string | undefined {
    for (const child of node.children || []) {
      if (child.type === 'identifier') {
        return child.text;
      }
    }
    return undefined;
  }

  private getSymbolSignature(node: Node): string {
    try {
      return node.getText();
    } catch {
      return node.getKindName();
    }
  }

  private getSymbolKind(node: Node): string {
    if (Node.isClassDeclaration(node)) return 'class';
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) return 'function';
    if (Node.isInterfaceDeclaration(node)) return 'interface';
    if (Node.isTypeAliasDeclaration(node)) return 'typeAlias';
    if (Node.isPropertyDeclaration(node)) return 'property';
    if (Node.isVariableDeclaration(node)) return 'variable';
    return 'symbol';
  }

  private getSymbolDocstring(node: Node): string {
    const comments = node.getLeadingCommentRanges();
    return comments.map(comment => comment.getText()).join('\n');
  }

  private getSymbolVisibility(node: Node): 'public' | 'private' | 'protected' {
    if ('getModifiers' in node && typeof node.getModifiers === 'function') {
      const modifiers = node.getModifiers();
      if (modifiers.some((mod: any) => mod.kind === SyntaxKind.PrivateKeyword)) return 'private';
      if (modifiers.some((mod: any) => mod.kind === SyntaxKind.ProtectedKeyword)) return 'protected';
    }
    return 'public';
  }

  private isSymbolExported(node: Node): boolean {
    if ('getModifiers' in node && typeof node.getModifiers === 'function') {
      return node.getModifiers().some((mod: any) => mod.kind === SyntaxKind.ExportKeyword);
    }
    return false;
  }

  private isSymbolDeprecated(node: Node): boolean {
    const docstring = this.getSymbolDocstring(node);
    return /@deprecated/i.test(docstring);
  }

  private getFunctionParameters(node: Node): any[] {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return node.getParameters().map(param => ({
        name: param.getName(),
        type: param.getType().getText(),
        defaultValue: param.getInitializer()?.getText(),
        optional: param.isOptional(),
      }));
    }
    return [];
  }

  private getFunctionReturnType(node: Node): string {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const returnType = node.getReturnType();
      return returnType.getText();
    }
    return 'void';
  }

  private isFunctionAsync(node: Node): boolean {
    if ('getModifiers' in node && typeof node.getModifiers === 'function') {
      return node.getModifiers().some((mod: any) => mod.kind === SyntaxKind.AsyncKeyword);
    }
    return false;
  }

  private isFunctionGenerator(node: Node): boolean {
    return node.getFirstChildByKind(SyntaxKind.AsteriskToken) !== undefined;
  }

  private calculateComplexity(node: Node): number {
    // Simplified cyclomatic complexity calculation
    let complexity = 1;
    const descendants = node.getDescendants();

    for (const descendant of descendants) {
      if (Node.isIfStatement(descendant) ||
          Node.isForStatement(descendant) ||
          Node.isWhileStatement(descendant) ||
          Node.isDoStatement(descendant) ||
          Node.isCaseClause(descendant) ||
          Node.isConditionalExpression(descendant)) {
        complexity++;
      }
    }

    return complexity;
  }

  private getClassExtends(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause ? [extendsClause.getText()] : [];
    }
    return [];
  }

  private getClassImplements(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const implementsClause = node.getImplements();
      return implementsClause.map(impl => impl.getText());
    }
    return [];
  }

  private isClassAbstract(node: Node): boolean {
    if ('getModifiers' in node && typeof node.getModifiers === 'function') {
      return node.getModifiers().some((mod: any) => mod.kind === SyntaxKind.AbstractKeyword);
    }
    return false;
  }

  private getInterfaceExtends(node: Node): string[] {
    if (Node.isInterfaceDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause.map(ext => ext.getText());
    }
    return [];
  }

  private getTypeAliasType(node: Node): string {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText();
    }
    return '';
  }

  private isTypeUnion(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes('|');
    }
    return false;
  }

  private isTypeIntersection(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes('&');
    }
    return false;
  }

  private detectLanguage(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
      case '.ts': return 'typescript';
      case '.tsx': return 'typescript';
      case '.js': return 'javascript';
      case '.jsx': return 'javascript';
      default: return 'unknown';
    }
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // Extract npm package imports
    const importRegex = /from ['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const moduleName = match[1];
      if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        dependencies.push(moduleName.split('/')[0]); // Get package name
      }
    }

    // Extract require statements
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const moduleName = match[1];
      if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        dependencies.push(moduleName.split('/')[0]);
      }
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  async parseMultipleFiles(filePaths: string[]): Promise<ParseResult> {
    const allEntities: Entity[] = [];
    const allRelationships: GraphRelationship[] = [];
    const allErrors: ParseError[] = [];

    const promises = filePaths.map(filePath => this.parseFile(filePath));
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allEntities.push(...result.value.entities);
        allRelationships.push(...result.value.relationships);
        allErrors.push(...result.value.errors);
      } else {
        console.error('Parse error:', result.reason);
      }
    }

    return {
      entities: allEntities,
      relationships: allRelationships,
      errors: allErrors,
    };
  }
}
