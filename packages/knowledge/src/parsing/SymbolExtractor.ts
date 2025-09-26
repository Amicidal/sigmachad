/**
 * Symbol Extractor for AST Parser
 * Extracts and creates symbol entities from TypeScript/JavaScript AST nodes
 */

import { Node, SyntaxKind } from "ts-morph";
import * as path from "path";
import {
  Entity,
  File,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Symbol as SymbolEntity,
} from '@memento/core';
import {
  createHash,
  createShortHash,
  detectLanguage,
  extractDependencies,
  calculateComplexity,
} from "./utils.js";

/**
 * Handles symbol extraction from AST nodes
 * Creates typed symbol entities with metadata
 */
export class SymbolExtractor {
  /**
   * Create a symbol entity from a ts-morph AST node
   * @param node - The AST node to extract from
   * @param fileEntity - The file entity containing this symbol
   * @returns Symbol entity or null if extraction fails
   */
  createSymbolEntity(
    node: Node,
    fileEntity: File
  ): SymbolEntity | null {
    const name = this.getSymbolName(node);
    const signature = this.getSymbolSignature(node);

    if (!name) return null;

    // Stable, deterministic symbol id: file path + name (+ short signature hash for disambiguation)
    const sigHash = createShortHash(signature);
    const id = `sym:${fileEntity.path}#${name}@${sigHash}`;

    const baseSymbol = {
      id,
      type: "symbol" as const,
      path: `${fileEntity.path}:${name}`,
      hash: createHash(signature),
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
        type: "symbol",
        kind: "function",
        parameters: this.getFunctionParameters(node),
        returnType: this.getFunctionReturnType(node),
        isAsync: this.isFunctionAsync(node),
        isGenerator: this.isFunctionGenerator(node),
        complexity: calculateComplexity(node),
        calls: [], // Will be populated by relationship analysis
      } as unknown as FunctionSymbol;
    }

