/**
 * Base Model Definitions for Neogma OGM
 * Provides base schemas and utilities for entity and relationship models
 */
import { Neogma } from 'neogma';
import { Entity } from '../../../../models/entities.js';
/**
 * Base schema properties shared by all entities
 */
export declare const BaseEntitySchema: {
    id: {
        type: string;
        required: boolean;
    };
    path: {
        type: string;
        required: boolean;
    };
    hash: {
        type: string;
        required: boolean;
    };
    language: {
        type: string;
        required: boolean;
    };
    created: {
        type: string;
        required: boolean;
    };
    lastModified: {
        type: string;
        required: boolean;
    };
    metadata: {
        type: string;
        required: boolean;
    };
};
/**
 * Base schema properties for relationships
 */
export declare const BaseRelationshipSchema: {
    id: {
        type: string;
        required: boolean;
    };
    created: {
        type: string;
        required: boolean;
    };
    lastModified: {
        type: string;
        required: boolean;
    };
    version: {
        type: string;
        required: boolean;
        minimum: number;
    };
    metadata: {
        type: string;
        required: boolean;
    };
    evidence: {
        type: string;
        required: boolean;
    };
    locations: {
        type: string;
        required: boolean;
    };
    sites: {
        type: string;
        required: boolean;
    };
    validFrom: {
        type: string;
        required: boolean;
    };
    validTo: {
        type: string;
        required: boolean;
    };
};
/**
 * Create a base entity model with common configuration
 */
export declare function createEntityModel<T extends Entity>(neogma: Neogma, config: {
    label: string;
    schema: Record<string, any>;
    additionalIndices?: Array<{
        properties: string[];
        type?: string;
    }>;
}): import("neogma").NeogmaModel<import("neogma").Neo4jSupportedProperties, Object, Object, Object>;
/**
 * Create a relationship model with common configuration
 */
export declare function createRelationshipModel(neogma: Neogma, config: {
    label: string;
    schema?: Record<string, any>;
    sourceModel: any;
    targetModel: any;
}): {
    label: string;
    schema: {
        id: {
            type: string;
            required: boolean;
        };
        created: {
            type: string;
            required: boolean;
        };
        lastModified: {
            type: string;
            required: boolean;
        };
        version: {
            type: string;
            required: boolean;
            minimum: number;
        };
        metadata: {
            type: string;
            required: boolean;
        };
        evidence: {
            type: string;
            required: boolean;
        };
        locations: {
            type: string;
            required: boolean;
        };
        sites: {
            type: string;
            required: boolean;
        };
        validFrom: {
            type: string;
            required: boolean;
        };
        validTo: {
            type: string;
            required: boolean;
        };
    };
    source: any;
    target: any;
};
/**
 * Convert Neogma model instance to domain entity
 */
export declare function modelToEntity<T extends Entity>(model: any): T;
/**
 * Convert domain entity to Neogma model properties
 */
export declare function entityToModelProps(entity: Entity): Record<string, any>;
/**
 * Batch operation utilities
 */
export declare class BatchOperationHelper {
    private batchSize;
    constructor(batchSize?: number);
    /**
     * Execute operations in batches
     */
    executeBatched<T, R>(items: T[], operation: (batch: T[]) => Promise<R[]>): Promise<R[]>;
}
//# sourceMappingURL=BaseModels.d.ts.map