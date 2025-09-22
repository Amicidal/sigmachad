import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { KnowledgeGraphService } from "../knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "../core/DatabaseService.js";
import { noiseConfig } from "../../config/noise.js";
import { RelationshipType } from "../../models/relationships.js";
import type {
  CreateSpecRequest,
  CreateSpecResponse,
  GetSpecResponse,
  ListSpecsParams,
  UpdateSpecRequest,
  ValidationIssue,
} from "../../models/types.js";
import type { Spec } from "../../models/entities.js";

export interface SpecListResult {
  specs: Spec[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface SpecValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
}

export class SpecService {
  constructor(
    private readonly kgService: KnowledgeGraphService,
    private readonly dbService: DatabaseService
  ) {}

  async createSpec(params: CreateSpecRequest): Promise<CreateSpecResponse> {
    const spec = this.buildSpecEntity({
      id: uuidv4(),
      title: params.title,
      description: params.description,
      acceptanceCriteria: params.acceptanceCriteria,
      priority: params.priority ?? "medium",
      assignee: params.assignee,
      tags: params.tags ?? [],
    });

    const validationResults = this.validateSpec(spec);

    await this.dbService.postgresQuery(
      `INSERT INTO documents (id, type, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        spec.id,
        "spec",
        JSON.stringify(this.serializeSpec(spec)),
        spec.created.toISOString(),
        spec.updated.toISOString(),
      ]
    );

    await this.kgService.createEntity(spec);
    await this.refreshSpecRelationships(spec);

    return {
      specId: spec.id,
      spec,
      validationResults,
    };
  }

  async upsertSpec(specInput: Spec): Promise<{ spec: Spec; created: boolean }> {
    const now = new Date();
    const existing = await this.loadSpecFromDatabase(specInput.id);

    const spec = this.normalizeSpec({
      ...specInput,
      created: existing?.created ?? specInput.created ?? now,
      updated: now,
      lastModified: now,
    });

    const validation = this.validateSpec(spec);
    if (!validation.isValid) {
      const blocking = validation.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => issue.message)
        .join("; ");
      throw new Error(blocking || "Specification validation failed");
    }

    await this.dbService.postgresQuery(
      `INSERT INTO documents (id, type, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         content = EXCLUDED.content,
         updated_at = EXCLUDED.updated_at`,
      [
        spec.id,
        "spec",
        JSON.stringify(this.serializeSpec(spec)),
        spec.created.toISOString(),
        spec.updated.toISOString(),
      ]
    );

    if (existing) {
      await this.kgService.updateEntity(spec.id, spec);
    } else {
      await this.kgService.createEntity(spec);
    }

    await this.refreshSpecRelationships(spec);

    return { spec, created: !existing };
  }

  async getSpec(specId: string): Promise<GetSpecResponse> {
    const spec = await this.loadSpec(specId);

    const testCoverage = {
      entityId: spec.id,
      overallCoverage: {
        lines: 0,
        branches: 0,
        functions: 0,
        statements: 0,
      },
      testBreakdown: {
        unitTests: { lines: 0, branches: 0, functions: 0, statements: 0 },
        integrationTests: { lines: 0, branches: 0, functions: 0, statements: 0 },
        e2eTests: { lines: 0, branches: 0, functions: 0, statements: 0 },
      },
      uncoveredLines: [] as number[],
      uncoveredBranches: [] as number[],
      testCases: [] as {
        testId: string;
        testName: string;
        covers: string[];
      }[],
    };

    return {
      spec,
      relatedSpecs: [],
      affectedEntities: [],
      testCoverage,
    };
  }

  async updateSpec(
    specId: string,
    updates: UpdateSpecRequest
  ): Promise<Spec> {
    const existing = await this.loadSpec(specId);

    const updatedSpec = this.normalizeSpec({
      ...existing,
      ...updates,
      id: specId,
      lastModified: new Date(),
      updated: new Date(),
    });

    const validation = this.validateSpec(updatedSpec);
    if (!validation.isValid) {
      const blocking = validation.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => issue.message)
        .join("; ");
      throw new Error(blocking || "Specification validation failed");
    }

    await this.dbService.postgresQuery(
      `UPDATE documents
         SET content = $1, updated_at = $2
       WHERE id = $3 AND type = $4`,
      [
        JSON.stringify(this.serializeSpec(updatedSpec)),
        updatedSpec.updated.toISOString(),
        specId,
        "spec",
      ]
    );

    await this.kgService.updateEntity(updatedSpec.id, updatedSpec, {
      skipEmbedding: false,
    });

    await this.refreshSpecRelationships(updatedSpec);

    return updatedSpec;
  }

  async listSpecs(params: ListSpecsParams = {}): Promise<SpecListResult> {
    const filters: string[] = ["type = $1"];
    const values: any[] = ["spec"];
    let nextIndex = 2;

    if (params.status && params.status.length > 0) {
      filters.push(`content->>'status' = ANY($${nextIndex})`);
      values.push(params.status);
      nextIndex++;
    }

    if (params.priority && params.priority.length > 0) {
      filters.push(`content->>'priority' = ANY($${nextIndex})`);
      values.push(params.priority);
      nextIndex++;
    }

    if (params.assignee) {
      filters.push(`content->>'assignee' = $${nextIndex}`);
      values.push(params.assignee);
      nextIndex++;
    }

    if (params.tags && params.tags.length > 0) {
      filters.push(`content->'tags' @> $${nextIndex}::jsonb`);
      values.push(JSON.stringify(params.tags));
      nextIndex++;
    }

    if (params.search) {
      filters.push(
        `(content->>'title' ILIKE $${nextIndex} OR content->>'description' ILIKE $${nextIndex})`
      );
      values.push(`%${params.search}%`);
      nextIndex++;
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const allowedSortFields = new Set([
      "created",
      "updated",
      "priority",
      "status",
      "title",
    ]);
    const sortBy = params.sortBy && allowedSortFields.has(params.sortBy)
      ? params.sortBy
      : "created";
    const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";

    const limit = Math.max(1, Math.min(params.limit ?? 20, 100));
    const offset = Math.max(0, params.offset ?? 0);

    const listQuery = `
      SELECT content
      FROM documents
      ${whereClause}
      ORDER BY content->>'${sortBy}' ${sortOrder}
      LIMIT $${nextIndex}
      OFFSET $${nextIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM documents
      ${whereClause}
    `;

    const listValues = [...values, limit, offset];

    const rows = this.extractRows(
      await this.dbService.postgresQuery(listQuery, listValues)
    );
    const countRows = this.extractRows(
      await this.dbService.postgresQuery(countQuery, values)
    );

    const total = countRows.length > 0 ? Number(countRows[0].total ?? countRows[0].count ?? 0) : 0;

    const specs = rows.map((row) => this.normalizeSpec(JSON.parse(row.content)));

    return {
      specs,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  validateSpec(spec: Spec): SpecValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    if (!spec.title || spec.title.trim().length === 0) {
      issues.push({
        file: spec.path,
        line: 0,
        column: 0,
        rule: "required-title",
        severity: "error",
        message: "Title is required",
      });
    } else if (spec.title.trim().length < 5) {
      issues.push({
        file: spec.path,
        line: 0,
        column: 0,
        rule: "short-title",
        severity: "warning",
        message: "Title should be at least 5 characters",
        suggestion: "Provide a more descriptive specification title",
      });
    }

    if (!spec.description || spec.description.trim().length === 0) {
      issues.push({
        file: spec.path,
        line: 0,
        column: 0,
        rule: "required-description",
        severity: "error",
        message: "Description is required",
      });
    } else if (spec.description.trim().length < 20) {
      issues.push({
        file: spec.path,
        line: 0,
        column: 0,
        rule: "short-description",
        severity: "warning",
        message: "Description should include at least 20 characters",
        suggestion: "Add more implementation context or constraints",
      });
    }

    if (!Array.isArray(spec.acceptanceCriteria) || spec.acceptanceCriteria.length === 0) {
      issues.push({
        file: spec.path,
        line: 0,
        column: 0,
        rule: "missing-acceptance",
        severity: "error",
        message: "At least one acceptance criterion is required",
      });
    } else {
      spec.acceptanceCriteria.forEach((criterion, index) => {
        if (!criterion || criterion.trim().length < 10) {
          issues.push({
            file: spec.path,
            line: index,
            column: 0,
            rule: "short-criterion",
            severity: "warning",
            message: `Acceptance criterion ${index + 1} should be more specific`,
            suggestion: "Clarify the expected user-visible behaviour",
          });
        }
      });

      if (spec.acceptanceCriteria.length < 3) {
        suggestions.push(
          "Consider adding additional acceptance criteria for broader coverage"
        );
      }
    }

    return {
      isValid: !issues.some((issue) => issue.severity === "error"),
      issues,
      suggestions,
    };
  }

  validateDraft(specDraft: Record<string, any>): SpecValidationResult {
    const spec = this.normalizeSpec({
      id: String(specDraft.id ?? `draft_${uuidv4()}`),
      title: String(specDraft.title ?? ""),
      description: String(specDraft.description ?? ""),
      acceptanceCriteria: Array.isArray(specDraft.acceptanceCriteria)
        ? specDraft.acceptanceCriteria.map((item: any) => String(item ?? ""))
        : [],
      priority: (specDraft.priority as Spec["priority"]) || "medium",
      assignee: specDraft.assignee ? String(specDraft.assignee) : undefined,
      tags: Array.isArray(specDraft.tags)
        ? specDraft.tags.map((tag: any) => String(tag ?? ""))
        : [],
      created: specDraft.created ? new Date(specDraft.created) : new Date(),
      updated: new Date(),
      lastModified: new Date(),
      hash: typeof specDraft.hash === "string" ? specDraft.hash : undefined,
    });

    return this.validateSpec(spec);
  }

  private async loadSpec(specId: string): Promise<Spec> {
    const spec = await this.loadSpecFromDatabase(specId);
    if (!spec) {
      throw new Error(`Specification ${specId} not found`);
    }
    return spec;
  }

  private async loadSpecFromDatabase(specId: string): Promise<Spec | null> {
    const rows = this.extractRows(
      await this.dbService.postgresQuery(
        "SELECT content FROM documents WHERE id = $1 AND type = $2",
        [specId, "spec"]
      )
    );

    if (rows.length === 0) {
      return null;
    }

    return this.normalizeSpec(JSON.parse(rows[0].content));
  }

  private buildSpecEntity(partial: Partial<Spec> & { id: string }): Spec {
    const now = new Date();
    return this.normalizeSpec({
      id: partial.id,
      type: "spec",
      path: partial.path ?? `specs/${partial.id}`,
      hash: partial.hash,
      language: partial.language ?? "text",
      lastModified: partial.lastModified ?? now,
      created: partial.created ?? now,
      updated: partial.updated ?? now,
      title: partial.title ?? "",
      description: partial.description ?? "",
      acceptanceCriteria: partial.acceptanceCriteria ?? [],
      status: partial.status ?? "draft",
      priority: partial.priority ?? "medium",
      assignee: partial.assignee,
      tags: partial.tags ?? [],
      metadata: partial.metadata ?? {},
    } as Spec);
  }

  private normalizeSpec(input: Partial<Spec> & { id: string }): Spec {
    const created = this.ensureDate(input.created ?? new Date());
    const updated = this.ensureDate(input.updated ?? new Date());
    const lastModified = this.ensureDate(input.lastModified ?? updated);

    const spec: Spec = {
      id: input.id,
      type: "spec",
      path: input.path ?? `specs/${input.id}`,
      hash: input.hash ?? this.computeHash(input),
      language: input.language ?? "text",
      lastModified,
      created,
      updated,
      title: input.title ?? "",
      description: input.description ?? "",
      acceptanceCriteria: Array.isArray(input.acceptanceCriteria)
        ? input.acceptanceCriteria.map((item) => String(item))
        : [],
      status: input.status ?? "draft",
      priority: input.priority ?? "medium",
      assignee: input.assignee,
      tags: Array.isArray(input.tags)
        ? input.tags.map((tag) => String(tag))
        : [],
      metadata: input.metadata ?? {},
    };

    return spec;
  }

  private serializeSpec(spec: Spec): Record<string, any> {
    return {
      ...spec,
      created: spec.created.toISOString(),
      updated: spec.updated.toISOString(),
      lastModified: spec.lastModified.toISOString(),
    };
  }

  private ensureDate(value: Date | string): Date {
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private computeHash(spec: Partial<Spec>): string {
    const components = [
      spec.title ?? "",
      spec.description ?? "",
      ...(Array.isArray(spec.acceptanceCriteria)
        ? spec.acceptanceCriteria
        : []),
    ];
    return crypto
      .createHash("sha1")
      .update(components.join("|"))
      .digest("hex");
  }

  private extractRows(result: any): Array<Record<string, any>> {
    if (!result) {
      return [];
    }
    if (Array.isArray(result)) {
      return result as Array<Record<string, any>>;
    }
    if (Array.isArray(result.rows)) {
      return result.rows as Array<Record<string, any>>;
    }
    return [];
  }

  private async refreshSpecRelationships(spec: Spec): Promise<void> {
    const nowISO = new Date().toISOString();
    const tokensFromCriteria = this.extractCandidateNames(spec.acceptanceCriteria);
    const tokensFromDescription = this.extractCandidateNames([spec.description]);

    const createEdges = async (
      tokens: string[],
      relationshipType: RelationshipType,
      source: string,
      limit: number
    ) => {
      const seenTargets = new Set<string>();
      for (const token of tokens.slice(0, limit)) {
        try {
          const candidates = await this.lookupSymbolCandidates(token);
          for (const candidate of candidates) {
            if ((candidate as any)?.type !== "symbol") continue;
            if (!candidate?.id || seenTargets.has(candidate.id)) continue;
            seenTargets.add(candidate.id);
            const confidence = this.estimateConfidence(
              (candidate as any).name ?? token
            );
            if (confidence < noiseConfig.MIN_INFERRED_CONFIDENCE) continue;
            await this.kgService.createRelationship({
              id: `rel_${spec.id}_${candidate.id}_${relationshipType}`,
              fromEntityId: spec.id,
              toEntityId: candidate.id,
              type: relationshipType,
              created: new Date(nowISO),
              lastModified: new Date(nowISO),
              version: 1,
              metadata: {
                inferred: true,
                confidence,
                source,
              },
            } as any);
          }
        } catch (error) {
          console.warn(
            `Failed to create ${relationshipType} relationship for token ${token}:`,
            error
          );
        }
      }
    };

    await createEdges(
      tokensFromCriteria,
      RelationshipType.REQUIRES,
      "spec-acceptance",
      25
    );
    await createEdges(
      tokensFromDescription,
      RelationshipType.IMPACTS,
      "spec-description",
      25
    );
  }

  private extractCandidateNames(content: string[] | string | undefined): string[] {
    if (!content) return [];
    const text = Array.isArray(content) ? content.join(" ") : content;
    const matches = text.match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) || [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const token of matches) {
      const key = token.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      ordered.push(token);
    }
    return ordered;
  }

  private estimateConfidence(symbolName: string): number {
    const len = symbolName.length;
    const base = noiseConfig.DOC_LINK_BASE_CONF;
    const step = noiseConfig.DOC_LINK_STEP_CONF;
    const bonus = Math.max(0, len - noiseConfig.AST_MIN_NAME_LENGTH) * step;
    return Math.min(1, base + bonus);
  }

  private async lookupSymbolCandidates(token: string): Promise<any[]> {
    if (typeof (this.kgService as any).findSymbolsByName === "function") {
      return (this.kgService as any).findSymbolsByName(token, 3);
    }

    try {
      return await this.kgService.search({
        query: token,
        searchType: "structural",
        entityTypes: ["function", "class", "interface"],
        limit: 3,
      });
    } catch (error) {
      console.warn("Fallback symbol search failed:", error);
      return [];
    }
  }
}
