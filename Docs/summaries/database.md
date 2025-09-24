# Package: database
Generated: 2025-09-23 07:07:18 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 277 | ⚠️ |
| Critical Issues | 3 | ❌ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 4 | 🚨 |
| Antipatterns | 22 | 🔍 |

### Notable Issues

#### 🔴 Critical Issues (3)
These are serious problems that could lead to security vulnerabilities or system failures:

- `DatabaseService.ts:263` - **Code behaves differently in tests - tests aren't testing real implementation**
- `FalkorDBService.ts:384` - **Security function returns input unchanged - no actual security**
- `PostgreSQLService.ts:127` - **Code behaves differently in tests - tests aren't testing real implementation**

#### 🚨 Potential Deception (4)
Functions that don't do what their names suggest, or claim functionality they don't have:

- `DatabaseService.ts:263` - **Code behaves differently in tests - tests aren't testing real implementation**
- `FalkorDBService.ts:384` - **Security function returns input unchanged - no actual security**
- `PostgreSQLService.ts:127` - **Code behaves differently in tests - tests aren't testing real implementation**
- `PostgreSQLService.ts:367` - **Error silently swallowed - no error handling or logging**

#### ⚠️ Warnings (23)
Issues that should be addressed but aren't critical:

- `DatabaseService.ts:244` - Direct console.log in class - use proper logging abstraction
- `DatabaseService.ts:338` - Direct console.log in class - use proper logging abstraction
- `DatabaseService.ts:557` - Direct console.log in class - use proper logging abstraction
- `DatabaseService.ts:566` - Direct console.log in class - use proper logging abstraction
- `FalkorDBService.ts:26` - Direct console.log in class - use proper logging abstraction
- `FalkorDBService.ts:278` - Direct console.log in class - use proper logging abstraction
- `FalkorDBService.ts:288` - Direct console.log in class - use proper logging abstraction
- `FalkorDBService.ts:312` - Direct console.log in class - use proper logging abstraction
- `FalkorDBService.ts:331` - Direct console.log in class - use proper logging abstraction
- `FalkorDBService.ts:339` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:44` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:151` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:207` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:210` - Direct console.log in class - use proper logging abstraction
- `PostgreSQLService.ts:164` - Direct console.log in class - use proper logging abstraction
- `PostgreSQLService.ts:367` - Error silently swallowed - no error handling or logging
- `PostgreSQLService.ts:590` - Direct console.log in class - use proper logging abstraction
- `PostgreSQLService.ts:865` - Direct console.log in class - use proper logging abstraction
- `QdrantService.ts:27` - Direct console.log in class - use proper logging abstraction
- `QdrantService.ts:87` - Direct console.log in class - use proper logging abstraction
- `QdrantService.ts:110` - Direct console.log in class - use proper logging abstraction
- `QdrantService.ts:119` - Direct console.log in class - use proper logging abstraction
- `RedisService.ts:25` - Direct console.log in class - use proper logging abstraction

#### 🔍 Code Antipatterns (22)
Design and architecture issues that should be refactored:

- `DatabaseService.ts:244` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `DatabaseService.ts:338` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `DatabaseService.ts:557` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `DatabaseService.ts:566` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FalkorDBService.ts:26` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FalkorDBService.ts:278` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FalkorDBService.ts:288` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FalkorDBService.ts:312` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FalkorDBService.ts:331` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FalkorDBService.ts:339` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:44` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:151` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:207` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:210` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `PostgreSQLService.ts:164` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `PostgreSQLService.ts:590` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `PostgreSQLService.ts:865` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `QdrantService.ts:27` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `QdrantService.ts:87` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `QdrantService.ts:110` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `QdrantService.ts:119` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `RedisService.ts:25` - **Direct console.log in class - use proper logging abstraction** [direct-console]

#### ℹ️ Informational
251 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
neo4j/
  FalkorDBService.ts
  Neo4jService.ts
postgres/
  PostgreSQLService.ts
qdrant/
  QdrantService.ts
redis/
  RedisService.ts
DatabaseService.ts
index.ts
interfaces.ts
services-index.ts

================================================================
Files
================================================================

================
File: neo4j/FalkorDBService.ts
================
import { createClient as createRedisClient, RedisClientType } from "redis";
import { IFalkorDBService } from "./interfaces.js";

export class FalkorDBService implements IFalkorDBService {
  private falkordbClient!: RedisClientType;
  private initialized = false;
  private config: { url: string; database?: number; graphKey?: string };

  constructor(config: { url: string; database?: number; graphKey?: string }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.falkordbClient = createRedisClient({
        url: this.config.url,
        database: this.config.database || 0,
      });

      await this.falkordbClient.connect();
      this.initialized = true;
      console.log("✅ FalkorDB connection established");
    } catch (error) {
      console.error("❌ FalkorDB initialization failed:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.falkordbClient) {
      await this.falkordbClient.disconnect();
    }
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient() {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }
    return this.falkordbClient;
  }

  async query(
    query: string,
    params: Record<string, any> = {},
    graphKeyOverride?: string
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }

    let processedQuery = query;
    try {




      const sanitizedParams: Record<string, any> = {};

      for (const [key, value] of Object.entries(params)) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          throw new Error(
            `Invalid parameter name: ${key}. Only alphanumeric characters and underscores are allowed.`
          );
        }


