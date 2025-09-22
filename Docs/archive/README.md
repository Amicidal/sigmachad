# Archived Documentation

This directory contains historical documentation that is no longer current but may be useful for reference.

## Migration Documentation

- **search-service-migration.md** - Historical documentation of the SearchService migration to Neogma OGM (completed)

## Note

The OGM migration has been completed. The current implementation uses the OGM services as the primary implementation:

- `EntityServiceOGM` - Entity management
- `RelationshipServiceOGM` - Relationship management
- `SearchServiceOGM` - Search operations
- `NeogmaService` - Core OGM connection management

For current documentation, see:
- `/src/services/knowledge/ogm/README.md` - Current OGM architecture documentation
- Main project documentation in `/Docs/`