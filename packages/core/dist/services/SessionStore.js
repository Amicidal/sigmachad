/**
 * Session Store Implementation
 *
 * Redis-backed session storage providing high-performance ephemeral storage
 * for multi-agent session coordination with TTL-based cleanup
 */
import * as Redis from 'redis';
import { EventEmitter } from 'events';
import { SessionError, SessionNotFoundError, } from './SessionTypes.js';
export class SessionStore extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.redis = this.createRedisClient();
        this.pubClient = this.createRedisClient();
        this.subClient = this.createRedisClient();
        this.initialize();
    }
    createRedisClient() {
        const clientConfig = {
            url: this.config.url,
            socket: {
                host: this.config.host || 'localhost',
                port: this.config.port || 6379,
                reconnectStrategy: (retries) => {
                    if (retries >= this.maxReconnectAttempts) {
                        this.emit('error', new SessionError('Max reconnection attempts reached', 'REDIS_CONNECTION_FAILED'));
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
            password: this.config.password,
            database: this.config.db || 0,
        };
        const client = Redis.createClient(clientConfig);
        client.on('error', (err) => {
            console.error('[SessionStore] Redis error:', err);
            this.emit('error', new SessionError(`Redis client error: ${err.message}`, 'REDIS_CLIENT_ERROR', undefined, { originalError: err }));
        });
        client.on('connect', () => {
            console.log('[SessionStore] Redis client connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });
        client.on('ready', () => {
            console.log('[SessionStore] Redis client ready');
            this.emit('ready');
        });
        client.on('end', () => {
            console.log('[SessionStore] Redis client disconnected');
            this.isConnected = false;
            this.emit('disconnected');
        });
        return client;
    }
    async initialize() {
        try {
            await Promise.all([
                this.redis.connect(),
                this.pubClient.connect(),
                this.subClient.connect(),
            ]);
            console.log('[SessionStore] Successfully connected to Redis');
        }
        catch (error) {
            console.error('[SessionStore] Failed to connect to Redis:', error);
            throw new SessionError('Failed to initialize Redis connection', 'REDIS_INIT_FAILED', undefined, { originalError: error });
        }
    }
    // ========== Session CRUD Operations ==========
    async createSession(sessionId, agentId, options = {}) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const eventsKey = this.getEventsKey(sessionId);
            const ttl = options.ttl || 3600; // 1 hour default
            // Check if session already exists
            const exists = await this.redis.exists(sessionKey);
            if (exists) {
                throw new SessionError(`Session already exists: ${sessionId}`, 'SESSION_EXISTS', sessionId);
            }
            // Create session document
            const sessionData = {
                agentIds: JSON.stringify([agentId]),
                state: 'working',
                events: '0', // Initial event count
                metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
            };
            // Store session data
            await this.redis.hSet(sessionKey, sessionData);
            await this.redis.expire(sessionKey, ttl);
            // Initialize events ZSET
            await this.redis.zAdd(eventsKey, { score: 0, value: 'INIT' });
            await this.redis.expire(eventsKey, ttl);
            // Optional: Add initial event if entity IDs provided
            if (options.initialEntityIds && options.initialEntityIds.length > 0) {
                const initialEvent = {
                    seq: 1,
                    type: 'start',
                    timestamp: new Date().toISOString(),
                    changeInfo: {
                        elementType: 'session',
                        entityIds: options.initialEntityIds,
                        operation: 'init',
                    },
                    actor: agentId,
                };
                await this.addEvent(sessionId, initialEvent);
            }
            this.emit('session:created', { sessionId, agentId, options });
            console.log(`[SessionStore] Created session ${sessionId} for agent ${agentId}`);
        }
        catch (error) {
            console.error(`[SessionStore] Failed to create session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to create session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`, 'SESSION_CREATE_FAILED', sessionId, { originalError: error });
        }
    }
    async getSession(sessionId) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const exists = await this.redis.exists(sessionKey);
            if (!exists) {
                return null;
            }
            const sessionData = await this.redis.hGetAll(sessionKey);
            if (!sessionData || Object.keys(sessionData).length === 0) {
                return null;
            }
            // Get recent events (last 50)
            const events = await this.getRecentEvents(sessionId, 50);
            const session = {
                sessionId,
                agentIds: JSON.parse(sessionData.agentIds || '[]'),
                state: sessionData.state,
                events,
                metadata: sessionData.metadata ? JSON.parse(sessionData.metadata) : undefined,
            };
            return session;
        }
        catch (error) {
            console.error(`[SessionStore] Failed to get session ${sessionId}:`, error);
            throw new SessionError(`Failed to get session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`, 'SESSION_GET_FAILED', sessionId, { originalError: error });
        }
    }
    async updateSession(sessionId, updates) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const exists = await this.redis.exists(sessionKey);
            if (!exists) {
                throw new SessionNotFoundError(sessionId);
            }
            const updateData = {};
            if (updates.agentIds) {
                updateData.agentIds = JSON.stringify(updates.agentIds);
            }
            if (updates.state) {
                updateData.state = updates.state;
            }
            if (updates.metadata) {
                updateData.metadata = JSON.stringify(updates.metadata);
            }
            if (Object.keys(updateData).length > 0) {
                await this.redis.hSet(sessionKey, updateData);
            }
            this.emit('session:updated', { sessionId, updates });
        }
        catch (error) {
            console.error(`[SessionStore] Failed to update session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to update session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`, 'SESSION_UPDATE_FAILED', sessionId, { originalError: error });
        }
    }
    async deleteSession(sessionId) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const eventsKey = this.getEventsKey(sessionId);
            const deletedCount = await this.redis.del(sessionKey) + await this.redis.del(eventsKey);
            if (deletedCount === 0) {
                console.warn(`[SessionStore] Session ${sessionId} was already deleted or didn't exist`);
            }
            this.emit('session:deleted', { sessionId });
            console.log(`[SessionStore] Deleted session ${sessionId}`);
        }
        catch (error) {
            console.error(`[SessionStore] Failed to delete session ${sessionId}:`, error);
            throw new SessionError(`Failed to delete session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`, 'SESSION_DELETE_FAILED', sessionId, { originalError: error });
        }
    }
    // ========== Event Operations ==========
    async addEvent(sessionId, event) {
        var _a;
        try {
            const eventsKey = this.getEventsKey(sessionId);
            const sessionKey = this.getSessionKey(sessionId);
            // Check if session exists
            const exists = await this.redis.exists(sessionKey);
            if (!exists) {
                throw new SessionNotFoundError(sessionId);
            }
            // Add event to ZSET (score = seq for ordering)
            const eventJson = JSON.stringify(event);
            await this.redis.zAdd(eventsKey, { score: event.seq, value: eventJson });
            // Update session state if needed
            if ((_a = event.stateTransition) === null || _a === void 0 ? void 0 : _a.to) {
                await this.redis.hSet(sessionKey, 'state', event.stateTransition.to);
            }
            this.emit('event:added', { sessionId, event });
        }
        catch (error) {
            console.error(`[SessionStore] Failed to add event to session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to add event: ${error instanceof Error ? error.message : String(error)}`, 'EVENT_ADD_FAILED', sessionId, { originalError: error, event });
        }
    }
    async getEvents(sessionId, fromSeq, toSeq) {
        try {
            const eventsKey = this.getEventsKey(sessionId);
            let events;
            if (fromSeq !== undefined && toSeq !== undefined) {
                events = await this.redis.zRangeByScore(eventsKey, fromSeq, toSeq);
            }
            else if (fromSeq !== undefined) {
                events = await this.redis.zRangeByScore(eventsKey, fromSeq, '+inf');
            }
            else if (toSeq !== undefined) {
                events = await this.redis.zRangeByScore(eventsKey, '-inf', toSeq);
            }
            else {
                events = await this.redis.zRange(eventsKey, 0, -1);
            }
            return events
                .filter(event => event !== 'INIT') // Filter out initialization marker
                .map(eventStr => JSON.parse(eventStr))
                .sort((a, b) => a.seq - b.seq);
        }
        catch (error) {
            console.error(`[SessionStore] Failed to get events for session ${sessionId}:`, error);
            throw new SessionError(`Failed to get events: ${error instanceof Error ? error.message : String(error)}`, 'EVENTS_GET_FAILED', sessionId, { originalError: error, fromSeq, toSeq });
        }
    }
    async getRecentEvents(sessionId, limit = 20) {
        try {
            const eventsKey = this.getEventsKey(sessionId);
            const events = await this.redis.zRange(eventsKey, -limit, -1);
            return events
                .filter(event => event !== 'INIT')
                .map(eventStr => JSON.parse(eventStr))
                .sort((a, b) => a.seq - b.seq);
        }
        catch (error) {
            console.error(`[SessionStore] Failed to get recent events for session ${sessionId}:`, error);
            throw new SessionError(`Failed to get recent events: ${error instanceof Error ? error.message : String(error)}`, 'RECENT_EVENTS_GET_FAILED', sessionId, { originalError: error, limit });
        }
    }
    // ========== Agent Management ==========
    async addAgent(sessionId, agentId) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const sessionData = await this.redis.hGetAll(sessionKey);
            if (!sessionData.agentIds) {
                throw new SessionNotFoundError(sessionId);
            }
            const agents = new Set(JSON.parse(sessionData.agentIds));
            agents.add(agentId);
            await this.redis.hSet(sessionKey, 'agentIds', JSON.stringify(Array.from(agents)));
            this.emit('agent:added', { sessionId, agentId });
        }
        catch (error) {
            console.error(`[SessionStore] Failed to add agent ${agentId} to session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to add agent: ${error instanceof Error ? error.message : String(error)}`, 'AGENT_ADD_FAILED', sessionId, { originalError: error, agentId });
        }
    }
    async removeAgent(sessionId, agentId) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const sessionData = await this.redis.hGetAll(sessionKey);
            if (!sessionData.agentIds) {
                throw new SessionNotFoundError(sessionId);
            }
            const agents = new Set(JSON.parse(sessionData.agentIds));
            agents.delete(agentId);
            if (agents.size === 0) {
                // If no agents left, mark session for cleanup
                await this.setTTL(sessionId, 300); // 5 minutes grace period
            }
            else {
                await this.redis.hSet(sessionKey, 'agentIds', JSON.stringify(Array.from(agents)));
            }
            this.emit('agent:removed', { sessionId, agentId });
        }
        catch (error) {
            console.error(`[SessionStore] Failed to remove agent ${agentId} from session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to remove agent: ${error instanceof Error ? error.message : String(error)}`, 'AGENT_REMOVE_FAILED', sessionId, { originalError: error, agentId });
        }
    }
    // ========== Utility Methods ==========
    async setTTL(sessionId, ttl) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            const eventsKey = this.getEventsKey(sessionId);
            await Promise.all([
                this.redis.expire(sessionKey, ttl),
                this.redis.expire(eventsKey, ttl),
            ]);
        }
        catch (error) {
            console.error(`[SessionStore] Failed to set TTL for session ${sessionId}:`, error);
            throw new SessionError(`Failed to set TTL: ${error instanceof Error ? error.message : String(error)}`, 'TTL_SET_FAILED', sessionId, { originalError: error, ttl });
        }
    }
    async exists(sessionId) {
        try {
            const sessionKey = this.getSessionKey(sessionId);
            return (await this.redis.exists(sessionKey)) === 1;
        }
        catch (error) {
            console.error(`[SessionStore] Failed to check existence of session ${sessionId}:`, error);
            return false;
        }
    }
    // ========== Pub/Sub Operations ==========
    async publishSessionUpdate(sessionId, message) {
        try {
            const channel = `session:${sessionId}`;
            await this.pubClient.publish(channel, JSON.stringify(message));
        }
        catch (error) {
            console.error(`[SessionStore] Failed to publish update for session ${sessionId}:`, error);
            throw new SessionError(`Failed to publish update: ${error instanceof Error ? error.message : String(error)}`, 'PUBLISH_FAILED', sessionId, { originalError: error, message });
        }
    }
    async subscribeToSession(sessionId, callback) {
        try {
            const channel = `session:${sessionId}`;
            await this.subClient.subscribe(channel, (message) => {
                try {
                    const parsed = JSON.parse(message);
                    callback(parsed);
                }
                catch (error) {
                    console.error(`[SessionStore] Failed to parse pub/sub message:`, error);
                }
            });
        }
        catch (error) {
            console.error(`[SessionStore] Failed to subscribe to session ${sessionId}:`, error);
            throw new SessionError(`Failed to subscribe: ${error instanceof Error ? error.message : String(error)}`, 'SUBSCRIBE_FAILED', sessionId, { originalError: error });
        }
    }
    // ========== Administrative Operations ==========
    async getStats() {
        try {
            const keys = await this.redis.keys('session:*');
            const activeSessions = keys.length;
            let totalEvents = 0;
            let checkpointsCreated = 0;
            const uniqueAgents = new Set();
            // Sample stats from active sessions
            for (const key of keys.slice(0, 100)) { // Sample first 100 sessions
                const sessionData = await this.redis.hGetAll(key);
                if (sessionData.agentIds) {
                    const agents = JSON.parse(sessionData.agentIds);
                    agents.forEach(agent => uniqueAgents.add(agent));
                }
                const eventsKey = key.replace('session:', 'events:');
                const eventCount = await this.redis.zCard(eventsKey);
                totalEvents += eventCount;
            }
            // Memory usage not available in standard redis client
            const memoryUsage = 0;
            return {
                activeSessions,
                totalEvents,
                averageEventsPerSession: activeSessions > 0 ? totalEvents / activeSessions : 0,
                checkpointsCreated, // TODO: Track this separately
                failureSnapshots: 0, // TODO: Track this separately
                agentsActive: uniqueAgents.size,
                redisMemoryUsage: memoryUsage || 0,
            };
        }
        catch (error) {
            console.error('[SessionStore] Failed to get stats:', error);
            throw new SessionError(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`, 'STATS_FAILED', undefined, { originalError: error });
        }
    }
    async listActiveSessions() {
        try {
            const keys = await this.redis.keys('session:*');
            return keys.map(key => key.replace('session:', ''));
        }
        catch (error) {
            console.error('[SessionStore] Failed to list active sessions:', error);
            throw new SessionError(`Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`, 'LIST_SESSIONS_FAILED', undefined, { originalError: error });
        }
    }
    async cleanup() {
        try {
            // Find expired sessions (TTL = -1 means expired)
            const keys = await this.redis.keys('session:*');
            const expiredKeys = [];
            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl === -1) { // Expired
                    expiredKeys.push(key);
                    expiredKeys.push(key.replace('session:', 'events:'));
                }
            }
            if (expiredKeys.length > 0) {
                for (const key of expiredKeys) {
                    await this.redis.del(key);
                }
                console.log(`[SessionStore] Cleaned up ${expiredKeys.length} expired keys`);
            }
        }
        catch (error) {
            console.error('[SessionStore] Failed to cleanup expired sessions:', error);
        }
    }
    // ========== Cleanup ==========
    async close() {
        try {
            await Promise.all([
                this.redis.quit(),
                this.pubClient.quit(),
                this.subClient.quit(),
            ]);
            this.isConnected = false;
            this.emit('closed');
            console.log('[SessionStore] Closed Redis connections');
        }
        catch (error) {
            console.error('[SessionStore] Error closing Redis connections:', error);
            throw new SessionError(`Failed to close connections: ${error instanceof Error ? error.message : String(error)}`, 'CLOSE_FAILED', undefined, { originalError: error });
        }
    }
    // ========== Private Helpers ==========
    getSessionKey(sessionId) {
        return `session:${sessionId}`;
    }
    getEventsKey(sessionId) {
        return `events:${sessionId}`;
    }
    // ========== Health Check ==========
    async healthCheck() {
        const start = Date.now();
        try {
            await this.redis.ping();
            return {
                healthy: true,
                latency: Date.now() - start,
            };
        }
        catch (error) {
            return {
                healthy: false,
                latency: Date.now() - start,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            };
        }
    }
}
//# sourceMappingURL=SessionStore.js.map