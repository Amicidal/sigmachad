/**
 * Lightweight API key registry to support scoped API keys with checksum validation.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { normalizeScopes } from "./scopes.js";
const DEFAULT_ALGORITHM = "sha256";
const hashSecret = (secret, algorithm) => {
    const algo = algorithm !== null && algorithm !== void 0 ? algorithm : DEFAULT_ALGORITHM;
    return crypto.createHash(algo).update(secret).digest("hex");
};
const computeChecksum = (record) => {
    var _a;
    const base = `${record.id}:${record.secretHash}:${(_a = record.algorithm) !== null && _a !== void 0 ? _a : DEFAULT_ALGORITHM}`;
    return crypto.createHash("sha256").update(base).digest("hex");
};
let cachedSignature = null;
let cachedRegistry = null;
let registryProvider = null;
const normaliseRegistryShape = (input) => {
    if (!input) {
        return { keys: [] };
    }
    if (Array.isArray(input)) {
        return { keys: input };
    }
    if (typeof input === "object" && Array.isArray(input.keys)) {
        return input;
    }
    return { keys: [] };
};
const normaliseAndFilter = (registry) => {
    const shaped = normaliseRegistryShape(registry);
    shaped.keys = Array.isArray(shaped.keys)
        ? shaped.keys.filter((record) => Boolean((record === null || record === void 0 ? void 0 : record.id) && (record === null || record === void 0 ? void 0 : record.secretHash)))
        : [];
    return shaped;
};
const loadRegistryFromProvider = () => {
    if (!registryProvider) {
        return { keys: [] };
    }
    try {
        const provided = registryProvider();
        return normaliseAndFilter(provided);
    }
    catch (_a) {
        return { keys: [] };
    }
};
const loadRegistryFromEnv = () => {
    const base = process.env.API_KEY_REGISTRY || "";
    const registryPath = process.env.API_KEY_REGISTRY_PATH;
    if (!registryPath) {
        return { source: base, signature: `env:${base}` };
    }
    try {
        const absolutePath = path.resolve(registryPath);
        const stats = fs.statSync(absolutePath);
        const fileSignature = `file:${absolutePath}:${stats.mtimeMs}:${stats.size}`;
        const fileContents = fs.readFileSync(absolutePath, "utf8");
        return { source: fileContents, signature: fileSignature };
    }
    catch (_a) {
        return { source: base, signature: `env:${base}` };
    }
};
const loadRegistry = () => {
    if (registryProvider) {
        return loadRegistryFromProvider();
    }
    const { source, signature } = loadRegistryFromEnv();
    if (cachedRegistry && cachedSignature === signature) {
        return cachedRegistry;
    }
    try {
        const parsed = source ? JSON.parse(source) : { keys: [] };
        cachedRegistry = normaliseAndFilter(parsed);
        cachedSignature = signature;
    }
    catch (_a) {
        cachedRegistry = { keys: [] };
        cachedSignature = signature;
    }
    return cachedRegistry;
};
export const setApiKeyRegistryProvider = (provider) => {
    registryProvider = provider;
    cachedRegistry = null;
    cachedSignature = null;
};
export const clearApiKeyRegistryCache = () => {
    cachedRegistry = null;
    cachedSignature = null;
};
export const isApiKeyRegistryConfigured = () => {
    const registry = loadRegistry();
    return Array.isArray(registry.keys) && registry.keys.length > 0;
};
export const authenticateApiKey = (apiKeyHeader) => {
    var _a, _b;
    let decoded;
    try {
        decoded = Buffer.from(apiKeyHeader, "base64").toString("utf8");
    }
    catch (_c) {
        return {
            ok: false,
            errorCode: "INVALID_API_KEY",
            message: "API key is not valid base64",
        };
    }
    const [keyId, providedSecret] = decoded.split(":");
    if (!keyId || !providedSecret) {
        return {
            ok: false,
            errorCode: "INVALID_API_KEY",
            message: "API key must be formatted as <id>:<secret>",
        };
    }
    const registry = loadRegistry();
    const record = registry.keys.find((entry) => entry.id === keyId);
    if (!record) {
        return {
            ok: false,
            errorCode: "INVALID_API_KEY",
            message: "API key is not recognised",
        };
    }
    if (record.checksum) {
        const expectedChecksum = computeChecksum(record);
        if (expectedChecksum !== record.checksum) {
            return {
                ok: false,
                errorCode: "CHECKSUM_MISMATCH",
                message: "API key registry entry checksum mismatch",
            };
        }
    }
    const algorithm = (_a = record.algorithm) !== null && _a !== void 0 ? _a : DEFAULT_ALGORITHM;
    const providedHash = hashSecret(providedSecret, algorithm);
    if (providedHash !== record.secretHash) {
        return {
            ok: false,
            errorCode: "INVALID_API_KEY",
            message: "API key secret does not match",
        };
    }
    const scopes = normalizeScopes((_b = record.scopes) !== null && _b !== void 0 ? _b : []);
    return {
        ok: true,
        record,
        scopes,
    };
};
//# sourceMappingURL=api-key-registry.js.map