/**
 * Sample TypeScript interface and type definitions for ASTParser testing
 */
export var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OK"] = 200] = "OK";
    HttpStatus[HttpStatus["CREATED"] = 201] = "CREATED";
    HttpStatus[HttpStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatus[HttpStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatus[HttpStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatus[HttpStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(HttpStatus || (HttpStatus = {}));
export class BaseRepository {
    items = new Map();
    async findById(id) {
        return this.items.get(id) || null;
    }
    async findAll() {
        return Array.from(this.items.values());
    }
    async create(item) {
        const newItem = { ...item, id: this.generateId() };
        if (!this.validate(newItem)) {
            throw new Error('Invalid item data');
        }
        this.items.set(newItem.id, newItem);
        return newItem;
    }
    async update(id, updates) {
        const existing = this.items.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates };
        if (!this.validate(updated)) {
            throw new Error('Invalid update data');
        }
        this.items.set(id, updated);
        return updated;
    }
    async delete(id) {
        return this.items.delete(id);
    }
    generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}
export class UserRepository extends BaseRepository {
    validate(item) {
        return !!(item.name && item.email && item.role);
    }
    async findByEmail(email) {
        for (const user of this.items.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }
}
export function createLogger(config) {
    return {
        log: (level, message, meta) => {
            if (shouldLog(level, config.level)) {
                const entry = {
                    timestamp: new Date().toISOString(),
                    level,
                    message,
                    ...meta
                };
                if (config.format === 'json') {
                    console.log(JSON.stringify(entry));
                }
                else {
                    console.log(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`);
                }
            }
        },
        debug: (message, meta) => this.log('debug', message, meta),
        info: (message, meta) => this.log('info', message, meta),
        warn: (message, meta) => this.log('warn', message, meta),
        error: (message, meta) => this.log('error', message, meta),
    };
}
function shouldLog(messageLevel, configLevel) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(messageLevel) >= levels.indexOf(configLevel);
}
//# sourceMappingURL=sample-interface.js.map