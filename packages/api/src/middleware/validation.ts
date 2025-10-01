/**
 * Validation Middleware for API Requests
 * Provides reusable validation functions and middleware
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { ZodSchema, ZodError } from "zod";

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
export function validateSchema<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
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
    } catch (error) {
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
function extractQuerySchema(schema: ZodSchema<any>): ZodSchema<any> | null {
  try {
    // In Zod v3, we need to check if it's an object schema differently
    if (schema.constructor.name === "ZodObject") {
      const zodObjectSchema = schema as any;
      const shape = zodObjectSchema._def.shape();
      const entries: Array<[string, any]> = [];

      for (const [key, fieldSchema] of Object.entries(shape)) {
        if (
          key.includes("query") ||
          key.includes("limit") ||
          key.includes("offset") ||
          key.includes("filter") ||
          key.includes("sort") ||
          key.includes("page")
        ) {
          entries.push([key, fieldSchema]);
        }
      }

      if (entries.length === 0) return null;
      const queryFields = entries.reduce((acc, [k, v]) => {
        Object.defineProperty(acc, k, {
          value: v,
          enumerable: true,
          writable: true,
          configurable: false,
        });
        return acc;
      }, Object.create(null) as Record<string, any>);

      return z.object(queryFields);
    }
  } catch (error) {
    // If schema introspection fails, return null
    console.warn("Could not extract query schema:", error);
  }
  return null;
}

// Helper function to extract params schema from a Zod schema
function extractParamsSchema(schema: ZodSchema<any>): ZodSchema<any> | null {
  try {
    // In Zod v3, we need to check if it's an object schema differently
    if (schema.constructor.name === "ZodObject") {
      const zodObjectSchema = schema as any;
      const shape = zodObjectSchema._def.shape();
      const entries: Array<[string, any]> = [];

      for (const [key, fieldSchema] of Object.entries(shape)) {
        if (
          key.includes("Id") ||
          key.includes("id") ||
          key === "entityId" ||
          key === "file" ||
          key === "name"
        ) {
          entries.push([key, fieldSchema]);
        }
      }

      if (entries.length === 0) return null;
      const paramFields = entries.reduce((acc, [k, v]) => {
        Object.defineProperty(acc, k, {
          value: v,
          enumerable: true,
          writable: true,
          configurable: false,
        });
        return acc;
      }, Object.create(null) as Record<string, any>);

      return z.object(paramFields);
    }
  } catch (error) {
    // If schema introspection fails, return null
    console.warn("Could not extract params schema:", error);
  }
  return null;
}

// Specific validation middleware for common use cases
export const validateEntityId = validateSchema(
  z.object({
    entityId: entityIdSchema,
  })
);

export const validateSearchRequest = validateSchema(searchQuerySchema);

export const validatePagination = validateSchema(paginationSchema);

// Sanitization middleware
export function sanitizeInput() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
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

function isSafeKey(key: string): boolean {
  return (
    key !== "__proto__" &&
    key !== "constructor" &&
    key !== "prototype" &&
    /^[\w\-.[\]]{1,256}$/.test(key)
  );
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const out: Record<string, any> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (!isSafeKey(key)) continue;
    let sanitizedValue: any = value;
    if (typeof value === "string") {
      const hasScriptTags =
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value);
      const hasHtmlTags = /<[^>]*>/g.test(value);
      sanitizedValue = hasScriptTags || hasHtmlTags
        ? value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<[^>]*>/g, "")
            .trim()
        : value.trim();
    } else if (typeof value === "object") {
      sanitizedValue = sanitizeObject(value);
    }

    Object.defineProperty(out, key, {
      value: sanitizedValue,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  return out;
}

// Rate limiting helper (will be used with rate limiting middleware)
export function createRateLimitKey(request: FastifyRequest): string {
  // Prefer client IP from x-forwarded-for if present; fall back to Fastify's derived IP
  const getHeader = (name: "x-forwarded-for" | "user-agent"): string | undefined => {
    const raw = request.headers[name as keyof typeof request.headers] as
      | string
      | string[]
      | undefined;
    if (Array.isArray(raw)) return raw[0];
    return raw;
  };

  const xff = getHeader("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = xff || request.ip || "unknown";
  const userAgent = getHeader("user-agent") || "unknown";
  const method = request.method;
  const url = request.url;

  return `${ip}:${userAgent}:${method}:${url}`;
}
 