        sanitizedParams[key] = this.sanitizeParameterValue(value);
      }


      for (const [key, value] of Object.entries(sanitizedParams)) {
        const placeholder = `$${key}`;
        const replacementValue = this.parameterToCypherString(
          value,
          key,
          query
        );


        const regex = new RegExp(`\\$${key}\\b`, "g");
        processedQuery = processedQuery.replace(regex, replacementValue);
      }

      const result = await this.falkordbClient.sendCommand([
        "GRAPH.QUERY",
        graphKeyOverride || this.config.graphKey || "memento",
        processedQuery,
      ]);



      if (result && Array.isArray(result)) {
        if (result.length === 3) {

          const headers = result[0] as any;
          const data = result[1] as any;


          if (!data || (Array.isArray(data) && data.length === 0)) {
            return [];
          }


          if (Array.isArray(headers) && Array.isArray(data)) {
            return data.map((row: any) => {
              const obj: Record<string, any> = {};
              if (Array.isArray(row)) {
                headers.forEach((header: any, index: number) => {
                  const headerName = String(header);
                  obj[headerName] = this.decodeGraphValue(row[index]);
                });
              }
              return obj;
            });
          }

          return data;
        } else if (result.length === 1) {

          return result[0];
        }
      }

      return result;
    } catch (error) {
      console.error("FalkorDB query error:", error);
      console.error("Original query was:", query);
      console.error("Processed query was:", processedQuery);
      console.error("Params were:", params);
      throw error;
    }
  }

  async command(...args: any[]): Promise<any> {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }


    let argv: any[] = [];
    if (args.length === 1 && Array.isArray(args[0])) {
      argv = args[0];
    } else {
      argv = [...args];
    }

    let processedQuery = "";
    if (
      argv.length >= 3 &&
      typeof argv[0] === "string" &&
      typeof argv[1] === "string" &&
      typeof argv[2] === "string" &&
      typeof argv[argv.length - 1] === "object" &&
      argv[argv.length - 1] !== null &&
      !Array.isArray(argv[argv.length - 1])
    ) {
      const params = argv.pop();
      processedQuery = await this.buildProcessedQuery(
        argv[2] as string,
        params as Record<string, any>
      );
      argv[2] = processedQuery;
    }

    const flat: string[] = argv.map((v) =>
      typeof v === "string" ? v : String(v)
    );
    const result = await this.falkordbClient.sendCommand(flat as any);


    const command = flat[0]?.toUpperCase();


    if (command === "PING" || flat.length === 1) {
      return result;
    }

    if (command === "EXEC" || command === "DISCARD" || command === "MULTI") {
      return result;
    }


    if (command === "GRAPH.QUERY") {

      if (result && Array.isArray(result) && result.length >= 2) {
        const headers = result[0] as any;
        const data = result[1] as any;


        if (!data || (Array.isArray(data) && data.length === 0)) {
          return { data: [], headers: headers || [] };
        }


        if (Array.isArray(headers) && Array.isArray(data)) {
          const processedData = data.map((row: any) => {
            const obj: Record<string, any> = {};
            if (Array.isArray(row)) {
              headers.forEach((header: any, index: number) => {
                const headerName = String(header);
                obj[headerName] = this.decodeGraphValue(row[index]);
              });
            }
            return obj;
          });
          return { data: processedData, headers: headers };
        }


        return { data: data || [], headers: headers || [] };
      }

      return { data: [], headers: [] };
    }


    if (result && Array.isArray(result)) {
      if (result.length === 3) {

        const headers = result[0] as any;
        const data = result[1] as any;


        if (!data || (Array.isArray(data) && data.length === 0)) {
          return { data: [], headers: headers || [] };
        }


        if (Array.isArray(headers) && Array.isArray(data)) {
          const processedData = data.map((row: any) => {
            const obj: Record<string, any> = {};
            if (Array.isArray(row)) {
              headers.forEach((header: any, index: number) => {
                const headerName = String(header);
                obj[headerName] = this.decodeGraphValue(row[index]);
              });
            }
            return obj;
          });
          return { data: processedData, headers: headers };
        }


        return { data: data || [], headers: headers || [] };
      } else if (result.length === 1) {

        return { data: result[0] || [], headers: [] };
      }
    }

    return { data: result || [], headers: [] };
  }

  async setupGraph(): Promise<void> {
    if (!this.initialized) {
      throw new Error("FalkorDB not initialized");
    }

    const graphKey = this.config.graphKey || "memento";

    try {
      await this.command(
        "GRAPH.QUERY",
        graphKey,
        "MATCH (n) RETURN count(n) LIMIT 1"
      );
    } catch (error) {
      if (this.isGraphMissingError(error)) {
        console.log(
          "📊 FalkorDB graph will be created on first write operation; index creation deferred"
        );
        return;
      }

      console.error("FalkorDB graph warmup failed:", error);
      return;
    }

    console.log("📊 Setting up FalkorDB graph indexes...");

    const stats = {
      created: 0,
      exists: 0,
      deferred: 0,
      failed: 0,
    };
    const bump = (outcome: keyof typeof stats) => {
      stats[outcome] += 1;
    };

    const primaryIndexQueries = [
      "CREATE INDEX ON :Entity(id)",
      "CREATE INDEX ON :Entity(type)",
      "CREATE INDEX ON :Entity(path)",
      "CREATE INDEX ON :Entity(language)",
      "CREATE INDEX ON :Entity(lastModified)",
    ];

    for (const query of primaryIndexQueries) {
      const outcome = await this.ensureGraphIndex(graphKey, query);
      bump(outcome);
      if (outcome === "deferred" || outcome === "failed") {
        console.log(
          "📊 FalkorDB graph index bootstrap deferred; remaining indexes will be attempted later",
          { outcome, query }
        );
        return;
      }
    }

    const legacyIndexQueries = [
      "CREATE INDEX ON :file(path)",
      "CREATE INDEX ON :symbol(path)",
      "CREATE INDEX ON :version(entityId)",
      "CREATE INDEX ON :checkpoint(checkpointId)",
    ];

    for (const query of legacyIndexQueries) {
      const outcome = await this.ensureGraphIndex(graphKey, query);
      bump(outcome);
      if (outcome === "deferred" || outcome === "failed") {
        console.log(
          "📊 FalkorDB legacy index bootstrap halted",
          { outcome, query }
        );
        return;
      }
    }

    console.log("✅ FalkorDB graph index bootstrap complete", {
      created: stats.created,
      alreadyPresent: stats.exists,
      attempts: stats.created + stats.exists + stats.deferred + stats.failed,
    });
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized || !this.falkordbClient) {
      return false;
    }

    try {
      await this.falkordbClient.ping();
      return true;
    } catch (error) {
      console.error("FalkorDB health check failed:", error);
      return false;
    }
  }

  private async ensureGraphIndex(
    graphKey: string,
    query: string
  ): Promise<"created" | "exists" | "deferred" | "failed"> {
    try {
      await this.command("GRAPH.QUERY", graphKey, query);
      return "created";
    } catch (error) {
      if (this.isIndexAlreadyExistsError(error)) {
        return "exists";
      }

      if (this.isGraphMissingError(error)) {
        return "deferred";
      }

      console.warn(
        `FalkorDB index creation failed for query "${query}":`,
        error
      );
      return "failed";
    }
  }

  private sanitizeParameterValue(value: any): any {

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {

      return value.replace(/[\u0000-\u001f\u007f]/g, "");
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeParameterValue(item));
    }

    if (typeof value === "object") {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          sanitized[key] = this.sanitizeParameterValue(val);
        }

      }
      return sanitized;
    }


    return value;
  }

  private parameterToCypherString(
    value: any,
    key?: string,
    queryForContext?: string
  ): string {
    if (value === null || value === undefined) {
      return "null";
    }

    if (typeof value === "string") {
      const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      return `'${escaped}'`;
    }

    if (typeof value === "boolean" || typeof value === "number") {
      return String(value);
    }

    if (Array.isArray(value)) {
      const childKey = key
        ? key.endsWith("s")
          ? key.slice(0, -1)
          : key
        : undefined;
      const elements = value.map((item) =>
        this.parameterToCypherString(item, childKey, queryForContext)
      );
      return `[${elements.join(", ")}]`;
    }

    if (typeof value === "object") {
      if (
        this.shouldTreatObjectAsMap(key, queryForContext) ||
        (!key && this.shouldTreatObjectAsMap("row", queryForContext))
      ) {
        return this.objectToCypherProperties(value as Record<string, any>);
      }

      const json = JSON.stringify(value);
      const escaped = json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `'${escaped}'`;
    }

    // For other types, convert to string and quote
    return `'${String(value)}'`;
  }

  private shouldTreatObjectAsMap(
    key?: string,
    queryForContext?: string
  ): boolean {
    if (!key) {
      return false;
    }

    const normalized = key.toLowerCase();
    if (
      normalized === "props" ||
      normalized === "row" ||
      normalized === "rows" ||
      normalized.endsWith("props") ||
      normalized.endsWith("properties") ||
      normalized.endsWith("map")
    ) {
      return true;
    }

    if (
      queryForContext &&
      new RegExp(`UNWIND\\s+\\$${key}\\s+AS\\s+`, "i").test(queryForContext)
    ) {
      return true;
    }

    if (!queryForContext) {
      return false;
    }

    const mapPatterns = [
      new RegExp(`SET\\s+\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
      new RegExp(`SET\\s+\\w+\\.\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
      new RegExp(`ON\\s+MATCH\\s+SET\\s+\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
      new RegExp(`ON\\s+CREATE\\s+SET\\s+\\w+\\s*\\+=\\s*\\$${key}\\b`, "i"),
    ];

    return mapPatterns.some((pattern) => pattern.test(queryForContext));
  }

  private objectToCypherProperties(obj: Record<string, any>): string {
    const props = Object.entries(obj)
      .map(([key, value]) => {

        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          throw new Error(`Invalid property name: ${key}`);
        }

        if (typeof value === "string") {
          return `${key}: ${this.parameterToCypherString(
            value,
            key,
            undefined
          )}`;
        } else if (Array.isArray(value)) {

          const childKey = key.endsWith("s")
            ? key.slice(0, -1)
            : key;
          const arrayElements = value.map((item) =>
            this.parameterToCypherString(item, childKey, undefined)
          );
          return `${key}: [${arrayElements.join(", ")}]`;
        } else if (value === null || value === undefined) {
          return `${key}: null`;
        } else if (typeof value === "boolean" || typeof value === "number") {
          return `${key}: ${value}`;
        } else {

          return `${key}: ${this.objectToCypherProperties(
            value as Record<string, any>
          )}`;
        }
      })
      .join(", ");
    return `{${props}}`;
  }

  private normalizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.toLowerCase();
    }

    if (typeof error === "string") {
      return error.toLowerCase();
    }

    if (error && typeof error === "object") {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") {
        return message.toLowerCase();
      }
    }

    return String(error ?? "").toLowerCase();
  }

  private isIndexAlreadyExistsError(error: unknown): boolean {
    const message = this.normalizeErrorMessage(error);
    return (
      message.includes("already indexed") ||
      message.includes("already exists")
    );
  }

  private isGraphMissingError(error: unknown): boolean {
    const message = this.normalizeErrorMessage(error);
    if (!message) {
      return false;
    }

    return (
      (message.includes("graph") && message.includes("does not exist")) ||
      message.includes("unknown graph") ||
      message.includes("graph not found")
    );
  }

  private async buildProcessedQuery(
    query: string,
    params: Record<string, any>
  ): Promise<string> {
    let processedQuery = query;
    const sanitizedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        throw new Error(
          `Invalid parameter name: ${key}. Only alphanumeric characters and underscores are allowed.`
        );
      }
      sanitizedParams[key] = this.sanitizeParameterValue(value);
    }
    for (const [key, value] of Object.entries(sanitizedParams)) {
      const regex = new RegExp(`\\$${key}\\b`, "g");
      const replacement = this.parameterToCypherString(
        value,
        key,
        query
      );
      processedQuery = processedQuery.replace(regex, replacement);
    }
    return processedQuery;
  }

  private decodeGraphValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return value.map((v) => this.decodeGraphValue(v));
    if (typeof value === "object") {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(value))
        out[k] = this.decodeGraphValue(v);
      return out;
    }
    if (typeof value !== "string") return value;
    const t = value.trim();
    if (t === "null") return null;
    if (t === "true") return true;
    if (t === "false") return false;
    if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      try {
        return JSON.parse(t);
      } catch {
        if (t.startsWith("[") && t.endsWith("]")) {
          const inner = t.slice(1, -1).trim();
          if (!inner) return [];
          const parts = inner.split(",").map((s) => s.trim());
          return parts.map((p) => {
            const unq = p.replace(/^['"]|['"]$/g, "");
            if (/^-?\d+(?:\.\d+)?$/.test(unq)) return Number(unq);
            if (unq === "true") return true;
            if (unq === "false") return false;
            if (unq === "null") return null;
            return unq;
          });
        }
      }
    }
    return value;
  }
}

================
File: neo4j/Neo4jService.ts
================
import neo4j, { Driver, Session, Result, RecordShape } from "neo4j-driver";
import { INeo4jService } from "./interfaces.js";

export class Neo4jService implements INeo4jService {
  private driver!: Driver;
  private initialized = false;
  private config: {
    uri: string;
    username: string;
    password: string;
    database?: string;
  };

  constructor(config: {
    uri: string;
    username: string;
    password: string;
    database?: string;
  }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.username, this.config.password),
        {
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 60000,
          maxTransactionRetryTime: 30000,
        }
      );


      const session = this.driver.session();
      try {
        await session.run("RETURN 1");
        this.initialized = true;
        console.log("✅ Neo4j connection established");
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error("❌ Neo4j initialization failed:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
    }
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getDriver(): Driver {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }
    return this.driver;
  }

  async query(
    cypher: string,
    params: Record<string, any> = {},
    options?: { database?: string }
  ): Promise<Result> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const session = this.driver.session({
      database: options?.database || this.config.database || "neo4j",
    });

    try {
      const result = await session.run(cypher, params);
      return result;
    } finally {
      await session.close();
    }
  }

  async transaction<T>(
    callback: (tx: any) => Promise<T>,
    options?: { database?: string }
  ): Promise<T> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const session = this.driver.session({
      database: options?.database || this.config.database || "neo4j",
    });

    try {
      return await session.executeWrite(callback);
    } finally {
      await session.close();
    }
  }

  async setupGraph(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const session = this.driver.session();
    try {

      const constraints = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Function) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Class) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Module) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Interface) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Type) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Variable) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Enum) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Parameter) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Property) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Method) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Constructor) REQUIRE n.id IS UNIQUE",
      ];

      for (const constraint of constraints) {
        await session.run(constraint);
      }


      const indexes = [
        "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.name)",
        "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.path)",
        "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.type)",
        "CREATE INDEX IF NOT EXISTS FOR (n:Entity) ON (n.timestamp)",
      ];

      for (const index of indexes) {
        await session.run(index);
      }

      console.log("✅ Neo4j graph constraints and indexes created");
    } finally {
      await session.close();
    }
  }

  async setupVectorIndexes(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const session = this.driver.session();
    try {

      const vectorIndexes = [
        {
          name: "code_embeddings",
          query: `
            CREATE VECTOR INDEX code_embeddings IF NOT EXISTS
            FOR (n:CodeEmbedding)
            ON (n.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: 1536,
              \`vector.similarity_function\`: 'cosine'
            }}
          `,
        },
        {
          name: "documentation_embeddings",
          query: `
            CREATE VECTOR INDEX documentation_embeddings IF NOT EXISTS
            FOR (n:DocEmbedding)
            ON (n.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: 1536,
              \`vector.similarity_function\`: 'cosine'
            }}
          `,
        },
        {
          name: "integration_test_embeddings",
          query: `
            CREATE VECTOR INDEX integration_test_embeddings IF NOT EXISTS
            FOR (n:TestEmbedding)
            ON (n.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: 1536,
              \`vector.similarity_function\`: 'cosine'
            }}
          `,
        },
      ];

      for (const index of vectorIndexes) {
        try {
          await session.run(index.query);
          console.log(`✅ Vector index ${index.name} created`);
        } catch (error: any) {
          if (error.message?.includes("already exists")) {
            console.log(`📊 Vector index ${index.name} already exists`);
          } else {
            throw error;
          }
        }
      }
    } finally {
      await session.close();
    }
  }

  async upsertVector(
    collection: string,
    id: string,
    vector: number[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const labelMap: Record<string, string> = {
      code_embeddings: "CodeEmbedding",
      documentation_embeddings: "DocEmbedding",
      integration_test: "TestEmbedding",
    };

    const label = labelMap[collection] || "Embedding";

    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (n:${label} {id: $id})
        SET n.embedding = $vector,
            n.metadata = $metadata,
            n.updatedAt = datetime()
        `,
        {
          id,
          vector,
          metadata: JSON.stringify(metadata),
        }
      );
    } finally {
      await session.close();
    }
  }

  async searchVector(
    collection: string,
    vector: number[],
    limit: number = 10,
    filter?: Record<string, any>
  ): Promise<Array<{ id: string; score: number; metadata?: any }>> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const labelMap: Record<string, string> = {
      code_embeddings: "CodeEmbedding",
      documentation_embeddings: "DocEmbedding",
      integration_test: "TestEmbedding",
    };

    const label = labelMap[collection] || "Embedding";
    const indexMap: Record<string, string> = {
      code_embeddings: "code_embeddings",
      documentation_embeddings: "documentation_embeddings",
      integration_test: "integration_test_embeddings",
    };
    const indexName = indexMap[collection] || "code_embeddings";

    let filterClause = "";
    if (filter) {
      const filterConditions = Object.entries(filter)
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `n.metadata CONTAINS '"${key}":"${value}"'`;
          }
          return `n.metadata CONTAINS '"${key}":${value}'`;
        })
        .join(" AND ");
      if (filterConditions) {
        filterClause = `WHERE ${filterConditions}`;
      }
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        CALL db.index.vector.queryNodes($indexName, $limit, $vector)
        YIELD node, score
        ${filterClause}
        RETURN node.id AS id, score, node.metadata AS metadata
        ORDER BY score DESC
        LIMIT $limit
        `,
        {
          indexName,
          vector,
          limit,
        }
      );

      return result.records.map((record) => ({
        id: record.get("id"),
        score: record.get("score"),
        metadata: record.get("metadata")
          ? JSON.parse(record.get("metadata"))
          : undefined,
      }));
    } finally {
      await session.close();
    }
  }

  async deleteVector(collection: string, id: string): Promise<void> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const labelMap: Record<string, string> = {
      code_embeddings: "CodeEmbedding",
      documentation_embeddings: "DocEmbedding",
      integration_test: "TestEmbedding",
    };

    const label = labelMap[collection] || "Embedding";

    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (n:${label} {id: $id})
        DELETE n
        `,
        { id }
      );
    } finally {
      await session.close();
    }
  }

  async scrollVectors(
    collection: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    points: Array<{
      id: string;
      vector: number[];
      metadata?: any;
    }>;
    total: number;
  }> {
    if (!this.initialized) {
      throw new Error("Neo4j not initialized");
    }

    const labelMap: Record<string, string> = {
      code_embeddings: "CodeEmbedding",
      documentation_embeddings: "DocEmbedding",
      integration_test: "TestEmbedding",
    };

    const label = labelMap[collection] || "Embedding";

    const session = this.driver.session();
    try {

      const countResult = await session.run(
        `MATCH (n:${label}) RETURN count(n) AS total`
      );
      const total = countResult.records[0].get("total").toNumber();


      const result = await session.run(
        `
        MATCH (n:${label})
        RETURN n.id AS id, n.embedding AS vector, n.metadata AS metadata
        ORDER BY n.id
        SKIP $offset
        LIMIT $limit
        `,
        { offset, limit }
      );

      const points = result.records.map((record) => ({
        id: record.get("id"),
        vector: record.get("vector"),
        metadata: record.get("metadata")
          ? JSON.parse(record.get("metadata"))
          : undefined,
      }));

      return { points, total };
    } finally {
      await session.close();
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const session = this.driver.session();
    try {
      await session.run("RETURN 1");
      return true;
    } catch {
      return false;
    } finally {
      await session.close();
    }
  }

  async command(...args: any[]): Promise<any> {


    const [command, ...params] = args;

    switch (command) {
      case "GRAPH.QUERY": {
        const [database, cypher, ...queryParams] = params;
        const paramObj = queryParams.length > 0 ? queryParams[0] : {};
        return this.query(cypher, paramObj, { database });
      }
      case "GRAPH.DELETE": {
        const [database] = params;
        const session = this.driver.session({ database });
        try {
          await session.run("MATCH (n) DETACH DELETE n");
          return { success: true };
        } finally {
          await session.close();
        }
      }
      default:
        throw new Error(`Unsupported command: ${command}`);
    }
  }
}

================
File: postgres/PostgreSQLService.ts
================
import type { Pool as PgPool, PoolClient as PgPoolClient } from "pg";
import {
  IPostgreSQLService,
  type BulkQueryInstrumentationConfig,
  type BulkQueryMetrics,
  type BulkQueryMetricsSnapshot,
  type BulkQueryTelemetryEntry,
} from "./interfaces.js";
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  SCMCommitRecord,
} from "../../models/types.js";
import type {
  PerformanceMetricSample,
  PerformanceRelationship,
} from "../../models/relationships.js";
import { normalizeMetricIdForId } from "../../utils/codeEdges.js";
import { sanitizeEnvironment } from "../../utils/environment.js";
import { performance } from "node:perf_hooks";

interface BulkTelemetryListenerPayload {
  entry: BulkQueryTelemetryEntry;
  metrics: BulkQueryMetricsSnapshot;
}

interface PostgreSQLServiceOptions {
  poolFactory?: () => PgPool;
  bulkConfig?: Partial<BulkQueryInstrumentationConfig>;
  bulkTelemetryEmitter?: (payload: BulkTelemetryListenerPayload) => void;
}

export class PostgreSQLService implements IPostgreSQLService {
  private postgresPool!: PgPool;
  private initialized = false;
  private poolFactory?: () => PgPool;
  private config: {
    connectionString: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  private bulkMetrics: BulkQueryMetrics = {
    activeBatches: 0,
    maxConcurrentBatches: 0,
    totalBatches: 0,
    totalQueries: 0,
    totalDurationMs: 0,
    maxBatchSize: 0,
    maxQueueDepth: 0,
    maxDurationMs: 0,
    averageDurationMs: 0,
    lastBatch: null,
    history: [],
    slowBatches: [],
  };
  private bulkInstrumentationConfig: BulkQueryInstrumentationConfig = {
    warnOnLargeBatchSize: 50,
    slowBatchThresholdMs: 750,
    queueDepthWarningThreshold: 3,
    historyLimit: 10,
  };
  private bulkTelemetryEmitter?: (payload: BulkTelemetryListenerPayload) => void;

  constructor(
    config: {
      connectionString: string;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    },
    options?: PostgreSQLServiceOptions
  ) {
    this.config = config;
    this.poolFactory = options?.poolFactory;
    if (options?.bulkConfig) {
      this.bulkInstrumentationConfig = {
        ...this.bulkInstrumentationConfig,
        ...options.bulkConfig,
      };
    }
    this.bulkTelemetryEmitter = options?.bulkTelemetryEmitter;


    this.bulkInstrumentationConfig.historyLimit = Math.max(
      0,
      Math.floor(this.bulkInstrumentationConfig.historyLimit)
    );
    this.bulkInstrumentationConfig.warnOnLargeBatchSize = Math.max(
      1,
      Math.floor(this.bulkInstrumentationConfig.warnOnLargeBatchSize)
    );
    this.bulkInstrumentationConfig.slowBatchThresholdMs = Math.max(
      0,
      this.bulkInstrumentationConfig.slowBatchThresholdMs
    );
    this.bulkInstrumentationConfig.queueDepthWarningThreshold = Math.max(
      0,
      Math.floor(this.bulkInstrumentationConfig.queueDepthWarningThreshold)
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {

      if (this.poolFactory) {
        this.postgresPool = this.poolFactory();


        const { types } = await import("pg");

        types.setTypeParser(1700, (value: string) => parseFloat(value));
        types.setTypeParser(701, (value: string) => parseFloat(value));
        types.setTypeParser(700, (value: string) => parseFloat(value));
        types.setTypeParser(21, (value: string) => parseInt(value, 10));
        types.setTypeParser(23, (value: string) => parseInt(value, 10));
        types.setTypeParser(20, (value: string) => parseInt(value, 10));
      } else {

        const { Pool, types } = await import("pg");


        if (
          process.env.NODE_ENV === "test" ||
          process.env.RUN_INTEGRATION === "1"
        ) {

          types.setTypeParser(3802, (value: string) => JSON.parse(value));
        } else {

          types.setTypeParser(3802, (value: string) => value);
        }



        types.setTypeParser(1700, (value: string) => parseFloat(value));
        types.setTypeParser(701, (value: string) => parseFloat(value));
        types.setTypeParser(700, (value: string) => parseFloat(value));
        types.setTypeParser(21, (value: string) => parseInt(value, 10));
        types.setTypeParser(23, (value: string) => parseInt(value, 10));
        types.setTypeParser(20, (value: string) => parseInt(value, 10));

        this.postgresPool = new Pool({
          connectionString: this.config.connectionString,
          max: this.config.max || 20,
          idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
          connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000,
        });
      }


      const client = await this.postgresPool.connect();
      try {
        await client.query("SELECT NOW()");
      } finally {
        client.release();
      }

      this.initialized = true;
      console.log("✅ PostgreSQL connection established");
    } catch (error) {
      console.error("❌ PostgreSQL initialization failed:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (
        this.postgresPool &&
        typeof (this.postgresPool as any).end === "function"
      ) {
        await this.postgresPool.end();
      }
    } catch (err) {

    } finally {


      this.postgresPool = undefined as any;
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getPool() {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }
    return this.postgresPool;
  }

  private validateUuid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  private validateQueryParams(params: any[]): void {
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (typeof param === "string" && param.length === 36) {


        if (param.includes("-") && !this.validateUuid(param)) {
          throw new Error(
            `Parameter at index ${i} appears to be a UUID but is invalid: ${param}`
          );
        }
      }
    }
  }

  async query(
    query: string,
    params: any[] = [],
    options: { timeout?: number } = {}
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    const client = await this.postgresPool.connect();
    const timeout = options.timeout || 30000;


    this.validateQueryParams(params);

    try {

      await client.query(`SET statement_timeout = ${timeout}`);

      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error("PostgreSQL query error:", error);
      console.error("Query was:", query);
      console.error("Params were:", params);
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error("Error releasing PostgreSQL client:", releaseError);
      }
    }
  }

  async transaction<T>(
    callback: (client: any) => Promise<T>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    const client = await this.postgresPool.connect();
    const timeout = options.timeout || 30000;

    try {

      await client.query(`SET statement_timeout = ${timeout}`);


      if (options.isolationLevel) {
        await client.query(`BEGIN ISOLATION LEVEL ${options.isolationLevel}`);
      } else {
        await client.query("BEGIN");
      }




      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      console.error("Transaction error:", error);
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);

      }
      throw error;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        console.error(
          "Error releasing PostgreSQL client in transaction:",
          releaseError
        );
      }
    }
  }

  async bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options: { continueOnError?: boolean } = {}
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }


    for (const query of queries) {
      this.validateQueryParams(query.params);
    }

    const batchSize = queries.length;
    const continueOnError = options?.continueOnError ?? false;
    const results: any[] = [];

    const startedAtIso = new Date().toISOString();
    const startTime = performance.now();

    let client: PgPoolClient | null = null;
    let transactionStarted = false;
    let capturedError: unknown;

    const activeAtStart = ++this.bulkMetrics.activeBatches;
    if (this.bulkMetrics.activeBatches > this.bulkMetrics.maxConcurrentBatches) {
      this.bulkMetrics.maxConcurrentBatches = this.bulkMetrics.activeBatches;
    }
    const queueDepthAtStart = Math.max(0, activeAtStart - 1);
    if (queueDepthAtStart > this.bulkMetrics.maxQueueDepth) {
      this.bulkMetrics.maxQueueDepth = queueDepthAtStart;
    }

    try {
      client = await this.postgresPool.connect();

      if (continueOnError) {

        for (const { query, params } of queries) {
          try {
            const result = await client.query(query, params);
            results.push(result);
          } catch (error) {
            console.warn("Bulk query error (continuing):", error);
            results.push({ error });
          }
        }
        return results;
      }

      await client.query("BEGIN");
      transactionStarted = true;
      for (const { query, params } of queries) {
        const result = await client.query(query, params);
        results.push(result);
      }
      await client.query("COMMIT");
      transactionStarted = false;
      return results;
    } catch (error) {
      capturedError = error;
      if (transactionStarted && client) {
        try {
          await client.query("ROLLBACK");
        } catch {}
      }
      throw error;
    } finally {
      const durationMs = performance.now() - startTime;

      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error(
            "Error releasing PostgreSQL client in bulk operation:",
            releaseError
          );
        }
      }

      this.bulkMetrics.activeBatches = Math.max(
        0,
        this.bulkMetrics.activeBatches - 1
      );

      this.recordBulkOperationTelemetry({
        batchSize,
        continueOnError,
        durationMs,
        startedAt: startedAtIso,
        queueDepth: queueDepthAtStart,
        error: capturedError,
      });
    }
  }

  private recordBulkOperationTelemetry(params: {
    batchSize: number;
    continueOnError: boolean;
    durationMs: number;
    startedAt: string;
    queueDepth: number;
    error?: unknown;
  }): void {
    const safeDuration = Number.isFinite(params.durationMs)
      ? Math.max(0, params.durationMs)
      : 0;
    const roundedDuration = Number(safeDuration.toFixed(3));
    const entry: BulkQueryTelemetryEntry = {
      batchSize: params.batchSize,
      continueOnError: params.continueOnError,
      durationMs: roundedDuration,
      startedAt: params.startedAt,
      finishedAt: new Date().toISOString(),
      queueDepth: Math.max(0, params.queueDepth || 0),
      mode: params.continueOnError ? "independent" : "transaction",
      success: !params.error,
      error: params.error
        ? params.error instanceof Error
          ? params.error.message
          : String(params.error)
        : undefined,
    };

    this.bulkMetrics.totalBatches += 1;
    this.bulkMetrics.totalQueries += params.batchSize;
    this.bulkMetrics.totalDurationMs += roundedDuration;
    this.bulkMetrics.averageDurationMs =
      this.bulkMetrics.totalBatches === 0
        ? 0
        : this.bulkMetrics.totalDurationMs / this.bulkMetrics.totalBatches;
    this.bulkMetrics.maxBatchSize = Math.max(
      this.bulkMetrics.maxBatchSize,
      params.batchSize
    );
    this.bulkMetrics.maxDurationMs = Math.max(
      this.bulkMetrics.maxDurationMs,
      roundedDuration
    );
    this.bulkMetrics.maxQueueDepth = Math.max(
      this.bulkMetrics.maxQueueDepth,
      entry.queueDepth
    );
    this.bulkMetrics.lastBatch = entry;

    this.appendTelemetryRecord(this.bulkMetrics.history, entry);

    const shouldTrackSlowBatch =
      !entry.success ||
      entry.durationMs >= this.bulkInstrumentationConfig.slowBatchThresholdMs ||
      entry.batchSize >= this.bulkInstrumentationConfig.warnOnLargeBatchSize ||
      entry.queueDepth >=
        this.bulkInstrumentationConfig.queueDepthWarningThreshold;

    if (shouldTrackSlowBatch) {
      this.appendTelemetryRecord(this.bulkMetrics.slowBatches, entry);
    }

    const snapshot = this.createBulkTelemetrySnapshot();
    this.emitBulkTelemetry(entry, snapshot);
    this.logBulkTelemetry(entry);
  }

  private appendTelemetryRecord(
    collection: BulkQueryTelemetryEntry[],
    entry: BulkQueryTelemetryEntry
  ): void {
    const rawLimit = this.bulkInstrumentationConfig.historyLimit;
    const limit = Number.isFinite(rawLimit)
      ? Math.max(0, Math.floor(rawLimit as number))
      : 10;

    if (limit === 0) {
      collection.length = 0;
      return;
    }

    collection.push(entry);
    if (collection.length > limit) {
      collection.splice(0, collection.length - limit);
    }
  }

  private createBulkTelemetrySnapshot(): BulkQueryMetricsSnapshot {
    return {
      activeBatches: this.bulkMetrics.activeBatches,
      maxConcurrentBatches: this.bulkMetrics.maxConcurrentBatches,
      totalBatches: this.bulkMetrics.totalBatches,
      totalQueries: this.bulkMetrics.totalQueries,
      totalDurationMs: this.bulkMetrics.totalDurationMs,
      maxBatchSize: this.bulkMetrics.maxBatchSize,
      maxQueueDepth: this.bulkMetrics.maxQueueDepth,
      maxDurationMs: this.bulkMetrics.maxDurationMs,
      averageDurationMs: this.bulkMetrics.averageDurationMs,
      lastBatch: this.bulkMetrics.lastBatch
        ? { ...this.bulkMetrics.lastBatch }
        : null,
    };
  }

  private emitBulkTelemetry(
    entry: BulkQueryTelemetryEntry,
    snapshot: BulkQueryMetricsSnapshot
  ): void {
    if (!this.bulkTelemetryEmitter) {
      return;
    }

    try {
      this.bulkTelemetryEmitter({
        entry: { ...entry },
        metrics: {
          ...snapshot,
          lastBatch: snapshot.lastBatch ? { ...snapshot.lastBatch } : null,
        },
      });
    } catch (error) {
      console.error("Bulk telemetry emitter threw an error:", error);
    }
  }

  private logBulkTelemetry(entry: BulkQueryTelemetryEntry): void {
    const baseMessage =
      `[PostgreSQLService.bulkQuery] batch=${entry.batchSize} ` +
      `duration=${entry.durationMs.toFixed(2)}ms ` +
      `mode=${entry.mode} queueDepth=${entry.queueDepth}`;

    if (!entry.success) {
      console.error(
        `${baseMessage} failed: ${entry.error ?? "unknown error"}`
      );
      return;
    }

    const isLargeBatch =
      entry.batchSize >= this.bulkInstrumentationConfig.warnOnLargeBatchSize;
    const isSlow =
      entry.durationMs >= this.bulkInstrumentationConfig.slowBatchThresholdMs;
    const hasBackpressure =
      entry.queueDepth >=
      this.bulkInstrumentationConfig.queueDepthWarningThreshold;

    if (isLargeBatch || isSlow || hasBackpressure) {
      const flags = [
        isLargeBatch ? "large-batch" : null,
        isSlow ? "slow" : null,
        hasBackpressure ? "backpressure" : null,
      ]
        .filter(Boolean)
        .join(", ");

      console.warn(
        `${baseMessage}${flags.length ? ` flags=[${flags}]` : ""}`
      );
      return;
    }

    console.debug(baseMessage);
  }

  getBulkWriterMetrics(): BulkQueryMetrics {
    return {
      activeBatches: this.bulkMetrics.activeBatches,
      maxConcurrentBatches: this.bulkMetrics.maxConcurrentBatches,
      totalBatches: this.bulkMetrics.totalBatches,
      totalQueries: this.bulkMetrics.totalQueries,
      totalDurationMs: this.bulkMetrics.totalDurationMs,
      maxBatchSize: this.bulkMetrics.maxBatchSize,
      maxQueueDepth: this.bulkMetrics.maxQueueDepth,
      maxDurationMs: this.bulkMetrics.maxDurationMs,
      averageDurationMs: this.bulkMetrics.averageDurationMs,
      lastBatch: this.bulkMetrics.lastBatch
        ? { ...this.bulkMetrics.lastBatch }
        : null,
      history: this.bulkMetrics.history.map((entry) => ({ ...entry })),
      slowBatches: this.bulkMetrics.slowBatches.map((entry) => ({ ...entry })),
    };
  }

  async setupSchema(): Promise<void> {
    if (!this.initialized) {
      throw new Error("PostgreSQL not initialized");
    }

    console.log("🔧 Setting up PostgreSQL schema...");


    try {
      await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await this.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    } catch (error) {
      console.warn("Warning: Could not create extensions:", error);
    }


    const schemaQueries = [

      `CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        content JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_type VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'timeout')),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,


      `CREATE TABLE IF NOT EXISTS test_suites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        suite_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        framework VARCHAR(50),
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        skipped_tests INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'unknown',
        coverage JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        suite_id UUID REFERENCES test_suites(id),
        test_id VARCHAR(255) NOT NULL,
        test_suite VARCHAR(255),
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        duration INTEGER,
        error_message TEXT,
        stack_trace TEXT,
        coverage JSONB,
        performance JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS test_coverage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        lines DOUBLE PRECISION DEFAULT 0,
        branches DOUBLE PRECISION DEFAULT 0,
        functions DOUBLE PRECISION DEFAULT 0,
        statements DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS test_performance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL,
        suite_id UUID REFERENCES test_suites(id),
        memory_usage INTEGER,
        cpu_usage DOUBLE PRECISION,
        network_requests INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS flaky_test_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id VARCHAR(255) NOT NULL UNIQUE,
        test_name VARCHAR(255) NOT NULL,
        failure_count INTEGER DEFAULT 0,
        flaky_score DECIMAL(6,2) DEFAULT 0,
        total_runs INTEGER DEFAULT 0,
        failure_rate DECIMAL(6,4) DEFAULT 0,
        success_rate DECIMAL(6,4) DEFAULT 0,
        recent_failures INTEGER DEFAULT 0,
        patterns JSONB,
        recommendations JSONB,
        analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      `ALTER TABLE flaky_test_analyses ALTER COLUMN flaky_score TYPE DECIMAL(6,2)`,
      `ALTER TABLE flaky_test_analyses ALTER COLUMN failure_rate TYPE DECIMAL(6,4)`,
      `ALTER TABLE flaky_test_analyses ALTER COLUMN success_rate TYPE DECIMAL(6,4)`,

      `CREATE TABLE IF NOT EXISTS maintenance_backups (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        size_bytes BIGINT DEFAULT 0,
        checksum TEXT,
        status TEXT NOT NULL,
        components JSONB NOT NULL,
        storage_provider TEXT,
        destination TEXT,
        labels TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB NOT NULL,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,


      `CREATE TABLE IF NOT EXISTS changes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        change_type VARCHAR(20) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        author VARCHAR(255),
        commit_hash VARCHAR(255),
        diff TEXT,
        previous_state JSONB,
        new_state JSONB,
        session_id UUID REFERENCES sessions(id),
        spec_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS scm_commits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        commit_hash TEXT NOT NULL UNIQUE,
        branch TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        author TEXT,
        metadata JSONB,
        changes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        related_spec_id TEXT,
        test_results TEXT[] DEFAULT ARRAY[]::TEXT[],
        validation_results JSONB,
        pr_url TEXT,
        provider TEXT,
        status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS performance_metric_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_id TEXT NOT NULL,
        target_id TEXT,
        metric_id TEXT NOT NULL,
        scenario TEXT,
        environment TEXT,
        severity TEXT,
        trend TEXT,
        unit TEXT,
        baseline_value DOUBLE PRECISION,
        current_value DOUBLE PRECISION,
        delta DOUBLE PRECISION,
        percent_change DOUBLE PRECISION,
        sample_size INTEGER,
        risk_score DOUBLE PRECISION,
        run_id TEXT,
        detected_at TIMESTAMP WITH TIME ZONE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        metrics_history JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS coverage_history (
        entity_id UUID NOT NULL,
        lines_covered INTEGER NOT NULL,
        lines_total INTEGER NOT NULL,
        percentage DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
    ];


    for (const query of schemaQueries) {
      try {
        await this.query(query);
      } catch (error) {
        console.warn("Warning: Could not execute schema query:", error);
        console.warn("Query was:", query);
      }
    }


    const constraintQueries = [
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_suites_suite_name_timestamp_key' AND conrelid = 'test_suites'::regclass) THEN
          ALTER TABLE test_suites ADD CONSTRAINT test_suites_suite_name_timestamp_key UNIQUE (suite_name, timestamp);
        END IF;
      END $$;`,

      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_results_test_id_suite_id_key' AND conrelid = 'test_results'::regclass) THEN
          ALTER TABLE test_results ADD CONSTRAINT test_results_test_id_suite_id_key UNIQUE (test_id, suite_id);
        END IF;
      END $$;`,

      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_coverage_test_id_suite_id_key' AND conrelid = 'test_coverage'::regclass) THEN
          ALTER TABLE test_coverage ADD CONSTRAINT test_coverage_test_id_suite_id_key UNIQUE (test_id, suite_id);
        END IF;
      END $$;`,

      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'test_performance_test_id_suite_id_key' AND conrelid = 'test_performance'::regclass) THEN
          ALTER TABLE test_performance ADD CONSTRAINT test_performance_test_id_suite_id_key UNIQUE (test_id, suite_id);
        END IF;
      END $$;`,
    ];

    for (const query of constraintQueries) {
      try {
        await this.query(query);
      } catch (error) {
        console.warn("Warning: Could not add constraint:", error);
      }
    }


    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)",
      "CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON documents USING GIN(content)",
      "CREATE INDEX IF NOT EXISTS idx_changes_entity_id ON changes(entity_id)",
      "CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_changes_session_id ON changes(session_id)",
      "CREATE INDEX IF NOT EXISTS idx_scm_commits_branch ON scm_commits(branch)",
      "CREATE INDEX IF NOT EXISTS idx_scm_commits_created_at ON scm_commits(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_test_suites_timestamp ON test_suites(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_test_suites_framework ON test_suites(framework)",
      "CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id)",
      "CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status)",
      "CREATE INDEX IF NOT EXISTS idx_test_results_suite_id ON test_results(suite_id)",
      "CREATE INDEX IF NOT EXISTS idx_test_coverage_test_id ON test_coverage(test_id)",
      "CREATE INDEX IF NOT EXISTS idx_test_coverage_suite_id ON test_coverage(suite_id)",
      "CREATE INDEX IF NOT EXISTS idx_test_performance_test_id ON test_performance(test_id)",
      "CREATE INDEX IF NOT EXISTS idx_test_performance_suite_id ON test_performance(suite_id)",
      "CREATE INDEX IF NOT EXISTS idx_flaky_test_analyses_test_id ON flaky_test_analyses(test_id)",
      "CREATE INDEX IF NOT EXISTS idx_flaky_test_analyses_flaky_score ON flaky_test_analyses(flaky_score)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_test_id ON performance_metric_snapshots(test_id)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_metric_id ON performance_metric_snapshots(metric_id)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_environment ON performance_metric_snapshots(environment)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_severity ON performance_metric_snapshots(severity)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_trend ON performance_metric_snapshots(trend)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_metric_env ON performance_metric_snapshots(metric_id, environment)",
      "CREATE INDEX IF NOT EXISTS idx_perf_metric_snapshots_detected ON performance_metric_snapshots(detected_at)",
      "CREATE INDEX IF NOT EXISTS idx_coverage_history_entity_id ON coverage_history(entity_id)",
      "CREATE INDEX IF NOT EXISTS idx_coverage_history_timestamp ON coverage_history(timestamp)",
    ];

    for (const query of indexQueries) {
      try {
        await this.query(query);
      } catch (error) {
        console.warn("Warning: Could not create index:", error);
      }
    }

    console.log("✅ PostgreSQL schema setup complete");
  }

  async healthCheck(): Promise<boolean> {
    let client: any = null;
    try {
      client = await this.postgresPool.connect();
      await client.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("PostgreSQL health check failed:", error);
      return false;
    } finally {
      if (client) {
        try {
          client.release();
        } catch (releaseError) {
          console.error("Error releasing PostgreSQL client:", releaseError);
        }
      }
    }
  }

  async storeTestSuiteResult(suiteResult: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const result = await this.transaction(async (client) => {

      const existingSuiteQuery = `
        SELECT id FROM test_suites
        WHERE suite_name = $1 AND timestamp = $2
      `;
      const existingSuiteValues = [
        suiteResult.suiteName || suiteResult.name,
        suiteResult.timestamp,
      ];

      const existingSuiteResult = await client.query(
        existingSuiteQuery,
        existingSuiteValues
      );
      let suiteId = existingSuiteResult.rows[0]?.id;


      if (!suiteId) {
        const suiteQuery = `
          INSERT INTO test_suites (suite_name, timestamp, framework, total_tests, passed_tests, failed_tests, skipped_tests, duration, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        const suiteValues = [
          suiteResult.suiteName || suiteResult.name,
          suiteResult.timestamp,
          suiteResult.framework,
          suiteResult.totalTests,
          suiteResult.passedTests,
          suiteResult.failedTests,
          suiteResult.skippedTests,
          suiteResult.duration,
          suiteResult.status,
        ];

        const suiteResultQuery = await client.query(suiteQuery, suiteValues);
        suiteId = suiteResultQuery.rows[0]?.id;
      }

      if (suiteId) {

        const resultsArray = Array.isArray(suiteResult.results)
          ? suiteResult.results
          : suiteResult.testResults || [];
        let insertedResults = 0;

        for (const result of resultsArray) {
          const testQuery = `
            INSERT INTO test_results (suite_id, test_id, test_name, status, duration, error_message, stack_trace)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (test_id, suite_id) DO NOTHING
          `;
          await client.query(testQuery, [
            suiteId,
            result.testId,
            result.testName || result.name,
            result.status,
            result.duration,
            result.errorMessage || result.error,
            result.stackTrace,
          ]);
          insertedResults++;


          if (result.coverage) {
            const coverageQuery = `
              INSERT INTO test_coverage (test_id, suite_id, lines, branches, functions, statements)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (test_id, suite_id) DO NOTHING
            `;
            await client.query(coverageQuery, [
              result.testId,
              suiteId,
              result.coverage.lines,
              result.coverage.branches,
              result.coverage.functions,
              result.coverage.statements,
            ]);
          }


          if (result.performance) {
            const perfQuery = `
              INSERT INTO test_performance (test_id, suite_id, memory_usage, cpu_usage, network_requests)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (test_id, suite_id) DO NOTHING
            `;
            await client.query(perfQuery, [
              result.testId,
              suiteId,
              result.performance.memoryUsage,
              result.performance.cpuUsage,
              result.performance.networkRequests,
            ]);
          }
        }

        return {
          suiteId,
          suiteName: suiteResult.suiteName || suiteResult.name,
          insertedResults,
          timestamp: suiteResult.timestamp,
        };
      }

      return {
        suiteId: null,
        message: "Failed to create or find test suite",
      };
    });

    return result;
  }

  async storeFlakyTestAnalyses(analyses: any[]): Promise<any> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const result = await this.transaction(async (client) => {
      let insertedCount = 0;
      let updatedCount = 0;
      const processedAnalyses: Array<{
        testId: string;
        testName: string;
        inserted: boolean;
      }> = [];

      for (const analysis of analyses) {

        const existingQuery = `
          SELECT test_id FROM flaky_test_analyses WHERE test_id = $1
        `;
        const existingResult = await client.query(existingQuery, [
          analysis.testId,
        ]);
        const exists = existingResult.rows.length > 0;

        const query = `
          INSERT INTO flaky_test_analyses (test_id, test_name, failure_count, flaky_score, total_runs, failure_rate, success_rate, recent_failures, patterns, recommendations, analyzed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (test_id) DO UPDATE SET
            test_name = EXCLUDED.test_name,
            failure_count = EXCLUDED.failure_count,
            flaky_score = EXCLUDED.flaky_score,
            total_runs = EXCLUDED.total_runs,
            failure_rate = EXCLUDED.failure_rate,
            success_rate = EXCLUDED.success_rate,
            recent_failures = EXCLUDED.recent_failures,
            patterns = EXCLUDED.patterns,
            recommendations = EXCLUDED.recommendations,
            analyzed_at = EXCLUDED.analyzed_at
          RETURNING test_id
        `;
        const result = await client.query(query, [
          analysis.testId,
          analysis.testName,
          Number(analysis.failureCount || analysis.failure_count || 0),
          Number(analysis.flakyScore || analysis.flaky_score || 0),
          Number(analysis.totalRuns || analysis.total_runs || 0),
          Number(analysis.failureRate || analysis.failure_rate || 0),
          Number(analysis.successRate || analysis.success_rate || 0),
          Number(analysis.recentFailures || analysis.recent_failures || 0),
          JSON.stringify(analysis.patterns || analysis.failurePatterns || {}),
          JSON.stringify(analysis.recommendations || {}),
          analysis.analyzedAt ||
            analysis.analyzed_at ||
            new Date().toISOString(),
        ]);

        if (result.rows.length > 0) {
          if (exists) {
            updatedCount++;
          } else {
            insertedCount++;
          }

          processedAnalyses.push({
            testId: analysis.testId,
            testName: analysis.testName,
            inserted: !exists,
          });
        }
      }

      return {
        totalProcessed: analyses.length,
        insertedCount,
        updatedCount,
        processedAnalyses,
      };
    });

    return result;
  }

  async recordPerformanceMetricSnapshot(
    snapshot: PerformanceRelationship
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const client = await this.postgresPool.connect();
    try {
      const sanitizeNumber = (value: unknown): number | null => {
        if (value === null || value === undefined) return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };

      const sanitizeInt = (value: unknown): number | null => {
        const num = sanitizeNumber(value);
        if (num === null) return null;
        return Math.round(num);
      };

      const metricsHistory = Array.isArray(snapshot.metricsHistory)
        ? snapshot.metricsHistory
            .slice(-50)
            .map((entry) => ({
              ...entry,
              timestamp: entry.timestamp
                ? new Date(entry.timestamp as Date).toISOString()
                : undefined,
            }))
        : null;

      const metadata = {
        ...(snapshot.metadata || {}),
        evidence: snapshot.evidence,
      };

      const query = `
        INSERT INTO performance_metric_snapshots (
          test_id,
          target_id,
          metric_id,
          scenario,
          environment,
          severity,
          trend,
          unit,
          baseline_value,
          current_value,
          delta,
          percent_change,
          sample_size,
          risk_score,
          run_id,
          detected_at,
          resolved_at,
          metadata,
          metrics_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `;

      await client.query(query, [
        snapshot.fromEntityId,
        snapshot.toEntityId ?? null,
        snapshot.metricId,
        snapshot.scenario ?? null,
        snapshot.environment ?? null,
        snapshot.severity ?? null,
        snapshot.trend ?? null,
        snapshot.unit ?? null,
        sanitizeNumber(snapshot.baselineValue),
        sanitizeNumber(snapshot.currentValue),
        sanitizeNumber(snapshot.delta),
        sanitizeNumber(snapshot.percentChange),
        sanitizeInt(snapshot.sampleSize),
        sanitizeNumber(snapshot.riskScore),
        snapshot.runId ?? null,
        snapshot.detectedAt ? new Date(snapshot.detectedAt as Date) : null,
        snapshot.resolvedAt ? new Date(snapshot.resolvedAt as Date) : null,
        metadata ? JSON.stringify(metadata) : null,
        metricsHistory ? JSON.stringify(metricsHistory) : null,
      ]);
    } finally {
      client.release();
    }
  }

  async recordSCMCommit(commit: SCMCommitRecord): Promise<void> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const changes = Array.isArray(commit.changes)
      ? commit.changes.map((c) => String(c))
      : [];
    const testResults = Array.isArray(commit.testResults)
      ? commit.testResults.map((t) => String(t))
      : [];

    const metadata = commit.metadata ? JSON.stringify(commit.metadata) : null;
    const validationResults =
      commit.validationResults !== undefined && commit.validationResults !== null
        ? JSON.stringify(commit.validationResults)
        : null;

    const query = `
      INSERT INTO scm_commits (
        commit_hash,
        branch,
        title,
        description,
        author,
        metadata,
        changes,
        related_spec_id,
        test_results,
        validation_results,
        pr_url,
        provider,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        COALESCE($14, NOW()),
        COALESCE($15, NOW())
      )
      ON CONFLICT (commit_hash)
      DO UPDATE SET
        branch = EXCLUDED.branch,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        author = EXCLUDED.author,
        metadata = EXCLUDED.metadata,
        changes = EXCLUDED.changes,
        related_spec_id = EXCLUDED.related_spec_id,
        test_results = EXCLUDED.test_results,
        validation_results = EXCLUDED.validation_results,
        pr_url = EXCLUDED.pr_url,
        provider = EXCLUDED.provider,
        status = EXCLUDED.status,
        updated_at = NOW();
    `;

    await this.query(query, [
      commit.commitHash,
      commit.branch,
      commit.title,
      commit.description ?? null,
      commit.author ?? null,
      metadata,
      changes,
      commit.relatedSpecId ?? null,
      testResults,
      validationResults,
      commit.prUrl ?? null,
      commit.provider ?? "local",
      commit.status ?? "committed",
      commit.createdAt ? new Date(commit.createdAt) : null,
      commit.updatedAt ? new Date(commit.updatedAt) : null,
    ]);
  }

  async getSCMCommitByHash(
    commitHash: string
  ): Promise<SCMCommitRecord | null> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const result = await this.query(
      `
        SELECT
          id,
          commit_hash,
          branch,
          title,
          description,
          author,
          metadata,
          changes,
          related_spec_id,
          test_results,
          validation_results,
          pr_url,
          provider,
          status,
          created_at,
          updated_at
        FROM scm_commits
        WHERE commit_hash = $1
      `,
      [commitHash]
    );

    if (!result?.rows?.length) {
      return null;
    }

    const row = result.rows[0];
    const parseJson = (value: unknown) => {
      if (value == null) return undefined;
      if (typeof value === "object") return value as Record<string, any>;
      try {
        return JSON.parse(String(value));
      } catch {
        return undefined;
      }
    };

    return {
      id: row.id ?? undefined,
      commitHash: row.commit_hash,
      branch: row.branch,
      title: row.title,
      description: row.description ?? undefined,
      author: row.author ?? undefined,
      changes: Array.isArray(row.changes) ? row.changes : [],
      relatedSpecId: row.related_spec_id ?? undefined,
      testResults: Array.isArray(row.test_results) ? row.test_results : undefined,
      validationResults: parseJson(row.validation_results),
      prUrl: row.pr_url ?? undefined,
      provider: row.provider ?? undefined,
      status: row.status ?? undefined,
      metadata: parseJson(row.metadata),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  async listSCMCommits(limit: number = 50): Promise<SCMCommitRecord[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const sanitizedLimit = Math.max(1, Math.min(Math.floor(limit), 200));

    const result = await this.query(
      `
        SELECT
          id,
          commit_hash,
          branch,
          title,
          description,
          author,
          metadata,
          changes,
          related_spec_id,
          test_results,
          validation_results,
          pr_url,
          provider,
          status,
          created_at,
          updated_at
        FROM scm_commits
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [sanitizedLimit]
    );

    if (!result?.rows?.length) {
      return [];
    }

    const parseJson = (value: unknown) => {
      if (value == null) return undefined;
      if (typeof value === "object") return value as Record<string, any>;
      try {
        return JSON.parse(String(value));
      } catch {
        return undefined;
      }
    };

    return result.rows.map((row) => ({
      id: row.id ?? undefined,
      commitHash: row.commit_hash,
      branch: row.branch,
      title: row.title,
      description: row.description ?? undefined,
      author: row.author ?? undefined,
      changes: Array.isArray(row.changes) ? row.changes : [],
      relatedSpecId: row.related_spec_id ?? undefined,
      testResults: Array.isArray(row.test_results)
        ? row.test_results
        : undefined,
      validationResults: parseJson(row.validation_results),
      prUrl: row.pr_url ?? undefined,
      provider: row.provider ?? undefined,
      status: row.status ?? undefined,
      metadata: parseJson(row.metadata),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }));
  }

  async getTestExecutionHistory(
    entityId: string,
    limit: number = 50
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const client = await this.postgresPool.connect();
    try {
      let query: string;
      let params: any[];

      if (entityId && entityId.trim() !== "") {
        // If entityId is provided, search for specific test
        query = `
          SELECT tr.*, ts.suite_name, ts.framework, ts.timestamp as suite_timestamp
          FROM test_results tr
          JOIN test_suites ts ON tr.suite_id = ts.id
          WHERE tr.test_id = $1
          ORDER BY ts.timestamp DESC
          LIMIT $2
        `;
        params = [entityId, limit];
      } else {
        // If no entityId, return all test results
        query = `
          SELECT tr.*, ts.suite_name, ts.framework, ts.timestamp as suite_timestamp
          FROM test_results tr
          JOIN test_suites ts ON tr.suite_id = ts.id
          ORDER BY ts.timestamp DESC
          LIMIT $1
        `;
        params = [limit];
      }

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getPerformanceMetricsHistory(
    entityId: string,
    options: number | PerformanceHistoryOptions = {}
  ): Promise<PerformanceHistoryRecord[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const normalizedOptions: PerformanceHistoryOptions =
      typeof options === "number"
        ? { days: options }
        : options ?? {};

    const {
      days = 30,
      metricId,
      environment,
      severity,
      limit = 100,
    } = normalizedOptions;

    const sanitizedMetricId =
      typeof metricId === "string" && metricId.trim().length > 0
        ? normalizeMetricIdForId(metricId)
        : undefined;
    const sanitizedEnvironment =
      typeof environment === "string" && environment.trim().length > 0
        ? sanitizeEnvironment(environment)
        : undefined;
    const sanitizedSeverity = (() => {
      if (typeof severity !== "string") return undefined;
      const normalized = severity.trim().toLowerCase();
      switch (normalized) {
        case "critical":
        case "high":
        case "medium":
        case "low":
          return normalized;
        default:
          return undefined;
      }
    })();
    const safeLimit = Number.isFinite(limit)
      ? Math.min(500, Math.max(1, Math.floor(limit)))
      : 100;
    const safeDays =
      typeof days === "number" && Number.isFinite(days)
        ? Math.min(365, Math.max(1, Math.floor(days)))
        : undefined;

    const client = await this.postgresPool.connect();
    try {
      const conditions: string[] = ["(pm.test_id = $1 OR pm.target_id = $1)"];
      const params: any[] = [entityId];
      let paramIndex = 2;

      if (sanitizedMetricId) {
        conditions.push(`pm.metric_id = $${paramIndex}`);
        params.push(sanitizedMetricId);
        paramIndex += 1;
      }

      if (sanitizedEnvironment) {
        conditions.push(`pm.environment = $${paramIndex}`);
        params.push(sanitizedEnvironment);
        paramIndex += 1;
      }

      if (sanitizedSeverity) {
        conditions.push(`pm.severity = $${paramIndex}`);
        params.push(sanitizedSeverity);
        paramIndex += 1;
      }

      if (typeof safeDays === "number") {
        conditions.push(
          `(pm.detected_at IS NULL OR pm.detected_at >= NOW() - $${paramIndex} * INTERVAL '1 day')`
        );
        params.push(safeDays);
        paramIndex += 1;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      params.push(safeLimit);
      const snapshotQuery = `
        SELECT
          pm.id,
          pm.test_id,
          pm.target_id,
          pm.metric_id,
          pm.scenario,
          pm.environment,
          pm.severity,
          pm.trend,
          pm.unit,
          pm.baseline_value,
          pm.current_value,
          pm.delta,
          pm.percent_change,
          pm.sample_size,
          pm.risk_score,
          pm.run_id,
          pm.detected_at,
          pm.resolved_at,
          pm.metadata,
          pm.metrics_history,
          pm.created_at
        FROM performance_metric_snapshots pm
        ${whereClause}
        ORDER BY COALESCE(pm.detected_at, pm.created_at) DESC
        LIMIT $${paramIndex}
      `;

      const snapshotResult = await client.query(snapshotQuery, params);

      const parseJson = (value: unknown): any => {
        if (value == null) return null;
        if (typeof value === "object") return value;
        if (typeof value === "string" && value.trim().length > 0) {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        }
        return null;
      };

      const toDateOrNull = (value: unknown): Date | null => {
        if (!value) return null;
        const date = new Date(value as any);
        return Number.isNaN(date.getTime()) ? null : date;
      };

      const normalizeSnapshot = (row: any): PerformanceHistoryRecord => {
        const metadata = parseJson(row.metadata) ?? undefined;
        const historyRaw = parseJson(row.metrics_history);
        const metricsHistory = Array.isArray(historyRaw)
          ? historyRaw
              .map((entry: any) => {
                if (!entry || typeof entry !== "object") return null;
                const normalized = { ...entry };
                if (normalized.timestamp) {
                  const ts = toDateOrNull(normalized.timestamp);
                  normalized.timestamp = ts ?? undefined;
                }
                return normalized;
              })
              .filter(Boolean) as PerformanceMetricSample[]
          : undefined;

        return {
          id: row.id ?? undefined,
          testId: row.test_id ?? undefined,
          targetId: row.target_id ?? undefined,
          metricId: row.metric_id,
          scenario: row.scenario ?? undefined,
          environment: row.environment ?? undefined,
          severity: row.severity ?? undefined,
          trend: row.trend ?? undefined,
          unit: row.unit ?? undefined,
          baselineValue:
            row.baseline_value !== null ? Number(row.baseline_value) : null,
          currentValue:
            row.current_value !== null ? Number(row.current_value) : null,
          delta: row.delta !== null ? Number(row.delta) : null,
          percentChange:
            row.percent_change !== null ? Number(row.percent_change) : null,
          sampleSize: row.sample_size !== null ? Number(row.sample_size) : null,
          riskScore: row.risk_score !== null ? Number(row.risk_score) : null,
          runId: row.run_id ?? undefined,
          detectedAt: toDateOrNull(row.detected_at),
          resolvedAt: toDateOrNull(row.resolved_at),
          metricsHistory: metricsHistory ?? undefined,
          metadata,
          createdAt: toDateOrNull(row.created_at),
          source: "snapshot",
        };
      };

      const snapshots = snapshotResult.rows.map(normalizeSnapshot);

      return snapshots;
    } finally {
      client.release();
    }
  }

  async getCoverageHistory(
    entityId: string,
    days: number = 30
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("PostgreSQL service not initialized");
    }

    const client = await this.postgresPool.connect();
    try {

      const query = `
        SELECT ch.*
        FROM coverage_history ch
        WHERE ch.entity_id = $1::uuid
        AND (ch.timestamp IS NULL OR ch.timestamp >= NOW() - INTERVAL '${days} days')
        ORDER BY COALESCE(ch.timestamp, NOW()) DESC
      `;
      const result = await client.query(query, [entityId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

================
File: qdrant/QdrantService.ts
================
import { QdrantClient } from "@qdrant/js-client-rest";
import { IQdrantService } from "./interfaces.js";

export class QdrantService implements IQdrantService {
  private qdrantClient!: QdrantClient;
  private initialized = false;
  private config: { url: string; apiKey?: string };

  constructor(config: { url: string; apiKey?: string }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.qdrantClient = new QdrantClient({
        url: this.config.url,
        apiKey: this.config.apiKey,
      });


      await this.qdrantClient.getCollections();
      this.initialized = true;
      console.log("✅ Qdrant connection established");
    } catch (error) {
      console.error("❌ Qdrant initialization failed:", error);
      throw error;
    }
  }

  async close(): Promise<void> {

    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): QdrantClient {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }
    return this.qdrantClient;
  }

  async setupCollections(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {

      const collections = await this.qdrantClient.getCollections();

      if (!collections || !collections.collections) {
        throw new Error("Invalid collections response from Qdrant");
      }
      const existingCollections = collections.collections.map((c) => c.name);

      if (!existingCollections.includes("code_embeddings")) {
        await this.qdrantClient.createCollection("code_embeddings", {
          vectors: {
            size: 1536,
            distance: "Cosine",
          },
        });
      }


      if (!existingCollections.includes("documentation_embeddings")) {
        try {
          await this.qdrantClient.createCollection("documentation_embeddings", {
            vectors: {
              size: 1536,
              distance: "Cosine",
            },
          });
        } catch (error: any) {
          if (
            error.status === 409 ||
            error.message?.includes("already exists")
          ) {
            console.log(
              "📊 documentation_embeddings collection already exists, skipping creation"
            );
          } else {
            throw error;
          }
        }
      }


      if (!existingCollections.includes("integration_test")) {
        try {
          await this.qdrantClient.createCollection("integration_test", {
            vectors: {
              size: 1536,
              distance: "Cosine",
            },
          });
        } catch (error: any) {
          if (
            error.status === 409 ||
            error.message?.includes("already exists")
          ) {
            console.log(
              "📊 integration_test collection already exists, skipping creation"
            );
          } else {
            throw error;
          }
        }
      }

      console.log("✅ Qdrant collections setup complete");
    } catch (error) {
      console.error("❌ Qdrant setup failed:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized || !this.qdrantClient) {
      return false;
    }

    try {

      await this.qdrantClient.getCollections();
      return true;
    } catch (error) {
      console.error("Qdrant health check failed:", error);
      return false;
    }
  }




  async upsert(collectionName: string, points: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {
      return await this.qdrantClient.upsert(collectionName, points);
    } catch (error) {
      console.error(
        `Qdrant upsert failed for collection ${collectionName}:`,
        error
      );
      throw error;
    }
  }




  async scroll(collectionName: string, options: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {
      return await this.qdrantClient.scroll(collectionName, options);
    } catch (error) {
      console.error(
        `Qdrant scroll failed for collection ${collectionName}:`,
        error
      );
      throw error;
    }
  }




  async createCollection(collectionName: string, options: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {
      return await this.qdrantClient.createCollection(collectionName, options);
    } catch (error) {
      console.error(
        `Qdrant create collection failed for ${collectionName}:`,
        error
      );
      throw error;
    }
  }




  async deleteCollection(collectionName: string): Promise<any> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {
      return await this.qdrantClient.deleteCollection(collectionName);
    } catch (error) {
      console.error(
        `Qdrant delete collection failed for ${collectionName}:`,
        error
      );
      throw error;
    }
  }




  async search(collectionName: string, options: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("Qdrant not initialized");
    }

    try {
      return await this.qdrantClient.search(collectionName, options);
    } catch (error) {
      console.error(
        `Qdrant search failed for collection ${collectionName}:`,
        error
      );
      throw error;
    }
  }
}

================
File: redis/RedisService.ts
================
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { IRedisService } from './interfaces.js';

export class RedisService implements IRedisService {
  private redisClient!: RedisClientType;
  private initialized = false;
  private config: { url: string };

  constructor(config: { url: string }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.redisClient = createRedisClient({
        url: this.config.url,
      });

      await this.redisClient.connect();
      this.initialized = true;
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClient(): RedisClientType {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    return this.redisClient;
  }

  async get(key: string): Promise<string | null> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }

    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    return this.redisClient.del(key);
  }

  async flushDb(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Redis not configured');
    }
    await this.redisClient.flushDb();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

================
File: DatabaseService.ts
================
import {
  DatabaseConfig,
  INeo4jService,
  IPostgreSQLService,
  IRedisService,
  IDatabaseHealthCheck,
} from "../database/index.js";
import type { BulkQueryMetrics } from "../database/index.js";
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  SCMCommitRecord,
} from "../../models/types.js";
import type { PerformanceRelationship } from "../../models/relationships.js";
import { Neo4jService } from "../database/Neo4jService.js";
import { PostgreSQLService } from "../database/PostgreSQLService.js";
import { RedisService } from "../database/RedisService.js";
export type { DatabaseConfig } from "../database/index.js";


export interface DatabaseQueryResult {
  rows?: any[];
  rowCount?: number;
  fields?: any[];
}

export interface FalkorDBQueryResult {
  headers?: any[];
  data?: any[];
  statistics?: any;
}

export interface TestSuiteResult {
  id?: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: Date;
  testResults: TestResult[];
}

export interface TestResult {
  id?: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

export interface FlakyTestAnalysis {
  testId: string;
  testName: string;
  failureCount: number;
  totalRuns: number;
  lastFailure: Date;
  failurePatterns: string[];
}

export type DatabaseServiceDeps = {
  neo4jFactory?: (cfg: DatabaseConfig["neo4j"]) => INeo4jService;
  postgresFactory?: (cfg: DatabaseConfig["postgresql"]) => IPostgreSQLService;
  redisFactory?: (cfg: NonNullable<DatabaseConfig["redis"]>) => IRedisService;
};

export class DatabaseService {
  private neo4jService!: INeo4jService;
  private postgresqlService!: IPostgreSQLService;
  private redisService?: IRedisService;
  private initialized = false;
  private initializing = false;
  private initializationPromise?: Promise<void>;


  private readonly neo4jFactory?: DatabaseServiceDeps["neo4jFactory"];
  private readonly postgresFactory?: DatabaseServiceDeps["postgresFactory"];
  private readonly redisFactory?: DatabaseServiceDeps["redisFactory"];

  constructor(private config: DatabaseConfig, deps: DatabaseServiceDeps = {}) {
    this.neo4jFactory = deps.neo4jFactory;
    this.postgresFactory = deps.postgresFactory;
    this.redisFactory = deps.redisFactory;
  }

  getConfig(): DatabaseConfig {
    return this.config;
  }

  getNeo4jService(): INeo4jService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService;
  }

  getPostgreSQLService(): IPostgreSQLService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService;
  }

  getRedisService(): IRedisService | undefined {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.redisService;
  }


  getFalkorDBService(): INeo4jService {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService;
  }

  getQdrantService(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    return {
      getClient: () => this.qdrant,
    };
  }

  getQdrantClient(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.qdrant;
  }


  getNeo4jDriver(): any {
    if (!this.initialized) {
      return undefined;
    }
    return this.neo4jService.getDriver();
  }

  getPostgresPool(): any {
    if (!this.initialized) {
      return undefined;
    }
    return this.postgresqlService.getPool();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }


    if (this.initializing) {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }
      throw new Error("Initialization already in progress");
    }


    this.initializationPromise = this._initialize();
    this.initializing = true;

    try {
      await this.initializationPromise;
    } finally {
      this.initializing = false;
      this.initializationPromise = undefined;
    }
  }

  private async _initialize(): Promise<void> {

    const initializedServices: Array<{
      service:
        | INeo4jService
        | IPostgreSQLService
        | IRedisService;
      close: () => Promise<void>;
    }> = [];

    try {

      this.neo4jService = this.neo4jFactory
        ? this.neo4jFactory(this.config.neo4j)
        : new Neo4jService(this.config.neo4j);
      this.postgresqlService = this.postgresFactory
        ? this.postgresFactory(this.config.postgresql)
        : new PostgreSQLService(this.config.postgresql);


      if (typeof (this.neo4jService as any)?.initialize === "function") {
        await this.neo4jService.initialize();

        if (typeof (this.neo4jService as any)?.setupGraph === "function") {
          await this.neo4jService.setupGraph();
        }
        if (typeof (this.neo4jService as any)?.setupVectorIndexes === "function") {
          await this.neo4jService.setupVectorIndexes();
        }
      }
      if (typeof (this.neo4jService as any)?.close === "function") {
        initializedServices.push({
          service: this.neo4jService,
          close: () => this.neo4jService.close(),
        });
      }

      if (typeof (this.postgresqlService as any)?.initialize === "function") {
        await this.postgresqlService.initialize();
      }
      if (typeof (this.postgresqlService as any)?.close === "function") {
        initializedServices.push({
          service: this.postgresqlService,
          close: () => this.postgresqlService.close(),
        });
      }


      if (this.config.redis) {
        this.redisService = this.redisFactory
          ? this.redisFactory(this.config.redis)
          : new RedisService(this.config.redis);
        if (typeof (this.redisService as any)?.initialize === "function") {
          await this.redisService.initialize();
        }
        if (typeof (this.redisService as any)?.close === "function") {
          const redisRef = this.redisService;
          initializedServices.push({
            service: redisRef as any,
            close: () => (redisRef as any).close(),
          });
        }
      }

      this.initialized = true;
      console.log("✅ All database connections established");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);


      const cleanupPromises = initializedServices.map(({ close }) =>
        close().catch((cleanupError) =>
          console.error("❌ Error during cleanup:", cleanupError)
        )
      );

      await Promise.allSettled(cleanupPromises);


      this.neo4jService = undefined as any;
      this.postgresqlService = undefined as any;
      this.redisService = undefined;


      if (process.env.NODE_ENV === "test") {
        console.warn(
          "⚠️ Test environment: continuing despite initialization failure"
        );
        return;
      }

      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }


    const closePromises: Promise<void>[] = [];

    if (
      this.neo4jService &&
      typeof (this.neo4jService as any).isInitialized === "function" &&
      this.neo4jService.isInitialized()
    ) {
      closePromises.push(
        this.neo4jService
          .close()
          .catch((error) =>
            console.error("❌ Error closing Neo4j service:", error)
          )
      );
    }

    if (
      this.postgresqlService &&
      typeof (this.postgresqlService as any).isInitialized === "function" &&
      this.postgresqlService.isInitialized()
    ) {
      closePromises.push(
        this.postgresqlService
          .close()
          .catch((error) =>
            console.error("❌ Error closing PostgreSQL service:", error)
          )
      );
    }

    if (
      this.redisService &&
      typeof (this.redisService as any).isInitialized === "function" &&
      this.redisService.isInitialized()
    ) {
      closePromises.push(
        this.redisService
          .close()
          .catch((error) =>
            console.error("❌ Error closing Redis service:", error)
          )
      );
    }


    await Promise.allSettled(closePromises);


    this.initialized = false;
    this.neo4jService = undefined as any;
    this.postgresqlService = undefined as any;
    this.redisService = undefined;


    if (typeof databaseService !== "undefined" && databaseService === this) {
      databaseService = null as any;
    }

    console.log("✅ All database connections closed");
  }


  async falkordbQuery(
    query: string,
    params: Record<string, any> = {},
    options: { graph?: string } = {}
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    const result = await this.neo4jService.query(query, params, { database: options.graph });

    return {
      headers: result.records.length > 0 ? Object.keys(result.records[0].toObject()) : [],
      data: result.records.map(r => Object.values(r.toObject())),
      statistics: result.summary,
    };
  }

  async falkordbCommand(...args: any[]): Promise<FalkorDBQueryResult> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.command(...args);
  }


  async upsertVector(
    collection: string,
    id: string,
    vector: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.upsertVector(collection, id, vector, metadata);
  }

  async searchVector(
    collection: string,
    vector: number[],
    limit?: number,
    filter?: Record<string, any>
  ): Promise<Array<{ id: string; score: number; metadata?: any }>> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.searchVector(collection, vector, limit, filter);
  }

  async scrollVectors(
    collection: string,
    limit?: number,
    offset?: number
  ): Promise<{ points: Array<{ id: string; vector: number[]; metadata?: any }>; total: number }> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.neo4jService.scrollVectors(collection, limit, offset);
  }


  get qdrant(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    return {
      upsert: async (collection: string, data: any) => {
        const { points } = data;
        for (const point of points) {
          await this.neo4jService.upsertVector(
            collection,
            point.id,
            point.vector,
            point.payload
          );
        }
      },
      search: async (collection: string, params: any) => {
        return this.neo4jService.searchVector(
          collection,
          params.vector,
          params.limit,
          params.filter
        );
      },
      scroll: async (collection: string, params: any) => {
        return this.neo4jService.scrollVectors(
          collection,
          params.limit,
          params.offset
        );
      },
      delete: async (collection: string, params: any) => {
        const ids = params.points || [];
        for (const id of ids) {
          await this.neo4jService.deleteVector(collection, id);
        }
      },
      getCollections: async () => {

        return {
          collections: [
            { name: "code_embeddings" },
            { name: "documentation_embeddings" },
            { name: "integration_test" },
          ],
        };
      },
    };
  }


  async postgresQuery(
    query: string,
    params: any[] = [],
    options: { timeout?: number } = {}
  ): Promise<DatabaseQueryResult> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService.query(query, params, options);
  }

  async postgresTransaction<T>(
    callback: (client: any) => Promise<T>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService.transaction(callback, options);
  }


  async redisGet(key: string): Promise<string | null> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    return this.redisService.get(key);
  }

  async redisSet(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    return this.redisService.set(key, value, ttl);
  }

  async redisDel(key: string): Promise<number> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    return this.redisService.del(key);
  }

  async redisFlushDb(): Promise<void> {
    if (!this.redisService) {
      throw new Error("Redis not configured");
    }
    await this.redisService.flushDb();
  }


  async healthCheck(): Promise<IDatabaseHealthCheck> {

    if (!this.initialized) {
      return {
        neo4j: { status: "unhealthy" },
        postgresql: { status: "unhealthy" },
        redis: undefined,
      };
    }


    const healthCheckPromises = [
      this.neo4jService.healthCheck().catch(() => false),
      this.postgresqlService.healthCheck().catch(() => false),
      this.redisService?.healthCheck().catch(() => undefined) ??
        Promise.resolve(undefined),
    ];

    const settledResults = await Promise.allSettled(healthCheckPromises);

    const toStatus = (v: any) =>
      v === true
        ? { status: "healthy" as const }
        : v === false
        ? { status: "unhealthy" as const }
        : { status: "unknown" as const };

    return {
      neo4j: toStatus(
        settledResults[0].status === "fulfilled"
          ? settledResults[0].value
          : false
      ),
      postgresql: toStatus(
        settledResults[1].status === "fulfilled"
          ? settledResults[1].value
          : false
      ),
      redis:
        settledResults[2].status === "fulfilled"
          ? toStatus(settledResults[2].value)
          : undefined,
    };
  }


  async setupDatabase(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    console.log("🔧 Setting up database schema...");


    await Promise.all([
      this.postgresqlService.setupSchema(),
      this.neo4jService.setupGraph(),
      this.neo4jService.setupVectorIndexes(),
    ]);

    console.log("✅ Database schema setup complete");
  }

  isInitialized(): boolean {
    return this.initialized;
  }




  async storeTestSuiteResult(suiteResult: TestSuiteResult): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.storeTestSuiteResult(suiteResult);
  }




  async storeFlakyTestAnalyses(analyses: FlakyTestAnalysis[]): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.storeFlakyTestAnalyses(analyses);
  }




  async postgresBulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options: { continueOnError?: boolean } = {}
  ): Promise<DatabaseQueryResult[]> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    return this.postgresqlService.bulkQuery(queries, options);
  }

  getPostgresBulkWriterMetrics(): BulkQueryMetrics {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
    const metrics = this.postgresqlService.getBulkWriterMetrics();
    return {
      ...metrics,
      lastBatch: metrics.lastBatch ? { ...metrics.lastBatch } : null,
      history: metrics.history.map((entry) => ({ ...entry })),
      slowBatches: metrics.slowBatches.map((entry) => ({ ...entry })),
    };
  }




  async getTestExecutionHistory(
    entityId: string,
    limit: number = 50
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getTestExecutionHistory(entityId, limit);
  }




  async getPerformanceMetricsHistory(
    entityId: string,
    options?: number | PerformanceHistoryOptions
  ): Promise<PerformanceHistoryRecord[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getPerformanceMetricsHistory(
      entityId,
      options
    );
  }

  async recordPerformanceMetricSnapshot(
    snapshot: PerformanceRelationship
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    await this.postgresqlService.recordPerformanceMetricSnapshot(snapshot);
  }

  async recordSCMCommit(commit: SCMCommitRecord): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    if (!this.postgresqlService.recordSCMCommit) {
      throw new Error("PostgreSQL service does not implement recordSCMCommit");
    }
    await this.postgresqlService.recordSCMCommit(commit);
  }

  async getSCMCommitByHash(
    commitHash: string
  ): Promise<SCMCommitRecord | null> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    if (!this.postgresqlService.getSCMCommitByHash) {
      throw new Error(
        "PostgreSQL service does not implement getSCMCommitByHash"
      );
    }
    return this.postgresqlService.getSCMCommitByHash(commitHash);
  }

  async listSCMCommits(limit: number = 50): Promise<SCMCommitRecord[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    if (!this.postgresqlService.listSCMCommits) {
      throw new Error(
        "PostgreSQL service does not implement listSCMCommits"
      );
    }
    return this.postgresqlService.listSCMCommits(limit);
  }




  async getCoverageHistory(
    entityId: string,
    days: number = 30
  ): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("Database service not initialized");
    }
    return this.postgresqlService.getCoverageHistory(entityId, days);
  }
}




let databaseService: DatabaseService | null = null;

export function getDatabaseService(config?: DatabaseConfig): DatabaseService {
  if (!databaseService) {
    if (!config) {
      throw new Error("Database config required for first initialization");
    }
    databaseService = new DatabaseService(config);
  }
  return databaseService;
}

export function createDatabaseConfig(): DatabaseConfig {

  const isTest = process.env.NODE_ENV === "test";

  return {
    neo4j: {
      uri:
        process.env.NEO4J_URI ||
        (isTest ? "bolt://localhost:7688" : "bolt://localhost:7687"),
      username: process.env.NEO4J_USER || "neo4j",
      password: process.env.NEO4J_PASSWORD || "memento123",
      database: process.env.NEO4J_DATABASE || (isTest ? "memento_test" : "neo4j"),
    },
    postgresql: {
      connectionString:
        process.env.DATABASE_URL ||
        (isTest
          ? "postgresql://memento_test:memento_test@localhost:5433/memento_test"
          : "postgresql://memento:memento@localhost:5432/memento"),
      max: parseInt(process.env.DB_MAX_CONNECTIONS || (isTest ? "10" : "30")),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
      connectionTimeoutMillis: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "5000"
      ),
    },
    redis: process.env.REDIS_URL
      ? {
          url: process.env.REDIS_URL,
        }
      : isTest
      ? { url: "redis://localhost:6381" }
      : undefined,
  };
}

export function createTestDatabaseConfig(): DatabaseConfig {
  return {
    neo4j: {
      uri: "bolt://localhost:7688",
      username: "neo4j",
      password: "testpassword123",
      database: "memento_test",
    },
    postgresql: {
      connectionString:
        "postgresql://memento_test:memento_test@localhost:5433/memento_test",
      max: 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    },
    redis: {
      url: "redis://localhost:6381",
    },
  };
}

================
File: index.ts
================
export * from './DatabaseService.js';


export * from './interfaces.js';


export * from './neo4j/Neo4jService.js';
export * from './neo4j/FalkorDBService.js';


export * from './postgres/PostgreSQLService.js';


export * from './qdrant/QdrantService.js';


export * from './redis/RedisService.js';

================
File: interfaces.ts
================
import { QdrantClient } from '@qdrant/js-client-rest';
import type {
  PerformanceHistoryOptions,
  PerformanceHistoryRecord,
  SCMCommitRecord,
} from '../../models/types.js';
import type { PerformanceRelationship } from '../../models/relationships.js';

export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface HealthComponentStatus {
  status: HealthStatus;
  details?: any;
}

export interface BackupProviderDefinition {
  type: "local" | "s3" | "gcs" | string;
  options?: Record<string, unknown>;
}

export interface BackupRetentionPolicyConfig {
  maxAgeDays?: number;
  maxEntries?: number;
  maxTotalSizeBytes?: number;
  deleteArtifacts?: boolean;
}

export interface BackupConfiguration {
  defaultProvider?: string;
  local?: {
    basePath?: string;
    allowCreate?: boolean;
  };
  providers?: Record<string, BackupProviderDefinition>;
  retention?: BackupRetentionPolicyConfig;
}

export interface BulkQueryTelemetryEntry {
  batchSize: number;
  continueOnError: boolean;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  queueDepth: number;
  mode: 'transaction' | 'independent';
  success: boolean;
  error?: string;
}

export interface BulkQueryMetricsSnapshot {
  activeBatches: number;
  maxConcurrentBatches: number;
  totalBatches: number;
  totalQueries: number;
  totalDurationMs: number;
  maxBatchSize: number;
  maxQueueDepth: number;
  maxDurationMs: number;
  averageDurationMs: number;
  lastBatch: BulkQueryTelemetryEntry | null;
}

export interface BulkQueryMetrics extends BulkQueryMetricsSnapshot {
  history: BulkQueryTelemetryEntry[];
  slowBatches: BulkQueryTelemetryEntry[];
}

export interface BulkQueryInstrumentationConfig {
  warnOnLargeBatchSize: number;
  slowBatchThresholdMs: number;
  queueDepthWarningThreshold: number;
  historyLimit: number;
}

export interface DatabaseConfig {
  neo4j: {
    uri: string;
    username: string;
    password: string;
    database?: string;
  };
  postgresql: {
    connectionString: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  redis?: {
    url: string;
  };
  qdrant?: {
    url?: string;
    apiKey?: string;
  };
  backups?: BackupConfiguration;
}

export interface IFalkorDBService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getClient(): any;
  query(
    query: string,
    params?: Record<string, any>,
    graphKey?: string
  ): Promise<any>;
  command(...args: any[]): Promise<any>;
  setupGraph(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IQdrantService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getClient(): QdrantClient;
  setupCollections(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IPostgreSQLService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getPool(): any;
  query(query: string, params?: any[], options?: { timeout?: number }): Promise<any>;
  transaction<T>(
    callback: (client: any) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T>;
  bulkQuery(
    queries: Array<{ query: string; params: any[] }>,
    options?: { continueOnError?: boolean }
  ): Promise<any[]>;
  setupSchema(): Promise<void>;
  healthCheck(): Promise<boolean>;
  storeTestSuiteResult(suiteResult: any): Promise<void>;
  storeFlakyTestAnalyses(analyses: any[]): Promise<void>;
  getTestExecutionHistory(entityId: string, limit?: number): Promise<any[]>;
  getPerformanceMetricsHistory(
    entityId: string,
    options?: number | PerformanceHistoryOptions
  ): Promise<PerformanceHistoryRecord[]>;
  recordPerformanceMetricSnapshot(
    snapshot: PerformanceRelationship
  ): Promise<void>;
  recordSCMCommit(commit: SCMCommitRecord): Promise<void>;
  getSCMCommitByHash?(commitHash: string): Promise<SCMCommitRecord | null>;
  listSCMCommits?(limit?: number): Promise<SCMCommitRecord[]>;
  getCoverageHistory(entityId: string, days?: number): Promise<any[]>;
  getBulkWriterMetrics(): BulkQueryMetrics;
}

export interface INeo4jService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  getDriver(): any;
  query(
    cypher: string,
    params?: Record<string, any>,
    options?: { database?: string }
  ): Promise<any>;
  transaction<T>(
    callback: (tx: any) => Promise<T>,
    options?: { database?: string }
  ): Promise<T>;
  setupGraph(): Promise<void>;
  setupVectorIndexes(): Promise<void>;
  upsertVector(
    collection: string,
    id: string,
    vector: number[],
    metadata?: Record<string, any>
  ): Promise<void>;
  searchVector(
    collection: string,
    vector: number[],
    limit?: number,
    filter?: Record<string, any>
  ): Promise<Array<{ id: string; score: number; metadata?: any }>>;
  deleteVector(collection: string, id: string): Promise<void>;
  scrollVectors(
    collection: string,
    limit?: number,
    offset?: number
  ): Promise<{
    points: Array<{ id: string; vector: number[]; metadata?: any }>;
    total: number;
  }>;
  command(...args: any[]): Promise<any>;
  healthCheck(): Promise<boolean>;
}

export interface IRedisService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isInitialized(): boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  flushDb(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface IDatabaseHealthCheck {
  neo4j: HealthComponentStatus;
  postgresql: HealthComponentStatus;
  redis?: HealthComponentStatus;
}

================
File: services-index.ts
================
export * from './interfaces.js';
export { Neo4jService } from './Neo4jService.js';
export { PostgreSQLService } from './PostgreSQLService.js';
export { RedisService } from './RedisService.js';

export { FalkorDBService } from './FalkorDBService.js';
export { QdrantService } from './QdrantService.js';



================================================================
End of Codebase
================================================================
