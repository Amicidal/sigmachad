export const sampleProjectFiles = {
  'src/types/User.ts': `
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}
`,

  'src/repositories/UserRepository.ts': `
import { User, CreateUserData, UpdateUserData } from '../types/User';
import { Repository } from './base/Repository';

export class UserRepository extends Repository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.save(user);
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    return this.save(updatedUser);
  }
}
`,

  'src/repositories/base/Repository.ts': `
export abstract class Repository<T extends { id: string }> {
  protected items: Map<string, T> = new Map();

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }

  async findOne(criteria: Partial<T>): Promise<T | null> {
    for (const item of this.items.values()) {
      if (this.matches(item, criteria)) {
        return item;
      }
    }
    return null;
  }

  async findAll(criteria?: Partial<T>): Promise<T[]> {
    const items = Array.from(this.items.values());
    if (!criteria) return items;

    return items.filter(item => this.matches(item, criteria));
  }

  async save(entity: T): Promise<T> {
    this.items.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  protected generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private matches(item: T, criteria: Partial<T>): boolean {
    return Object.entries(criteria).every(([key, value]) =>
      item[key as keyof T] === value
    );
  }
}
`,

  'src/services/UserService.ts': `
import { User, CreateUserData, UpdateUserData } from '../types/User';
import { UserRepository } from '../repositories/UserRepository';
import { ValidationService } from './ValidationService';
import { EmailService } from './EmailService';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private validationService: ValidationService,
    private emailService: EmailService
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    await this.validationService.validateCreateUser(data);

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.userRepository.create(data);
    await this.emailService.sendWelcomeEmail(user);

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User | null> {
    await this.validationService.validateUpdateUser(data);

    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use by another user');
      }
    }

    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) return false;

    await this.emailService.sendGoodbyeEmail(user);
    return this.userRepository.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
`,

  'src/services/ValidationService.ts': `
import { CreateUserData, UpdateUserData } from '../types/User';

export class ValidationService {
  async validateCreateUser(data: CreateUserData): Promise<void> {
    this.validateEmail(data.email);
    this.validateName(data.name);
  }

  async validateUpdateUser(data: UpdateUserData): Promise<void> {
    if (data.email) {
      this.validateEmail(data.email);
    }
    if (data.name) {
      this.validateName(data.name);
    }
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
  }
}
`,

  'src/services/EmailService.ts': `
import { User } from '../types/User';

export class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> {
    console.log(\`Sending welcome email to \${user.email}\`);
    // Email sending logic would go here
  }

  async sendGoodbyeEmail(user: User): Promise<void> {
    console.log(\`Sending goodbye email to \${user.email}\`);
    // Email sending logic would go here
  }

  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    console.log(\`Sending password reset email to \${user.email} with token \${resetToken}\`);
    // Email sending logic would go here
  }
}
`,

  'src/controllers/UserController.ts': `
import { UserService } from '../services/UserService';
import { CreateUserData, UpdateUserData } from '../types/User';

export class UserController {
  constructor(private userService: UserService) {}

  async createUser(request: { body: CreateUserData }) {
    try {
      const user = await this.userService.createUser(request.body);
      return { status: 201, data: user };
    } catch (error) {
      return { status: 400, error: error.message };
    }
  }

  async getUser(request: { params: { id: string } }) {
    const user = await this.userService.getUserById(request.params.id);
    if (!user) {
      return { status: 404, error: 'User not found' };
    }
    return { status: 200, data: user };
  }

  async updateUser(request: { params: { id: string }; body: UpdateUserData }) {
    try {
      const user = await this.userService.updateUser(request.params.id, request.body);
      if (!user) {
        return { status: 404, error: 'User not found' };
      }
      return { status: 200, data: user };
    } catch (error) {
      return { status: 400, error: error.message };
    }
  }

  async deleteUser(request: { params: { id: string } }) {
    const deleted = await this.userService.deleteUser(request.params.id);
    if (!deleted) {
      return { status: 404, error: 'User not found' };
    }
    return { status: 204 };
  }

  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return { status: 200, data: users };
  }
}
`,

  'src/index.ts': `
import { UserRepository } from './repositories/UserRepository';
import { ValidationService } from './services/ValidationService';
import { EmailService } from './services/EmailService';
import { UserService } from './services/UserService';
import { UserController } from './controllers/UserController';

// Dependency injection setup
const userRepository = new UserRepository();
const validationService = new ValidationService();
const emailService = new EmailService();
const userService = new UserService(userRepository, validationService, emailService);
const userController = new UserController(userService);

export {
  userRepository,
  validationService,
  emailService,
  userService,
  userController,
};

export * from './types/User';
export * from './services/UserService';
export * from './controllers/UserController';
`
};

export const sampleProjectStructure = [
  'src/types/User.ts',
  'src/repositories/UserRepository.ts',
  'src/repositories/base/Repository.ts',
  'src/services/UserService.ts',
  'src/services/ValidationService.ts',
  'src/services/EmailService.ts',
  'src/controllers/UserController.ts',
  'src/index.ts',
];

export function getSampleProjectFile(path: string): string {
  return sampleProjectFiles[path] || '';
}

export function getAllSampleProjectFiles(): Array<{ path: string; content: string }> {
  return Object.entries(sampleProjectFiles).map(([path, content]) => ({
    path,
    content,
  }));
}