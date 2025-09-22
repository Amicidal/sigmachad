export class SCMProviderError extends Error {
    constructor(message) {
        super(message);
        this.name = "SCMProviderError";
    }
}
export class SCMProviderNotConfiguredError extends SCMProviderError {
    constructor() {
        super("SCM provider is not configured for pull request creation");
        this.name = "SCMProviderNotConfiguredError";
    }
}
//# sourceMappingURL=SCMProvider.js.map