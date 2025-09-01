/**
 * Global test setup for Jest
 * Ensures proper test isolation and cleanup between test suites
 */
import { DatabaseService } from '../src/services/DatabaseService';
declare let globalDbService: DatabaseService | null;
export default function (): Promise<void>;
export { globalDbService as dbService };
//# sourceMappingURL=setup.d.ts.map