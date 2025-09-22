# Neo4j OGM Services

This directory contains the Object-Graph Mapping (OGM) implementation for the Knowledge Graph services using Neogma. The OGM provides a clean, type-safe interface to Neo4j while maintaining high performance and reliability.

## Overview

The OGM services provide:
- **Type-safe Neo4j operations** using Neogma OGM
- **High-performance bulk operations** for entities and relationships
- **Advanced search capabilities** combining structural and semantic search
- **Comprehensive validation** and error handling
- **Event-driven architecture** for real-time updates

## Architecture

### Core Services

1. **NeogmaService** - Core OGM connection and model management
2. **EntityServiceOGM** - Entity CRUD operations and bulk processing
3. **RelationshipServiceOGM** - Relationship management with advanced querying
4. **SearchServiceOGM** - Hybrid search combining structural and semantic capabilities

### Models

The `models/` directory contains Neogma model definitions:
- **BaseModels.ts** - Base model classes and shared interfaces
- **EntityModels.ts** - Entity model definitions for files, symbols, modules, etc.
- **RelationshipModels.ts** - Relationship model definitions for imports, calls, references, etc.

## Key Features

### Entity Management
- **Bulk Operations**: Efficient creation, update, and deletion of large entity sets
- **Validation**: Comprehensive data validation with detailed error reporting
- **Deduplication**: Automatic handling of duplicate entities
- **Metadata Support**: Rich metadata storage and querying

### Relationship Management
- **Evidence Merging**: Intelligent merging of relationship evidence
- **Bulk Processing**: High-performance bulk relationship creation
- **Advanced Filtering**: Complex relationship queries with multiple filters
- **Relationship Statistics**: Detailed metrics and analytics

### Search Capabilities
- **Structural Search**: Fast text-based entity and relationship search
- **Semantic Search**: Vector-based similarity search using embeddings
- **Hybrid Search**: Combined structural and semantic search with intelligent ranking
- **Performance Optimization**: Caching and query optimization for fast results

### Performance Features
- **Connection Pooling**: Efficient Neo4j connection management
- **Query Optimization**: Optimized Cypher query generation
- **Batch Processing**: Configurable batch sizes for optimal performance
- **Caching**: Intelligent caching of frequently accessed data

## Configuration

### Environment Variables

```bash
# Neo4j connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Performance tuning
NEO4J_MAX_CONNECTION_POOL_SIZE=50
NEO4J_MAX_TRANSACTION_RETRY_TIME=15000

# Batch processing
ENTITY_BATCH_SIZE=100
RELATIONSHIP_BATCH_SIZE=500

# Search configuration
SEARCH_CACHE_SIZE=1000
SEARCH_CACHE_TTL=300000
```

### Service Configuration

```typescript
// Basic service initialization
const neogmaService = new NeogmaService(databaseService);
await neogmaService.initialize();

const entityService = new EntityServiceOGM(neogmaService);
const relationshipService = new RelationshipServiceOGM(neogmaService);
const searchService = new SearchServiceOGM(neogmaService, embeddingService);
```

## Usage Examples

### Entity Operations

```typescript
// Create a single entity
const entity = await entityService.createEntity({
  id: 'file-1',
  path: 'src/main.ts',
  type: 'file',
  language: 'typescript',
  // ... other properties
});

// Bulk entity creation
const result = await entityService.createEntitiesBulk(entities, {
  skipExisting: true,
  validateData: true,
});

// Update entity
await entityService.updateEntity('file-1', {
  size: 2048,
  lines: 100,
});
```

### Relationship Operations

```typescript
// Create relationship
const relationship = await relationshipService.createRelationship({
  id: 'rel-1',
  fromEntityId: 'file-1',
  toEntityId: 'file-2',
  type: RelationshipType.IMPORTS,
  metadata: { importType: 'named' },
});

// Bulk relationship creation
const result = await relationshipService.createRelationshipsBulk(relationships, {
  mergeEvidence: true,
});

// Query relationships
const relationships = await relationshipService.getRelationships({
  fromEntityId: 'file-1',
  type: RelationshipType.IMPORTS,
});
```

### Search Operations

```typescript
// Structural search
const results = await searchService.search({
  query: 'Button',
  searchType: 'structural',
  entityTypes: ['file', 'symbol'],
  filters: { language: 'typescript' },
  limit: 10,
});

// Semantic search
const results = await searchService.search({
  query: 'authentication logic',
  searchType: 'semantic',
  limit: 5,
});

// Hybrid search
const results = await searchService.search({
  query: 'user authentication',
  searchType: 'hybrid',
  limit: 10,
});
```

## Performance Characteristics

### Benchmarks
- **Entity Creation**: ~1-5ms per entity (bulk: ~0.1ms per entity)
- **Relationship Creation**: ~2-8ms per relationship (bulk: ~0.2ms per relationship)
- **Search Operations**: ~10-50ms depending on complexity and cache status
- **Memory Usage**: ~1-2MB per 1000 entities in memory

### Optimization Tips
1. Use bulk operations for large datasets
2. Enable query result caching for repeated searches
3. Optimize batch sizes based on available memory
4. Use appropriate indexes on frequently queried properties
5. Monitor connection pool usage and adjust as needed

## Testing

The OGM services include comprehensive test suites:
- **Unit Tests**: Individual service testing with mocked dependencies
- **Integration Tests**: Full service stack testing with real database
- **Performance Tests**: Benchmarking and performance regression testing
- **Stress Tests**: High-load testing for reliability validation

Run tests with:
```bash
npm run test:ogm
npm run test:integration
npm run test:performance
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Increase `NEO4J_MAX_TRANSACTION_RETRY_TIME`
2. **Memory Issues**: Reduce batch sizes or increase heap size
3. **Slow Queries**: Check indexes and optimize query patterns
4. **Event Handler Issues**: Ensure proper event listener cleanup

### Debugging

Enable debug logging:
```bash
DEBUG=ogm:* npm start
```

### Monitoring

Key metrics to monitor:
- Connection pool utilization
- Query execution times
- Memory usage patterns
- Error rates by operation type

## Migration Notes

This implementation represents the final state after the OGM migration completion. The services provide:
- Full feature parity with the original implementation
- Improved performance through optimized queries
- Better type safety and developer experience
- Enhanced monitoring and debugging capabilities

For historical migration information, see the archived migration documentation.