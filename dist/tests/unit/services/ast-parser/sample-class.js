/**
 * Sample TypeScript class for ASTParser testing
 * @deprecated This is a deprecated class for testing purposes
 */
import { EventEmitter } from 'events';
export class BaseService {
    config;
    eventEmitter;
    constructor(config) {
        this.config = config;
        this.eventEmitter = new EventEmitter();
    }
    emit(event, data) {
        this.eventEmitter.emit(event, data);
    }
    getConfig() {
        return this.config;
    }
}
export class UserService extends BaseService {
    users = new Map();
    name;
    age;
    email;
    preferences;
    constructor(config) {
        super(config);
        this.name = config.name;
        this.age = config.age;
        this.email = config.email;
        this.preferences = config.preferences;
    }
    async execute() {
        console.log(`Executing UserService for ${this.name}`);
        this.emit('user:executed', { userId: this.name });
    }
    async createUser(userData) {
        const userId = `user_${Date.now()}`;
        const user = {
            ...userData,
            preferences: { theme: 'light', notifications: true }
        };
        this.users.set(userId, user);
        this.emit('user:created', { userId, user });
        return userId;
    }
    getUser(userId) {
        return this.users.get(userId);
    }
    updateUser(userId, updates) {
        const existing = this.users.get(userId);
        if (!existing)
            return false;
        this.users.set(userId, { ...existing, ...updates });
        this.emit('user:updated', { userId, updates });
        return true;
    }
    deleteUser(userId) {
        const deleted = this.users.delete(userId);
        if (deleted) {
            this.emit('user:deleted', { userId });
        }
        return deleted;
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
export function createUserService(config) {
    return new UserService(config);
}
export const DEFAULT_CONFIG = {
    name: 'Default User',
    age: 25,
    preferences: {
        theme: 'light',
        notifications: true
    }
};
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
// Modified for test
//# sourceMappingURL=sample-class.js.map