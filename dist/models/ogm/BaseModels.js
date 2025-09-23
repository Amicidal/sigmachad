/**
 * Base Model Definitions for Neogma OGM
 * Provides base schemas and utilities for entity and relationship models
 */
import { ModelFactory } from 'neogma';
/**
 * Base schema properties shared by all entities
 */
export const BaseEntitySchema = {
    id: {
        type: 'string',
        required: true,
    },
    path: {
        type: 'string',
        required: true,
    },
    hash: {
        type: 'string',
        required: false,
    },
    language: {
        type: 'string',
        required: false,
    },
    created: {
        type: 'datetime',
        required: false,
    },
    lastModified: {
        type: 'datetime',
        required: false,
    },
    metadata: {
        type: 'object',
        required: false,
    },
};
/**
 * Base schema properties for relationships
 */
export const BaseRelationshipSchema = {
    id: {
        type: 'string',
        required: true,
    },
    created: {
        type: 'datetime',
        required: false,
    },
    lastModified: {
        type: 'datetime',
        required: false,
    },
    version: {
        type: 'number',
        required: false,
        minimum: 1,
    },
    metadata: {
        type: 'object',
        required: false,
    },
    evidence: {
        type: 'object[]',
        required: false,
    },
    locations: {
        type: 'object[]',
        required: false,
    },
    sites: {
        type: 'object[]',
        required: false,
    },
    // Temporal validity fields
    validFrom: {
        type: 'datetime',
        required: false,
    },
    validTo: {
        type: 'datetime',
        required: false,
    },
};
/**
 * Create a base entity model with common configuration
 */
export function createEntityModel(neogma, config) {
    const fullSchema = {
        ...BaseEntitySchema,
        ...config.schema,
    };
    // Default indices for all entities
    const indices = [
        { properties: ['id'], type: 'RANGE' },
        { properties: ['path'], type: 'RANGE' },
        { properties: ['hash'], type: 'RANGE' },
        ...(config.additionalIndices || []),
    ];
    return ModelFactory({
        label: config.label,
        schema: fullSchema,
        primaryKeyField: 'id',
    }, neogma);
}
/**
 * Create a relationship model with common configuration
 */
export function createRelationshipModel(neogma, config) {
    const fullSchema = {
        ...BaseRelationshipSchema,
        ...(config.schema || {}),
    };
    return {
        label: config.label,
        schema: fullSchema,
        source: config.sourceModel,
        target: config.targetModel,
    };
}
/**
 * Convert Neogma model instance to domain entity
 */
export function modelToEntity(model) {
    const props = model.getDataValues();
    // Convert Neo4j datetime to JS Date if needed
    if (props.created && typeof props.created !== 'object') {
        props.created = new Date(props.created);
    }
    if (props.lastModified && typeof props.lastModified !== 'object') {
        props.lastModified = new Date(props.lastModified);
    }
    return props;
}
/**
 * Convert domain entity to Neogma model properties
 */
export function entityToModelProps(entity) {
    const props = { ...entity };
    // Ensure dates are in proper format
    if ('created' in entity && entity.created instanceof Date) {
        props.created = entity.created.toISOString();
    }
    if ('lastModified' in entity && entity.lastModified instanceof Date) {
        props.lastModified = entity.lastModified.toISOString();
    }
    return props;
}
/**
 * Batch operation utilities
 */
export class BatchOperationHelper {
    constructor(batchSize = 100) {
        this.batchSize = batchSize;
    }
    /**
     * Execute operations in batches
     */
    async executeBatched(items, operation) {
        const results = [];
        for (let i = 0; i < items.length; i += this.batchSize) {
            const batch = items.slice(i, i + this.batchSize);
            const batchResults = await operation(batch);
            results.push(...batchResults);
        }
        return results;
    }
}
//# sourceMappingURL=BaseModels.js.map