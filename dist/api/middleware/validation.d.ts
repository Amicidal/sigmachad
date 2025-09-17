/**
 * Validation Middleware for API Requests
 * Provides reusable validation functions and middleware
 */
import { FastifyRequest, FastifyReply } from "fastify";
import { ZodSchema } from "zod";
import { z } from "zod";
export declare const uuidSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const entityIdSchema: z.ZodString;
export declare const searchQuerySchema: z.ZodObject<{
    query: z.ZodString;
    entityTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["function", "class", "interface", "file", "module"]>, "many">>;
    searchType: z.ZodOptional<z.ZodEnum<["semantic", "structural", "usage", "dependency"]>>;
    filters: z.ZodOptional<z.ZodObject<{
        language: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        lastModified: z.ZodOptional<z.ZodObject<{
            since: z.ZodOptional<z.ZodString>;
            until: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            since?: string | undefined;
            until?: string | undefined;
        }, {
            since?: string | undefined;
            until?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        path?: string | undefined;
        language?: string | undefined;
        lastModified?: {
            since?: string | undefined;
            until?: string | undefined;
        } | undefined;
    }, {
        tags?: string[] | undefined;
        path?: string | undefined;
        language?: string | undefined;
        lastModified?: {
            since?: string | undefined;
            until?: string | undefined;
        } | undefined;
    }>>;
    includeRelated: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit?: number | undefined;
    entityTypes?: ("function" | "class" | "file" | "module" | "interface")[] | undefined;
    searchType?: "dependency" | "semantic" | "structural" | "usage" | undefined;
    filters?: {
        tags?: string[] | undefined;
        path?: string | undefined;
        language?: string | undefined;
        lastModified?: {
            since?: string | undefined;
            until?: string | undefined;
        } | undefined;
    } | undefined;
    includeRelated?: boolean | undefined;
}, {
    query: string;
    limit?: number | undefined;
    entityTypes?: ("function" | "class" | "file" | "module" | "interface")[] | undefined;
    searchType?: "dependency" | "semantic" | "structural" | "usage" | undefined;
    filters?: {
        tags?: string[] | undefined;
        path?: string | undefined;
        language?: string | undefined;
        lastModified?: {
            since?: string | undefined;
            until?: string | undefined;
        } | undefined;
    } | undefined;
    includeRelated?: boolean | undefined;
}>;
export declare function validateSchema<T>(schema: ZodSchema<T>): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const validateEntityId: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const validateSearchRequest: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare const validatePagination: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function sanitizeInput(): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function createRateLimitKey(request: FastifyRequest): string;
//# sourceMappingURL=validation.d.ts.map