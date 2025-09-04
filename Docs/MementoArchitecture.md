# Memento Architecture & Technology Stack

## System Overview

Memento is a **local-first AI coding assistant** that provides comprehensive codebase awareness through a knowledge graph system. Designed primarily for local development environments, it integrates documentation, testing, performance monitoring, and security analysis to enable intelligent code understanding and generation.

### Key Characteristics
- **Local-First**: Runs entirely on developer machines using Docker
- **AI-Native**: Built for AI coding assistants (Claude, GPT, etc.)
- **Knowledge Graph**: Maintains comprehensive codebase understanding
- **Multi-Protocol**: Supports MCP, REST, and WebSocket interfaces
- **Developer-Centric**: Optimized for individual and small team workflows

### Why Local-First Architecture?

#### Benefits for AI Coding Assistants
- **Instant Response**: No network latency for code analysis
- **Privacy**: Code never leaves the developer's machine
- **Offline Capability**: Works without internet connection
- **Full Context**: Direct access to entire codebase and dependencies
- **Cost-Effective**: No cloud infrastructure costs for individual developers

#### Perfect for Development Workflows
- **IDE Integration**: Seamless connection with local editors
- **File Watching**: Real-time updates as you code
- **Git Integration**: Works with local Git repositories
- **Multi-Project**: Easy switching between different projects
- **Resource Efficient**: Uses only necessary resources on local machine

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│  │   Claude Code   │ │   OpenAI       │ │   VS Code       │         │
│  │   (MCP)         │ │   (HTTP)       │ │   (WebSocket)   │         │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                           │
│  ┌─────────────────┐ ┌─────────────────┐         │
│  │   MCP Server    │ │   REST API     │         │
│  │   (Local)       │ │   (Local)      │         │
│  └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Service Layer                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│  │   Knowledge     │ │   Test         │ │   Security      │         │
│  │   Graph         │ │   Engine       │ │   Scanner       │         │
│  │   Service       │ │                 │ │                 │         │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│  │   Graph DB      │ │   Vector DB     │ │   Document      │         │
│  │   (Docker)      │ │   (Docker)      │ │   Store         │         │
│  │   FalkorDB      │ │   Qdrant        │ │   (Docker)      │         │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│  │   File System   │ │   Git           │ │   Docker        │         │
│  │   (Local)       │ │   (Local)       │ │   Compose       │         │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack Decisions

### Core Runtime
- **Language**: TypeScript (Node.js)
- **Runtime**: Node.js 18+ (LTS)
- **Package Manager**: pnpm (for workspace management)

### Databases & Storage
- **Graph Database**: FalkorDB (Redis-based graph database)
  - **Why**: High performance, Redis compatibility, Cypher support
  - **Alternatives Considered**: Neo4j, Amazon Neptune
- **Vector Database**: Qdrant
  - **Why**: Fast similarity search, metadata filtering, horizontal scaling
  - **Alternatives Considered**: Pinecone, Weaviate
- **Document Store**: PostgreSQL with JSONB
  - **Why**: Structured data with flexible schemas, ACID compliance
  - **Alternatives Considered**: MongoDB, DynamoDB

### Frameworks & Libraries

#### Backend Framework
- **Web Framework**: Fastify
  - **Why**: High performance, plugin ecosystem, TypeScript support
  - **Alternatives Considered**: Express, Koa

#### Graph & Data Processing
- **Graph Processing**: Cypher (FalkorDB)
- **AST Parsing**: TypeScript Compiler API + ts-morph
- **Vector Embeddings**: OpenAI Ada-002 or local models (Transformers.js)
- **File Watching**: chokidar

#### External Integrations
- **LLM Integration**: OpenAI API + Anthropic Claude API
- **Git Integration**: isomorphic-git
- **Security Scanning**: ESLint security plugin, Semgrep, Snyk
- **Test Frameworks**: Jest, Vitest (auto-detection)

### Infrastructure & Deployment

#### Containerization
- **Container Runtime**: Docker
- **Orchestration**: Docker Compose (development) / Kubernetes (production)
- **Base Images**: Node.js Alpine Linux

#### Deployment Options

##### Primary: Local Development (Recommended)
- **Containerized**: Docker Compose for all services
- **Databases**: Local Docker containers for FalkorDB, Qdrant, PostgreSQL
- **IDE Integration**: Direct WebSocket/HTTP connections
- **File Access**: Direct filesystem access for code analysis

##### Optional: Cloud Deployment (Enterprise/Team Features)
- **Cloud Provider**: AWS/GCP/Azure (when scaling needed)
- **Compute**: ECS Fargate / EKS / Cloud Run
- **Storage**: RDS PostgreSQL, ElastiCache Redis, OpenSearch
- **CDN**: CloudFront / Cloud CDN (for distributed teams)
- **Monitoring**: CloudWatch / Cloud Monitoring

