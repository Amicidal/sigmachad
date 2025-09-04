# API Integration Tests

This directory contains comprehensive integration tests for the Memento API Gateway and its various components.

## Test Structure

### Integration Tests (`tests/integration/api/`)

These tests require the full application infrastructure (databases, message queues, etc.) to be running.

#### APIGateway.integration.test.ts
Tests the core API Gateway functionality:
- Server initialization and configuration
- Health check endpoints
- CORS handling
- Request/response middleware
- Error handling
- Route registration verification

#### RESTEndpoints.integration.test.ts
Tests all REST API endpoints:
- Graph operations (search, examples, dependencies, entities, relationships)
- Test management (planning, execution recording, coverage, performance)
- Documentation endpoints
- Security endpoints
- Code analysis endpoints
- Design endpoints
- Impact analysis endpoints
- Source control endpoints

#### WebSocket.integration.test.ts
Tests WebSocket functionality:
- WebSocket server setup and connections
- Message handling and protocols
- Real-time graph updates
- Connection management and cleanup
- Subscription management
- Broadcasting capabilities

#### MCP.integration.test.ts
Tests MCP (Model Context Protocol) server:
- MCP server initialization and validation
- Tool registration and listing
- Tool execution via REST and protocol
- Protocol compliance (JSON-RPC 2.0)
- Error handling
- Performance testing

#### Middleware.integration.test.ts
Tests API middleware components:
- Rate limiting functionality
- Input validation and sanitization
- CORS configuration
- Request logging
- Security headers
- Error handling middleware
- Request timeout handling
- Size limits

#### EndToEnd.integration.test.ts
Tests complete user workflows:
- Design-to-implementation pipeline
- Code analysis and testing workflow
- Multi-user concurrent scenarios
- Error recovery and resilience
- Data consistency across operations
- Performance under load

#### Performance.integration.test.ts
Tests API performance characteristics:
- Response time performance
- Concurrent load handling
- Memory usage and resource management
- Database performance
- Caching effectiveness
- Scalability testing
- Error handling performance

#### TRPC.integration.test.ts
Tests tRPC router functionality:
- tRPC procedure calls
- Context and middleware
- Subscription support
- Protocol compliance
- Error handling
- Performance testing
- HTTP integration

## Unit Tests (`tests/unit/api/`)

These tests use mocked dependencies and can run without infrastructure.

#### APIGateway.unit.test.ts
Unit tests for API Gateway with mocked dependencies:
- Initialization and configuration
- Service integration verification
- Mock behavior validation
- Error handling
- Lifecycle method exposure
- Route registration
- Middleware configuration

## Running Tests

### Prerequisites

For integration tests, you need the full application infrastructure running:

```bash
# Start all services
docker-compose up -d

# Wait for services to be healthy
# Then run integration tests
npm test -- --run tests/integration/api/
```

### Running Unit Tests

Unit tests can run without infrastructure:

```bash
# Run all unit tests
npm test -- --run tests/unit/api/

# Run specific test file
npm test -- --run tests/unit/api/APIGateway.unit.test.ts
```

### Running Integration Tests

Integration tests require full infrastructure:

```bash
# Start infrastructure
docker-compose up -d

# Run integration tests
npm test -- --run tests/integration/api/

# Run specific integration test
npm test -- --run tests/integration/api/APIGateway.integration.test.ts
```

## Test Coverage

The integration tests cover:

### API Gateway Core
- ✅ Server initialization and configuration
- ✅ Health check endpoints with service status
- ✅ CORS handling and preflight requests
- ✅ Request/response middleware (logging, IDs, etc.)
- ✅ Global error handling and formatting
- ✅ Route registration and validation
- ✅ API documentation serving

### REST API Endpoints
- ✅ Graph operations (search, examples, dependencies, entities, relationships)
- ✅ Test management (planning, recording, coverage, performance)
- ✅ Documentation, security, code analysis, design, impact analysis routes
- ✅ Input validation and error responses
- ✅ Pagination and filtering
- ✅ Authentication/authorization handling

### WebSocket Functionality
- ✅ WebSocket server setup and connection handling
- ✅ Message protocol and JSON handling
- ✅ Real-time graph updates and subscriptions
- ✅ Connection management and cleanup
- ✅ Broadcasting to multiple clients
- ✅ Heartbeat and ping/pong handling

### MCP Server Integration
- ✅ MCP server initialization and tool registration
- ✅ Tool listing and discovery
- ✅ Tool execution via REST and protocol endpoints
- ✅ JSON-RPC 2.0 protocol compliance
- ✅ Error handling and validation
- ✅ Concurrent tool execution performance

### Middleware Components
- ✅ Rate limiting (default, search-specific, admin-specific)
- ✅ Input validation and sanitization
- ✅ CORS configuration and multiple origins
- ✅ Request logging and response tracking
- ✅ Security headers and XSS prevention
- ✅ Timeout handling and size limits
- ✅ Concurrent request isolation

### End-to-End Scenarios
- ✅ Complete design-to-implementation workflows
- ✅ Code analysis and testing pipelines
- ✅ Multi-user concurrent operations
- ✅ Error recovery and system resilience
- ✅ Data consistency validation
- ✅ Performance under sustained load

### Performance Characteristics
- ✅ Response time benchmarks (health checks, searches, operations)
- ✅ Concurrent load handling (5, 10, 20+ simultaneous requests)
- ✅ Memory usage and leak detection
- ✅ Database query performance
- ✅ Caching effectiveness
- ✅ Scalability testing (increasing load levels)
- ✅ Burst traffic handling

### tRPC Integration
- ✅ tRPC router setup and procedure registration
- ✅ Procedure calls and parameter validation
- ✅ Context and authentication handling
- ✅ Subscription support
- ✅ Batch requests and notifications
- ✅ Protocol compliance and error handling
- ✅ Performance and HTTP integration

## Test Quality Features

### Comprehensive Coverage
- Happy path testing
- Error scenario testing
- Edge case handling
- Performance benchmarking
- Load testing
- Concurrent operation testing

### Realistic Test Data
- Uses actual database fixtures
- Tests with real service configurations
- Validates actual API responses
- Tests cross-service interactions

### Production-Ready Validation
- Tests error handling and recovery
- Validates security configurations
- Tests performance under load
- Validates data consistency
- Tests graceful degradation

### Maintainable Test Structure
- Clear test organization and naming
- Reusable test utilities and helpers
- Proper setup and teardown
- Mock implementations for unit tests
- Integration test data management

## Usage in CI/CD

These tests are designed to run in CI/CD pipelines:

1. **Unit tests** run first (fast, no infrastructure needed)
2. **Integration tests** run after infrastructure is deployed
3. **Performance tests** run as part of performance regression testing
4. **End-to-end tests** run as final validation

Example CI configuration:

```yaml
stages:
  - test
  - integration
  - performance

unit-tests:
  stage: test
  script:
    - npm test -- --run tests/unit/

integration-tests:
  stage: integration
  services:
    - docker:dind
  script:
    - docker-compose up -d
    - npm test -- --run tests/integration/
  dependencies:
    - unit-tests

performance-tests:
  stage: performance
  script:
    - npm test -- --run tests/integration/api/Performance.integration.test.ts
  dependencies:
    - integration-tests
```

This comprehensive test suite ensures the API Gateway and all its components work correctly in isolation and integration, providing confidence in deployments and catching regressions early.