    if (Node.isClassDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "class",
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
        type: "symbol",
        kind: "interface",
        extends: this.getInterfaceExtends(node),
        methods: [],
        properties: [],
      } as unknown as InterfaceSymbol;
    }

    if (Node.isTypeAliasDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "typeAlias",
        aliasedType: this.getTypeAliasType(node),
        isUnion: this.isTypeUnion(node),
        isIntersection: this.isTypeIntersection(node),
      } as unknown as TypeAliasSymbol;
    }

    // Return baseSymbol as the Symbol entity
    return baseSymbol;
  }

  /**
   * Create a JavaScript function entity from a tree-sitter node
   * @param node - The tree-sitter AST node
   * @param fileEntity - The file entity containing this function
   * @returns FunctionSymbol or null if extraction fails
   */
  createJavaScriptFunctionEntity(
    node: any,
    fileEntity: File
  ): FunctionSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: "symbol",
      path: `${fileEntity.path}:${name}`,
      hash: createHash(name),
      language: "javascript",
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      metadata: {},
      name,
      kind: "function" as any,
      signature: `function ${name}()`,
      docstring: "",
      visibility: "public",
      isExported: false,
      isDeprecated: false,
      parameters: [],
      returnType: "any",
      isAsync: false,
      isGenerator: false,
      complexity: 1,
      calls: [],
    };
  }

  /**
   * Create a JavaScript class entity from a tree-sitter node
   * @param node - The tree-sitter AST node
   * @param fileEntity - The file entity containing this class
   * @returns ClassSymbol or null if extraction fails
   */
  createJavaScriptClassEntity(
    node: any,
    fileEntity: File
  ): ClassSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: "symbol",
      path: `${fileEntity.path}:${name}`,
      hash: createHash(name),
      language: "javascript",
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      metadata: {},
      name,
      kind: "class" as any,
      signature: `class ${name}`,
      docstring: "",
      visibility: "public",
      isExported: false,
      isDeprecated: false,
      extends: [],
      implements: [],
      methods: [],
      properties: [],
      isAbstract: false,
    };
  }

  /**
   * Get the name of a symbol from an AST node
   * @param node - The AST node
   * @returns Symbol name or undefined
   */
  getSymbolName(node: Node): string | undefined {
    if (Node.isClassDeclaration(node)) return node.getName();
    if (Node.isFunctionDeclaration(node)) return node.getName();
    if (Node.isInterfaceDeclaration(node)) return node.getName();
    if (Node.isTypeAliasDeclaration(node)) return node.getName();
    if (Node.isMethodDeclaration(node)) return node.getName();
    if (Node.isPropertyDeclaration(node)) return node.getName();
    if (Node.isVariableDeclaration(node)) return node.getName();
    return undefined;
  }

  /**
   * Get the name of a JavaScript symbol from a tree-sitter node
   * @param node - The tree-sitter node
   * @returns Symbol name or undefined
   */
  getJavaScriptSymbolName(node: any): string | undefined {
    for (const child of node.children || []) {
      if (child.type === "identifier") {
        return child.text;
      }
    }
    return undefined;
  }

  /**
   * Get the full text signature of a symbol
   * @param node - The AST node
   * @returns Symbol signature as a string
   */
  getSymbolSignature(node: Node): string {
    try {
      return node.getText();
    } catch {
      return node.getKindName();
    }
  }

  /**
   * Get the kind/type of a symbol
   * @param node - The AST node
   * @returns Symbol kind as a string
   */
  getSymbolKind(node: Node): string {
    if (Node.isClassDeclaration(node)) return "class";
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node))
      return "function";
    if (Node.isInterfaceDeclaration(node)) return "interface";
    if (Node.isTypeAliasDeclaration(node)) return "typeAlias";
    if (Node.isPropertyDeclaration(node)) return "property";
    if (Node.isVariableDeclaration(node)) return "variable";
    return "symbol";
  }

  /**
   * Extract documentation string from a symbol
   * @param node - The AST node
   * @returns Documentation string
   */
  getSymbolDocstring(node: Node): string {
    const comments = node.getLeadingCommentRanges();
    return comments.map((comment) => comment.getText()).join("\n");
  }

  /**
   * Get the visibility of a symbol
   * @param node - The AST node
   * @returns Visibility level
   */
  getSymbolVisibility(node: Node): "public" | "private" | "protected" {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      const modifiers = node.getModifiers();
      if (modifiers.some((mod: any) => mod.kind === SyntaxKind.PrivateKeyword))
        return "private";
      if (
        modifiers.some((mod: any) => mod.kind === SyntaxKind.ProtectedKeyword)
      )
        return "protected";
    }
    return "public";
  }

  /**
   * Check if a symbol is exported
   * @param node - The AST node
   * @returns True if exported
   */
  isSymbolExported(node: Node): boolean {
    try {
      const anyNode: any = node as any;
      if (typeof anyNode.isExported === "function" && anyNode.isExported())
        return true;
      if (
        typeof anyNode.isDefaultExport === "function" &&
        anyNode.isDefaultExport()
      )
        return true;
      if (
        typeof anyNode.hasExportKeyword === "function" &&
        anyNode.hasExportKeyword()
      )
        return true;
      if (
        "getModifiers" in node &&
        typeof (node as any).getModifiers === "function"
      ) {
        return (node as any)
          .getModifiers()
          .some((mod: any) => mod.kind === SyntaxKind.ExportKeyword);
      }
    } catch {
      // fallthrough
    }
    return false;
  }

  /**
   * Check if a symbol is deprecated
   * @param node - The AST node
   * @returns True if deprecated
   */
  isSymbolDeprecated(node: Node): boolean {
    const docstring = this.getSymbolDocstring(node);
    return /@deprecated/i.test(docstring);
  }

  /**
   * Get function parameters
   * @param node - The function AST node
   * @returns Array of parameter information
   */
  getFunctionParameters(node: Node): any[] {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return node.getParameters().map((param) => ({
        name: param.getName(),
        type: param.getType().getText(),
        defaultValue: param.getInitializer()?.getText(),
        optional: param.isOptional(),
      }));
    }
    return [];
  }

  /**
   * Get function return type
   * @param node - The function AST node
   * @returns Return type as a string
   */
  getFunctionReturnType(node: Node): string {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const returnType = node.getReturnType();
      return returnType.getText();
    }
    return "void";
  }

  /**
   * Check if function is async
   * @param node - The function AST node
   * @returns True if async
   */
  isFunctionAsync(node: Node): boolean {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      return node
        .getModifiers()
        .some((mod: any) => mod.kind === SyntaxKind.AsyncKeyword);
    }
    return false;
  }

  /**
   * Check if function is a generator
   * @param node - The function AST node
   * @returns True if generator
   */
  isFunctionGenerator(node: Node): boolean {
    return node.getFirstChildByKind(SyntaxKind.AsteriskToken) !== undefined;
  }

  // calculateComplexity is now available as a shared utility

  /**
   * Get classes that a class extends
   * @param node - The class AST node
   * @returns Array of extended class names
   */
  getClassExtends(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause ? [extendsClause.getText()] : [];
    }
    return [];
  }

  /**
   * Get interfaces that a class implements
   * @param node - The class AST node
   * @returns Array of implemented interface names
   */
  getClassImplements(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const implementsClause = node.getImplements();
      return implementsClause.map((impl) => impl.getText());
    }
    return [];
  }

  /**
   * Check if class is abstract
   * @param node - The class AST node
   * @returns True if abstract
   */
  isClassAbstract(node: Node): boolean {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      return node
        .getModifiers()
        .some((mod: any) => mod.kind === SyntaxKind.AbstractKeyword);
    }
    return false;
  }

  /**
   * Get interfaces that an interface extends
   * @param node - The interface AST node
   * @returns Array of extended interface names
   */
  getInterfaceExtends(node: Node): string[] {
    if (Node.isInterfaceDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause.map((ext) => ext.getText());
    }
    return [];
  }

  /**
   * Get the type that a type alias refers to
   * @param node - The type alias AST node
   * @returns Type string
   */
  getTypeAliasType(node: Node): string {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText();
    }
    return "";
  }

  /**
   * Check if type is a union type
   * @param node - The type alias AST node
   * @returns True if union type
   */
  isTypeUnion(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes("|");
    }
    return false;
  }

  /**
   * Check if type is an intersection type
   * @param node - The type alias AST node
   * @returns True if intersection type
   */
  isTypeIntersection(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes("&");
    }
    return false;
  }

  // detectLanguage and extractDependencies are now available as shared utilities

  /**
   * Create a file entity from file information
   * @param filePath - Absolute path to the file
   * @param fileRelPath - Relative path to the file
   * @param content - File content
   * @returns File entity
   */
  createFileEntity(
    filePath: string,
    fileRelPath: string,
    content: string
  ): File {
    const language = detectLanguage(filePath);
    const dependencies = extractDependencies(content);
    const fileHash = createHash(content);

    return {
      id: `file:${fileRelPath}`,
      type: "file",
      path: fileRelPath,
      extension: path.extname(filePath),
      hash: fileHash,
      language,
      lastModified: new Date(),
      created: new Date(),
      dependencies,
      lines: content.split("\n").length,
      size: Buffer.byteLength(content, "utf8"),
      isTest: filePath.includes('.test.') || filePath.includes('.spec.'),
      isConfig: path.basename(filePath).startsWith('.') || filePath.includes('config'),
    };
  }
}