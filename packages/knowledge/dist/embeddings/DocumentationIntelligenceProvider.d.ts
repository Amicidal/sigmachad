import { DocumentationIntent, DocumentationNodeType, DocumentationSource } from "../../models/relationships.js";
export interface DocumentationIntelligenceRequest {
    content: string;
    format: "markdown" | "plaintext" | "rst" | "asciidoc";
    filePath?: string;
    docTypeHint?: DocumentationNodeType;
    metadata?: Record<string, unknown>;
}
export interface DocumentationSignals {
    businessDomains: string[];
    stakeholders: string[];
    technologies: string[];
    docIntent?: DocumentationIntent;
    docSource?: DocumentationSource;
    docLocale?: string;
    rawModelResponse?: string;
    confidence?: number;
}
export interface DocumentationIntelligenceProvider {
    extractSignals(request: DocumentationIntelligenceRequest): Promise<DocumentationSignals>;
    getExtractionPrompt?(): string;
}
export declare const LLM_EXTRACTION_PROMPT = "You are an expert technical documentation analyst assisting a knowledge graph ingestion pipeline.\nGiven a single document, produce a strict JSON object with the following keys:\n  - businessDomains: array of canonical business-domain strings (kebab or lowercase, e.g. \"payment processing\", \"user management\").\n  - stakeholders: array of relevant roles or teams (lowercase singular nouns, e.g. \"product manager\").\n  - technologies: array of technologies directly mentioned (lowercase, snake/kebab case acceptable, e.g. \"postgresql\", \"redis\").\n  - docIntent: one of [\"ai-context\", \"governance\", \"mixed\"]. Prefer \"governance\" for ADRs/runbooks/architecture decisions, \"mixed\" for user guides and design docs, otherwise \"ai-context\".\n  - docSource (optional): one of [\"parser\", \"manual\", \"llm\", \"imported\", \"sync\", \"other\"]. Default to \"llm\" when unsure.\n  - docLocale (optional): ISO language code detected from content (default \"en\").\nIf the document lacks information for a field, return an empty array (for lists) or omit the key.\nDO NOT include explanations or comments, respond with raw JSON only.";
export declare class HeuristicDocumentationIntelligenceProvider implements DocumentationIntelligenceProvider {
    extractSignals(request: DocumentationIntelligenceRequest): Promise<DocumentationSignals>;
    private extractBusinessDomains;
    private extractStakeholders;
    private extractTechnologies;
}
//# sourceMappingURL=DocumentationIntelligenceProvider.d.ts.map