#### Development Environment
- **Local Development**: Docker Compose (primary workflow)
- **IDE Integration**: VS Code extensions, direct API connections
- **Package Management**: pnpm workspaces
- **Hot Reload**: Development mode with file watching

## Component Architecture

### 1. MCP Server Component

```typescript
// src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk';

class MementoMCPServer extends Server {
  private knowledgeGraph: KnowledgeGraphService;
  private testEngine: TestEngine;
  private securityScanner: SecurityScanner;

  async handleToolCall(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'design.create_spec':
        return this.knowledgeGraph.createSpec(params);
      case 'tests.plan_and_generate':
        return this.testEngine.planTests(params);
      case 'graph.search':
        return this.knowledgeGraph.search(params);
      // ... other tools
    }
  }
}
```

### 2. Knowledge Graph Service

```typescript
// src/services/KnowledgeGraphService.ts
import { FalkorDB } from 'falkordb';
import { QdrantClient } from '@qdrant/js-client-rest';

class KnowledgeGraphService {
  private graphDb: FalkorDB;
  private vectorDb: QdrantClient;
  private fileWatcher: FileWatcher;

  async initialize(): Promise<void> {
    await this.graphDb.connect(process.env.FALKORDB_URL);
    await this.vectorDb.connect(process.env.QDRANT_URL);
    this.setupFileWatcher();
  }

  async createEntity(entity: CodebaseEntity): Promise<void> {
    // Create graph node
    await this.graphDb.query(`
      CREATE (e:${entity.type} {id: $id, path: $path, ...})
    `, entity);

    // Create vector embedding
    const embedding = await this.generateEmbedding(entity);
    await this.vectorDb.upsert(entity.id, embedding);

    // Update relationships
    await this.updateRelationships(entity);
  }
}
```

### 3. API Gateway

```typescript
// src/api/gateway.ts
import Fastify from 'fastify';
import { MCPRouter } from './mcp-router';
import { RestRouter } from './rest-router';

class APIGateway {
  private app: FastifyInstance;
  private mcpRouter: MCPRouter;
  private restRouter: RestRouter;

  async start(port: number): Promise<void> {
    // MCP endpoint
    this.app.register(this.mcpRouter.register, { prefix: '/mcp' });

    // REST API
    this.app.register(this.restRouter.register, { prefix: '/api/v1' });

    await this.app.listen({ port });
  }
}
```

## Data Flow Architecture

### Code Analysis Pipeline

```
File Change → File Watcher → Queue → Parser → Knowledge Graph → Vector DB
       ↓           ↓           ↓       ↓           ↓           ↓
  Detect Change → Debounce → Prioritize → AST → Create/Update → Embed
```

### Query Processing Flow

```
Query → API Gateway → Service Layer → Graph DB → Vector DB → Response
   ↓         ↓            ↓            ↓         ↓          ↓
Parse → Route → Validate → Cypher → Similarity → Format
```

### Synchronization Flow

```
Code Change → Change Detection → Impact Analysis → Update Graph → Update Vectors → Notify Clients
     ↓              ↓                ↓              ↓             ↓            ↓
File Event → Compare States → Find Affected → Apply Changes → Re-embed → WebSocket
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens** for API authentication
- **API Keys** for service-to-service communication
- **Role-Based Access Control** (RBAC)
- **OAuth 2.0** integration with GitHub/GitLab

### Data Protection
- **Encryption at Rest**: AES-256 for database storage
- **Encryption in Transit**: TLS 1.3 for all communications
- **Secret Management**: AWS Secrets Manager / HashiCorp Vault
- **Data Sanitization**: Input validation and SQL injection prevention

### Security Scanning Integration
- **SAST**: Static Application Security Testing
- **SCA**: Software Composition Analysis
- **Container Scanning**: Vulnerability scanning for Docker images
- **Secrets Detection**: Automated detection of exposed credentials

## Performance Architecture

### Caching Strategy
- **Application Cache**: Redis for frequently accessed data
- **Query Cache**: Graph query result caching
- **Embedding Cache**: Vector embedding caching
- **CDN**: Static asset caching

### Local Scaling Strategy
- **Resource Allocation**: Adjust Docker container memory/CPU based on project size
- **Database Optimization**: Configure FalkorDB/Qdrant for local hardware specs
- **Caching Strategy**: Optimize Redis caching for local performance
- **Concurrent Processing**: Handle multiple AI assistant sessions efficiently

### Optional Cloud Scaling (Enterprise)
- **Horizontal Scaling**: Multiple service instances across availability zones
- **Database Scaling**: Read replicas and clustering for graph/vector databases
- **Load Balancing**: Application Load Balancer with auto-scaling
- **CDN Integration**: Global distribution for distributed teams

### Performance Targets
- **API Response Time**: < 200ms for simple queries
- **Graph Query Time**: < 500ms for complex traversals
- **Vector Search Time**: < 100ms for similarity searches
- **File Sync Time**: < 5 seconds for typical file changes
- **Concurrent Users**: Support 1000+ simultaneous connections

## Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Response times, error rates, throughput
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: API usage, user engagement
- **Graph Metrics**: Node/relationship counts, query performance

### Logging Strategy
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Log Aggregation**: Centralized logging with ELK stack
- **Audit Logging**: Security events and data access

### Alerting
- **Performance Alerts**: Response time degradation
- **Error Alerts**: Increased error rates
- **Security Alerts**: Suspicious activities
- **Capacity Alerts**: Resource utilization thresholds

## Development Workflow

### Local Development
```bash
# Start development environment
docker-compose up -d

