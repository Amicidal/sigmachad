/**
 * Intent Extractor
 * Handles inference of document intent, domains, stakeholders, and technologies
 */
export class IntentExtractor {
    constructor(intelligenceProvider) {
        this.intelligenceProvider = intelligenceProvider;
    }
    /**
     * Infer document intent based on file path and type
     */
    inferDocIntent(filePath, docType) {
        const normalizedPath = filePath.toLowerCase();
        if (normalizedPath.includes("/adr") ||
            normalizedPath.includes("adr-") ||
            normalizedPath.includes("/architecture") ||
            normalizedPath.includes("/decisions") ||
            docType === "architecture") {
            return "governance";
        }
        if (docType === "api-doc" || docType === "readme") {
            return "reference";
        }
        if (docType === "user-guide" || docType === "tutorial") {
            return "tutorial";
        }
        if (docType === "design-doc") {
            return "mixed";
        }
        return "ai-context";
    }
    /**
     * Infer document locale from file path and metadata
     */
    inferDocLocale(filePath, metadata) {
        const localeMatch = filePath
            .toLowerCase()
            .match(/\.([a-z]{2}(?:-[a-z0-9]+)?)\.(md|txt|rst|adoc)$/);
        if (localeMatch) {
            return localeMatch[1];
        }
        if (typeof (metadata === null || metadata === void 0 ? void 0 : metadata.language) === "string" &&
            metadata.language.length > 0) {
            return metadata.language;
        }
        return "en";
    }
    /**
     * Extract business domains from document signals
     */
    async extractDomains(document, content) {
        var _a, _b;
        try {
            const signals = await this.intelligenceProvider.extractSignals({
                content,
                format: ((_a = document.metadata) === null || _a === void 0 ? void 0 : _a.format) || "markdown",
                filePath: (_b = document.metadata) === null || _b === void 0 ? void 0 : _b.filePath,
                docTypeHint: document.docType,
                metadata: document.metadata,
            });
            return signals.businessDomains.map((domain) => ({
                name: domain.name,
                description: domain.description || "",
                criticality: this.inferDomainCriticality(domain.name, content),
                stakeholders: domain.stakeholders || [],
                keyProcesses: domain.keyProcesses || [],
                confidence: domain.confidence || 0.5,
            }));
        }
        catch (error) {
            console.warn("Failed to extract domains:", error);
            return [];
        }
    }
    /**
     * Extract stakeholders from document
     */
    async extractStakeholders(document, content) {
        var _a, _b;
        try {
            const signals = await this.intelligenceProvider.extractSignals({
                content,
                format: ((_a = document.metadata) === null || _a === void 0 ? void 0 : _a.format) || "markdown",
                filePath: (_b = document.metadata) === null || _b === void 0 ? void 0 : _b.filePath,
                docTypeHint: document.docType,
                metadata: document.metadata,
            });
            return signals.stakeholders || [];
        }
        catch (error) {
            console.warn("Failed to extract stakeholders:", error);
            return [];
        }
    }
    /**
     * Extract technologies from document
     */
    async extractTechnologies(document, content) {
        var _a, _b;
        try {
            const signals = await this.intelligenceProvider.extractSignals({
                content,
                format: ((_a = document.metadata) === null || _a === void 0 ? void 0 : _a.format) || "markdown",
                filePath: (_b = document.metadata) === null || _b === void 0 ? void 0 : _b.filePath,
                docTypeHint: document.docType,
                metadata: document.metadata,
            });
            return signals.technologies || [];
        }
        catch (error) {
            console.warn("Failed to extract technologies:", error);
            return [];
        }
    }
    /**
     * Infer domain criticality based on domain name and content
     */
    inferDomainCriticality(domainName, content) {
        const normalizedDomain = domainName.toLowerCase();
        const normalizedContent = content.toLowerCase();
        // Critical domains
        if (normalizedDomain.includes("security") ||
            normalizedDomain.includes("compliance") ||
            normalizedDomain.includes("privacy") ||
            normalizedDomain.includes("authentication")) {
            return "critical";
        }
        // High criticality domains
        if (normalizedDomain.includes("payment") ||
            normalizedDomain.includes("billing") ||
            normalizedDomain.includes("infrastructure") ||
            normalizedDomain.includes("data")) {
            return "high";
        }
        // Medium criticality domains
        if (normalizedDomain.includes("user") ||
            normalizedDomain.includes("customer") ||
            normalizedDomain.includes("product") ||
            normalizedContent.includes("business critical")) {
            return "medium";
        }
        // Low criticality (default)
        return "low";
    }
    /**
     * Enhance parsed document with extracted intent information
     */
    async enhanceDocument(document, content) {
        var _a, _b;
        const [businessDomains, stakeholders, technologies] = await Promise.all([
            this.extractDomains(document, content),
            this.extractStakeholders(document, content),
            this.extractTechnologies(document, content),
        ]);
        return {
            ...document,
            businessDomains: businessDomains.map((d) => d.name),
            stakeholders,
            technologies,
            docIntent: document.docIntent ||
                this.inferDocIntent(((_a = document.metadata) === null || _a === void 0 ? void 0 : _a.filePath) || "", document.docType),
            docLocale: document.docLocale ||
                this.inferDocLocale(((_b = document.metadata) === null || _b === void 0 ? void 0 : _b.filePath) || "", document.metadata || {}),
            metadata: {
                ...document.metadata,
                extractedDomains: businessDomains,
                extractedStakeholders: stakeholders,
                extractedTechnologies: technologies,
            },
        };
    }
}
//# sourceMappingURL=IntentExtractor.js.map