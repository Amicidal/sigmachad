/**
 * Validation Middleware for API Requests
 * Provides reusable validation functions and middleware
 */
import { ZodError } from "zod";
// Import validation schemas
import { z } from "zod";
// Common validation schemas
export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
    limit: z.number().int().min(1).max(1000).default(50),
    offset: z.number().int().min(0).default(0),
});
export const entityIdSchema = z.string().min(1).max(255);
export const searchQuerySchema = z.object({
    query: z.string().min(1).max(1000),
    entityTypes: z
        .array(z.enum(["function", "class", "interface", "file", "module"]))
        .optional(),
    searchType: z
        .enum(["semantic", "structural", "usage", "dependency"])
        .optional(),
    filters: z
        .object({
        language: z.string().optional(),
        path: z.string().optional(),
        tags: z.array(z.string()).optional(),
        lastModified: z
            .object({
            since: z.string().datetime().optional(),
            until: z.string().datetime().optional(),
        })
            .optional(),
    })
        .optional(),
    includeRelated: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).optional(),
});
// Validation middleware factory
export function validateSchema(schema) {
    return async (request, reply) => {
        try {
            // Validate request body if it exists
            if (request.body) {
                request.body = schema.parse(request.body);
            }
            // Validate query parameters if they match schema
            if (request.query && Object.keys(request.query).length > 0) {
                // Only validate if the schema expects query parameters
                const querySchema = extractQuerySchema(schema);
                if (querySchema) {
                    request.query = querySchema.parse(request.query);
                }
            }
            // Validate path parameters if they match schema
            if (request.params && Object.keys(request.params).length > 0) {
                const paramsSchema = extractParamsSchema(schema);
                if (paramsSchema) {
                    request.params = paramsSchema.parse(request.params);
                }
            }
        }
        catch (error) {
            if (error instanceof ZodError) {
                reply.status(400).send({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Request validation failed",
                        details: error.errors.map((err) => ({
                            field: err.path.join("."),
                            message: err.message,
                            code: err.code,
                        })),
                    },
                });
                return;
            }
            reply.status(500).send({
                success: false,
                error: {
                    code: "VALIDATION_INTERNAL_ERROR",
                    message: "Internal validation error",
                },
            });
        }
    };
}
// Helper function to extract query schema from a Zod schema
function extractQuerySchema(schema) {
    try {
        // In Zod v3, we need to check if it's an object schema differently
        if (schema.constructor.name === "ZodObject") {
            const zodObjectSchema = schema;
            const shape = zodObjectSchema._def.shape();
            const queryFields = {};
            for (const [key, fieldSchema] of Object.entries(shape)) {
                if (key.includes("query") ||
                    key.includes("limit") ||
                    key.includes("offset") ||
                    key.includes("filter") ||
                    key.includes("sort") ||
                    key.includes("page")) {
                    queryFields[key] = fieldSchema;
                }
            }
            return Object.keys(queryFields).length > 0 ? z.object(queryFields) : null;
        }
    }
    catch (error) {
        // If schema introspection fails, return null
        console.warn("Could not extract query schema:", error);
    }
    return null;
}
// Helper function to extract params schema from a Zod schema
function extractParamsSchema(schema) {
    try {
        // In Zod v3, we need to check if it's an object schema differently
        if (schema.constructor.name === "ZodObject") {
            const zodObjectSchema = schema;
            const shape = zodObjectSchema._def.shape();
            const paramFields = {};
            for (const [key, fieldSchema] of Object.entries(shape)) {
                if (key.includes("Id") ||
                    key.includes("id") ||
                    key === "entityId" ||
                    key === "file" ||
                    key === "name") {
                    paramFields[key] = fieldSchema;
                }
            }
            return Object.keys(paramFields).length > 0 ? z.object(paramFields) : null;
        }
    }
    catch (error) {
        // If schema introspection fails, return null
        console.warn("Could not extract params schema:", error);
    }
    return null;
}
// Specific validation middleware for common use cases
export const validateEntityId = validateSchema(z.object({
    entityId: entityIdSchema,
}));
export const validateSearchRequest = validateSchema(searchQuerySchema);
export const validatePagination = validateSchema(paginationSchema);
// Sanitization middleware
export function sanitizeInput() {
    return async (request, reply) => {
        // Sanitize string inputs
        if (request.body && typeof request.body === "object") {
            request.body = sanitizeObject(request.body);
        }
        if (request.query && typeof request.query === "object") {
            request.query = sanitizeObject(request.query);
        }
        if (request.params && typeof request.params === "object") {
            request.params = sanitizeObject(request.params);
        }
    };
}
function sanitizeObject(obj) {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
            // Basic XSS prevention - only sanitize if there are actual HTML tags
            const hasScriptTags = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value);
            const hasHtmlTags = /<[^>]*>/g.test(value);
            if (hasScriptTags || hasHtmlTags) {
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/<[^>]*>/g, "")
                    .trim();
            }
            else {
                sanitized[key] = value.trim();
            }
        }
        else if (typeof value === "object") {
            sanitized[key] = sanitizeObject(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
// Rate limiting helper (will be used with rate limiting middleware)
export function createRateLimitKey(request) {
    var _a, _b;
    // Prefer client IP from x-forwarded-for if present; fall back to Fastify's derived IP
    const xff = (_b = (_a = request.headers["x-forwarded-for"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) === null || _b === void 0 ? void 0 : _b.trim();
    const ip = xff || request.ip || "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";
    const method = request.method;
    const url = request.url;
    return `${ip}:${userAgent}:${method}:${url}`;
}
//# sourceMappingURL=validation.js.map