import type { IPostgreSQLService } from "../../services/database/interfaces.js";
import type { SessionCheckpointJobPersistence, SessionCheckpointJobSnapshot } from "../SessionCheckpointTypes.js";
export declare class PostgresSessionCheckpointJobStore implements SessionCheckpointJobPersistence {
    private readonly postgres;
    private initialized;
    constructor(postgres: IPostgreSQLService);
    initialize(): Promise<void>;
    loadPending(): Promise<SessionCheckpointJobSnapshot[]>;
    upsert(job: SessionCheckpointJobSnapshot): Promise<void>;
    delete(jobId: string): Promise<void>;
    loadDeadLetters(): Promise<SessionCheckpointJobSnapshot[]>;
    private ensureInitialized;
    private mapRow;
    private normalizePayload;
    private normalizeStatus;
    private safeParseJson;
}
//# sourceMappingURL=PostgresSessionCheckpointJobStore.d.ts.map