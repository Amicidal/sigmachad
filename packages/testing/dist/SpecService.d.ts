import { KnowledgeGraphService } from "@memento/knowledge";
import { DatabaseService } from "@memento/database";
import type { CreateSpecRequest, CreateSpecResponse, GetSpecResponse, ListSpecsParams, UpdateSpecRequest, ValidationIssue } from "@memento/core";
import type { Spec } from "@memento/core";
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
export declare class SpecService {
    private readonly kgService;
    private readonly dbService;
    constructor(kgService: KnowledgeGraphService, dbService: DatabaseService);
    createSpec(params: CreateSpecRequest): Promise<CreateSpecResponse>;
    upsertSpec(specInput: Spec): Promise<{
        spec: Spec;
        created: boolean;
    }>;
    getSpec(specId: string): Promise<GetSpecResponse>;
    updateSpec(specId: string, updates: UpdateSpecRequest): Promise<Spec>;
    listSpecs(params?: ListSpecsParams): Promise<SpecListResult>;
    validateSpec(spec: Spec): SpecValidationResult;
    validateDraft(specDraft: Record<string, any>): SpecValidationResult;
    private loadSpec;
    private loadSpecFromDatabase;
    private buildSpecEntity;
    private normalizeSpec;
    private serializeSpec;
    private ensureDate;
    private computeHash;
    private extractRows;
    private refreshSpecRelationships;
    private extractCandidateNames;
    private estimateConfidence;
    private lookupSymbolCandidates;
}
//# sourceMappingURL=SpecService.d.ts.map