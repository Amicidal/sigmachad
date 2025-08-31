/**
 * API Gateway for Memento
 * Main entry point for all API interactions (REST, WebSocket, GraphQL)
 */
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createTRPCContext, appRouter } from './trpc/router.js';
// Import route handlers
import { registerDesignRoutes } from './routes/design.js';
import { registerTestRoutes } from './routes/tests.js';
import { registerGraphRoutes } from './routes/graph.js';
import { registerCodeRoutes } from './routes/code.js';
import { registerImpactRoutes } from './routes/impact.js';
// import { registerVDBRoutes } from './routes/vdb.js';
import { registerSCMRoutes } from './routes/scm.js';
import { registerDocsRoutes } from './routes/docs.js';
import { registerSecurityRoutes } from './routes/security.js';
import { registerAdminRoutes } from './routes/admin.js';
export class APIGateway {
    kgService;
    dbService;
    fileWatcher;
    astParser;
    app;
    config;
    constructor(kgService, dbService, fileWatcher, astParser, config = {}) {
        this.kgService = kgService;
        this.dbService = dbService;
        this.fileWatcher = fileWatcher;
        this.astParser = astParser;
        this.config = {
            port: config.port || 3000,
            host: config.host || '0.0.0.0',
            cors: {
                origin: config.cors?.origin || ['http://localhost:3000', 'http://localhost:5173'],
                credentials: config.cors?.credentials ?? true,
            },
            rateLimit: {
                max: config.rateLimit?.max || 100,
                timeWindow: config.rateLimit?.timeWindow || '1 minute',
            },
        };
        this.app = Fastify({
            logger: {
                level: process.env.LOG_LEVEL || 'info',
            },
            disableRequestLogging: false,
            ignoreTrailingSlash: true,
        });
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // CORS
        this.app.register(fastifyCors, this.config.cors);
        // WebSocket support
        this.app.register(fastifyWebsocket);
        // Request ID middleware
        this.app.addHook('onRequest', (request, reply, done) => {
            request.id = request.headers['x-request-id'] || this.generateRequestId();
            reply.header('x-request-id', request.id);
            done();
        });
        // Request logging middleware
        this.app.addHook('onRequest', (request, reply, done) => {
            request.log.info({
                method: request.method,
                url: request.url,
                userAgent: request.headers['user-agent'],
                ip: request.ip,
            });
            done();
        });
        // Response logging middleware
        this.app.addHook('onResponse', (request, reply, done) => {
            request.log.info({
                statusCode: reply.statusCode,
                responseTime: reply.elapsedTime,
            });
            done();
        });
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', async (request, reply) => {
            const health = await this.dbService.healthCheck();
            const isHealthy = Object.values(health).every(status => status !== false);
            reply.status(isHealthy ? 200 : 503).send({
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                services: health,
                uptime: process.uptime(),
            });
        });
        // OpenAPI documentation endpoint
        this.app.get('/docs', async (request, reply) => {
            const { openApiSpec } = await import('./trpc/openapi.js');
            reply.send(openApiSpec);
        });
        // Test route to verify registration is working
        this.app.get('/api/v1/test', async (request, reply) => {
            reply.send({ message: 'Route registration is working!', timestamp: new Date().toISOString() });
        });
        // API v1 routes
        this.app.register(async (app) => {
            try {
                // Register all route modules
                registerDesignRoutes(app, this.kgService, this.dbService);
                registerTestRoutes(app, this.kgService, this.dbService);
                registerGraphRoutes(app, this.kgService, this.dbService);
                registerCodeRoutes(app, this.kgService, this.dbService, this.astParser);
                registerImpactRoutes(app, this.kgService, this.dbService);
                // registerVDBRoutes(app, this.kgService, this.dbService); // Commented out - file removed
                registerSCMRoutes(app, this.kgService, this.dbService);
                registerDocsRoutes(app, this.kgService, this.dbService);
                registerSecurityRoutes(app, this.kgService, this.dbService);
                registerAdminRoutes(app, this.kgService, this.dbService, this.fileWatcher);
                console.log('✅ All route modules registered successfully');
            }
            catch (error) {
                console.error('❌ Error registering routes:', error);
            }
        }, { prefix: '/api/v1' });
        // Register tRPC routes
        this.app.register(fastifyTRPCPlugin, {
            prefix: '/api/trpc',
            trpcOptions: {
                router: appRouter,
                createContext: () => createTRPCContext({
                    kgService: this.kgService,
                    dbService: this.dbService,
                    astParser: this.astParser,
                    fileWatcher: this.fileWatcher,
                }),
            },
        });
        // WebSocket support for real-time updates
        this.app.register(async (app) => {
            app.get('/ws', { websocket: true }, (connection, request) => {
                console.log('WebSocket connection established');
                // Send initial connection message
                connection.socket.send(JSON.stringify({
                    type: 'connected',
                    timestamp: new Date().toISOString(),
                }));
                // Handle incoming messages
                connection.socket.on('message', (message, isBinary) => {
                    try {
                        const data = JSON.parse(message.toString());
                        this.handleWebSocketMessage(connection, data);
                    }
                    catch (error) {
                        connection.socket.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid message format',
                        }));
                    }
                });
                // Handle disconnection
                connection.socket.on('close', () => {
                    console.log('WebSocket connection closed');
                });
            });
        });
        // GraphQL endpoint (placeholder for future implementation)
        this.app.get('/graphql', async (request, reply) => {
            reply.send({
                message: 'GraphQL endpoint not yet implemented',
                status: 'coming_soon',
            });
        });
        // MCP endpoint (for Claude integration)
        this.app.register(async (app) => {
            app.post('/mcp', async (request, reply) => {
                // This will be handled by the MCP server
                reply.send({ message: 'MCP endpoint' });
            });
        }, { prefix: '/mcp' });
        // 404 handler
        this.app.setNotFoundHandler((request, reply) => {
            reply.status(404).send({
                error: 'Not Found',
                message: `Route ${request.method}:${request.url} not found`,
                requestId: request.id,
            });
        });
    }
    setupErrorHandling() {
        // Global error handler
        this.app.setErrorHandler((error, request, reply) => {
            const statusCode = error.statusCode || 500;
            const isServerError = statusCode >= 500;
            request.log.error({
                error: error.message,
                stack: error.stack,
                statusCode,
                url: request.url,
                method: request.method,
            });
            reply.status(statusCode).send({
                error: {
                    code: this.getErrorCode(error),
                    message: isServerError ? 'Internal Server Error' : error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                },
                requestId: request.id,
                timestamp: new Date().toISOString(),
            });
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    handleWebSocketMessage(connection, data) {
        switch (data.type) {
            case 'subscribe':
                // Handle subscription to real-time updates
                this.handleSubscription(connection, data);
                break;
            case 'ping':
                connection.socket.send(JSON.stringify({
                    type: 'pong',
                    timestamp: new Date().toISOString(),
                }));
                break;
            default:
                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${data.type}`,
                }));
        }
    }
    handleSubscription(connection, data) {
        const { event, filter } = data;
        // Subscribe to file watcher events
        const eventHandler = (change) => {
            if (this.matchesFilter(change, filter)) {
                connection.socket.send(JSON.stringify({
                    type: 'event',
                    event: 'file_change',
                    data: change,
                    timestamp: new Date().toISOString(),
                }));
            }
        };
        this.fileWatcher.on('change', eventHandler);
        // Handle unsubscribe when connection closes
        connection.socket.on('close', () => {
            this.fileWatcher.off('change', eventHandler);
        });
        connection.socket.send(JSON.stringify({
            type: 'subscribed',
            event,
            timestamp: new Date().toISOString(),
        }));
    }
    matchesFilter(change, filter) {
        if (!filter)
            return true;
        if (filter.path && !change.path.includes(filter.path))
            return false;
        if (filter.type && change.type !== filter.type)
            return false;
        return true;
    }
    getErrorCode(error) {
        if (error.code)
            return error.code;
        if (error.name === 'ValidationError')
            return 'VALIDATION_ERROR';
        if (error.name === 'NotFoundError')
            return 'NOT_FOUND';
        return 'INTERNAL_ERROR';
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async start() {
        try {
            await this.app.listen({
                port: this.config.port,
                host: this.config.host,
            });
            console.log(`🚀 Memento API Gateway listening on http://${this.config.host}:${this.config.port}`);
            console.log(`📊 Health check available at http://${this.config.host}:${this.config.port}/health`);
            console.log(`🔌 WebSocket available at ws://${this.config.host}:${this.config.port}/ws`);
        }
        catch (error) {
            console.error('Failed to start API Gateway:', error);
            throw error;
        }
    }
    async stop() {
        await this.app.close();
        console.log('🛑 API Gateway stopped');
    }
    getApp() {
        return this.app;
    }
    // Method to get current configuration
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=APIGateway.js.map