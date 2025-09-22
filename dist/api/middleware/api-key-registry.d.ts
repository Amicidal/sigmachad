/**
 * Lightweight API key registry to support scoped API keys with checksum validation.
 */
export interface ApiKeyRecord {
    id: string;
    secretHash: string;
    algorithm?: "sha256" | "sha512";
    scopes: string[];
    lastRotatedAt?: string;
    checksum?: string;
    metadata?: Record<string, unknown>;
}
export interface ApiKeyRegistry {
    version?: string;
    updatedAt?: string;
    keys: ApiKeyRecord[];
}
interface VerificationFailure {
    ok: false;
    errorCode: "INVALID_API_KEY" | "CHECKSUM_MISMATCH";
    message: string;
}
interface VerificationSuccess {
    ok: true;
    record: ApiKeyRecord;
    scopes: string[];
}
export type ApiKeyVerification = VerificationFailure | VerificationSuccess;
export type ApiKeyRegistryProvider = () => ApiKeyRegistry | null;
export declare const setApiKeyRegistryProvider: (provider: ApiKeyRegistryProvider | null) => void;
export declare const clearApiKeyRegistryCache: () => void;
export declare const isApiKeyRegistryConfigured: () => boolean;
export declare const authenticateApiKey: (apiKeyHeader: string) => ApiKeyVerification;
export {};
//# sourceMappingURL=api-key-registry.d.ts.map