# Run tests
pnpm test

# Build and run
pnpm build && pnpm start

# Run with hot reload
pnpm dev
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      - run: docker build -t memento-local .

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm audit
      - run: semgrep --config=auto

  integration-test:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose up -d
      - run: sleep 30  # Wait for services to start
      - run: pnpm test:integration
      - run: docker-compose down

# Optional: Cloud deployment for enterprise use
  deploy-cloud:
    needs: [integration-test]
    if: github.ref == 'refs/heads/main' && contains(github.event.head_commit.message, '[deploy]')
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v2
      - run: aws ecs update-service --cluster memento --service memento-api --force-new-deployment
```

## Deployment Architecture

### Local Development Environment (Primary)
```yaml
# docker-compose.yml
version: '3.8'
services:
  memento-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - falkordb
      - qdrant
      - postgres

  falkordb:
    image: falkordb/falkordb:latest
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=memento
      - POSTGRES_USER=memento
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Production Environment
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: memento-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: memento-api
  template:
    metadata:
      labels:
        app: memento-api
    spec:
      containers:
      - name: memento-api
        image: memento/memento-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: FALKORDB_URL
          valueFrom:
            secretKeyRef:
              name: memento-secrets
              key: falkordb-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## Directory Structure

```
memento/
├── src/
│   ├── api/                    # API endpoints and routers
│   │   ├── mcp-router.ts      # MCP server for Claude integration
│   │   ├── rest-router.ts     # REST API endpoints
│   │   ├── websocket-router.ts # Real-time WebSocket connections
│   │   └── middleware/        # Request validation, logging
│   ├── services/              # Core business logic services
│   │   ├── KnowledgeGraphService.ts
│   │   ├── TestEngine.ts
│   │   ├── SecurityScanner.ts
│   │   ├── DocumentationParser.ts
│   │   └── FileWatcher.ts
│   ├── models/                # Data models and schemas
│   │   ├── entities.ts        # Graph node type definitions
│   │   ├── relationships.ts   # Graph relationship definitions
│   │   └── types.ts           # TypeScript type definitions
│   ├── utils/                 # Utility functions and helpers
│   │   ├── ast-parser.ts      # TypeScript AST parsing
│   │   ├── embedding.ts       # Vector embedding generation
│   │   ├── git-integration.ts # Git repository operations
│   │   └── validation.ts      # Input validation helpers
│   └── index.ts               # Application entry point
├── tests/                     # Test suites and fixtures
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── fixtures/              # Test data and mocks
├── docs/                      # Documentation and guides
├── docker/                    # Docker configuration
│   ├── Dockerfile             # Main application container
│   ├── docker-compose.yml     # Local development stack
│   └── docker-compose.test.yml # Testing environment
├── scripts/                   # Development and deployment scripts
│   ├── setup-dev.sh          # Development environment setup
│   ├── sync-knowledge-graph.sh # Manual graph synchronization
│   └── health-check.sh       # System health verification
├── config/                    # Configuration files
│   ├── default.json           # Default configuration
│   └── development.json       # Development overrides
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

## Technology Selection Rationale

### Why TypeScript?
- **Type Safety**: Prevents runtime errors through compile-time checking
- **Developer Experience**: Excellent IDE support and refactoring tools
- **Ecosystem**: Rich library ecosystem and community support
- **Node.js Compatibility**: Seamless integration with Node.js runtime

### Why FalkorDB over Neo4j?
- **Performance**: Redis-based architecture provides lower latency
- **Resource Usage**: Lighter memory footprint
- **Cypher Support**: Familiar query language
- **Cloud-Native**: Better containerization support

### Why Qdrant for Vector Search?
- **Performance**: Optimized for high-dimensional vector search
- **Metadata Filtering**: Advanced filtering capabilities
- **Horizontal Scaling**: Distributed architecture
- **API Compatibility**: REST and gRPC support

### Why Fastify over Express?
- **Performance**: Significantly faster than Express
- **Plugin Ecosystem**: Rich plugin architecture
- **TypeScript Support**: Built-in TypeScript definitions
- **Validation**: Built-in request/response validation

This architecture provides a solid foundation for building the Memento system, with clear separation of concerns, scalable components, and production-ready infrastructure patterns.
