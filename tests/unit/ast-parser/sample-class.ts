/**
 * Sample TypeScript class for ASTParser testing
 * @deprecated This is a deprecated class for testing purposes
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import path from 'path';

export interface UserConfig {
  name: string;
  age: number;
  email?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export type UserRole = 'admin' | 'user' | 'guest';

export abstract class BaseService {
  protected config: UserConfig;
  private eventEmitter: EventEmitter;

  constructor(config: UserConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
  }

  abstract execute(): Promise<void>;

  protected emit(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }

  public getConfig(): UserConfig {
    return this.config;
  }
}

export class UserService extends BaseService implements UserConfig {
  private users: Map<string, UserConfig> = new Map();
  public name: string;
  public age: number;
  public email?: string;
  public preferences: { theme: 'light' | 'dark'; notifications: boolean };

  constructor(config: UserConfig) {
    super(config);
    this.name = config.name;
    this.age = config.age;
    this.email = config.email;
    this.preferences = config.preferences;
  }

  async execute(): Promise<void> {
    console.log(`Executing UserService for ${this.name}`);
    this.emit('user:executed', { userId: this.name });
  }

  public async createUser(userData: Omit<UserConfig, 'preferences'> & { role: UserRole }): Promise<string> {
    const userId = `user_${Date.now()}`;
    const user: UserConfig = {
      ...userData,
      preferences: { theme: 'light', notifications: true }
    };

    this.users.set(userId, user);
    this.emit('user:created', { userId, user });
    return userId;
  }

  public getUser(userId: string): UserConfig | undefined {
    return this.users.get(userId);
  }

  public updateUser(userId: string, updates: Partial<UserConfig>): boolean {
    const existing = this.users.get(userId);
    if (!existing) return false;

    this.users.set(userId, { ...existing, ...updates });
    this.emit('user:updated', { userId, updates });
    return true;
  }

  public deleteUser(userId: string): boolean {
    const deleted = this.users.delete(userId);
    if (deleted) {
      this.emit('user:deleted', { userId });
    }
    return deleted;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export function createUserService(config: UserConfig): UserService {
  return new UserService(config);
}

export const DEFAULT_CONFIG: UserConfig = {
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