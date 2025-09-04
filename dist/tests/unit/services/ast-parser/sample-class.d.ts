/**
 * Sample TypeScript class for ASTParser testing
 * @deprecated This is a deprecated class for testing purposes
 */
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
export declare abstract class BaseService {
    protected config: UserConfig;
    private eventEmitter;
    constructor(config: UserConfig);
    abstract execute(): Promise<void>;
    protected emit(event: string, data: any): void;
    getConfig(): UserConfig;
}
export declare class UserService extends BaseService implements UserConfig {
    private users;
    name: string;
    age: number;
    email?: string;
    preferences: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
    constructor(config: UserConfig);
    execute(): Promise<void>;
    createUser(userData: Omit<UserConfig, 'preferences'> & {
        role: UserRole;
    }): Promise<string>;
    getUser(userId: string): UserConfig | undefined;
    updateUser(userId: string, updates: Partial<UserConfig>): boolean;
    deleteUser(userId: string): boolean;
    private validateEmail;
}
export declare function createUserService(config: UserConfig): UserService;
export declare const DEFAULT_CONFIG: UserConfig;
//# sourceMappingURL=sample-class.d.ts.map