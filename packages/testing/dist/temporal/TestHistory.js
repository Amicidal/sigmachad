/**
 * @file TestHistory.ts
 * @description Historical test data management service
 *
 * Provides comprehensive management of historical test data including snapshots,
 * time-series storage, efficient queries, and data retention policies.
 */
/**
 * Historical test data management service
 */
export class TestHistory {
    constructor(config, retentionPolicy = {}, snapshotConfig = {}) {
        // In-memory storage (in production, these would be database connections)
        this.executions = new Map();
        this.snapshots = new Map();
        this.events = new Map();
        this.relationships = new Map();
        this.config = config;
        this.retentionPolicy = {
            executionRetentionDays: 90,
            snapshotRetentionDays: 365,
            eventRetentionDays: 180,
            archiveBeforeDelete: true,
            compressionThreshold: 30,
            ...retentionPolicy
        };
        this.snapshotConfig = {
            frequency: 'weekly',
            includeMetrics: true,
            includeRelationships: true,
            compressionLevel: 6,
            ...snapshotConfig
        };
    }
    /**
     * Store test execution record
     */
    async storeExecution(execution) {
        const key = `${execution.testId}:${execution.entityId}`;
        if (!this.executions.has(key)) {
            this.executions.set(key, []);
        }
        const executions = this.executions.get(key);
        executions.push(execution);
        // Sort by timestamp to maintain chronological order
        executions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        // Apply retention policy
        await this.applyRetentionPolicy(key, 'executions');
        // Create automatic snapshot if needed
        await this.checkSnapshotCreation(execution.testId, execution.entityId);
    }
    /**
     * Create historical snapshot
     */
    async createSnapshot(testId, entityId, metadata) {
        const key = `${testId}:${entityId}`;
        const executions = this.executions.get(key) || [];
        const latestExecution = executions[executions.length - 1];
        const metrics = this.calculateExecutionMetrics(executions);
        const snapshot = {
            snapshotId: `snapshot_${testId}_${entityId}_${Date.now()}`,
            timestamp: new Date(),
            testId,
            entityId,
            status: latestExecution?.status || 'unknown',
            coverage: latestExecution?.coverage,
            metadata,
            metrics
        };
        if (!this.snapshots.has(key)) {
            this.snapshots.set(key, []);
        }
        this.snapshots.get(key).push(snapshot);
        // Apply retention policy for snapshots
        await this.applyRetentionPolicy(key, 'snapshots');
        return snapshot;
    }
    /**
     * Query historical data
     */
    async queryHistory(query) {
        const executions = await this.queryExecutions(query);
        const events = await this.queryEvents(query);
        const relationships = await this.queryRelationships(query);
        const snapshots = await this.querySnapshots(query);
        return {
            events,
            relationships,
            snapshots,
            trends: [], // Trends would be calculated from the data
            totalCount: executions.length
        };
    }
    /**
     * Get execution history for a test
     */
    async getExecutionHistory(testId, entityId, limit = 100) {
        const key = `${testId}:${entityId}`;
        const executions = this.executions.get(key) || [];
        return executions
            .slice(-limit) // Get the most recent executions
            .reverse(); // Return in reverse chronological order (newest first)
    }
    /**
     * Get snapshots for a time period
     */
    async getSnapshots(testId, entityId, startDate, endDate) {
        const key = `${testId}:${entityId}`;
        const snapshots = this.snapshots.get(key) || [];
        return snapshots.filter(snapshot => snapshot.timestamp >= startDate && snapshot.timestamp <= endDate);
    }
    /**
     * Cleanup old data according to retention policy
     */
    async cleanup(retentionPeriod) {
        const effectiveRetentionDays = retentionPeriod || this.retentionPolicy.executionRetentionDays;
        const cutoffDate = new Date(Date.now() - effectiveRetentionDays * 24 * 60 * 60 * 1000);
        let deletedCount = 0;
        // Cleanup executions
        for (const [key, executions] of this.executions.entries()) {
            const beforeCount = executions.length;
            const filtered = executions.filter(exec => exec.timestamp >= cutoffDate);
            this.executions.set(key, filtered);
            deletedCount += beforeCount - filtered.length;
        }
        // Cleanup snapshots
        const snapshotCutoff = new Date(Date.now() - this.retentionPolicy.snapshotRetentionDays * 24 * 60 * 60 * 1000);
        for (const [key, snapshots] of this.snapshots.entries()) {
            const beforeCount = snapshots.length;
            const filtered = snapshots.filter(snapshot => snapshot.timestamp >= snapshotCutoff);
            this.snapshots.set(key, filtered);
            deletedCount += beforeCount - filtered.length;
        }
        // Cleanup events
        const eventCutoff = new Date(Date.now() - this.retentionPolicy.eventRetentionDays * 24 * 60 * 60 * 1000);
        for (const [key, events] of this.events.entries()) {
            const beforeCount = events.length;
            const filtered = events.filter(event => event.timestamp >= eventCutoff);
            this.events.set(key, filtered);
            deletedCount += beforeCount - filtered.length;
        }
        return deletedCount;
    }
    /**
     * Export historical data
     */
    async exportData(testId, entityId, format = 'json') {
        const data = {
            executions: this.getFilteredExecutions(testId, entityId),
            snapshots: this.getFilteredSnapshots(testId, entityId),
            events: this.getFilteredEvents(testId, entityId),
            relationships: this.getFilteredRelationships(testId, entityId),
            exportTimestamp: new Date(),
            retentionPolicy: this.retentionPolicy,
            snapshotConfig: this.snapshotConfig
        };
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
        else if (format === 'csv') {
            return this.convertToCSV(data);
        }
        throw new Error(`Unsupported export format: ${format}`);
    }
    /**
     * Import historical data
     */
    async importData(data, format = 'json') {
        let parsedData;
        try {
            if (format === 'json') {
                parsedData = JSON.parse(data);
            }
            else if (format === 'csv') {
                parsedData = this.parseCSV(data);
            }
            else {
                throw new Error(`Unsupported import format: ${format}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to parse ${format} data: ${error}`);
        }
        let importedCount = 0;
        // Import executions
        if (parsedData.executions) {
            for (const execution of parsedData.executions) {
                await this.storeExecution(execution);
                importedCount++;
            }
        }
        // Import snapshots
        if (parsedData.snapshots) {
            for (const snapshot of parsedData.snapshots) {
                const key = `${snapshot.testId}:${snapshot.entityId}`;
                if (!this.snapshots.has(key)) {
                    this.snapshots.set(key, []);
                }
                this.snapshots.get(key).push(snapshot);
                importedCount++;
            }
        }
        // Import events
        if (parsedData.events) {
            for (const event of parsedData.events) {
                const key = `${event.testId}:${event.entityId}`;
                if (!this.events.has(key)) {
                    this.events.set(key, []);
                }
                this.events.get(key).push(event);
                importedCount++;
            }
        }
        return importedCount;
    }
    /**
     * Get data statistics
     */
    async getStatistics() {
        let totalExecutions = 0;
        let totalSnapshots = 0;
        let totalEvents = 0;
        let oldestRecord = null;
        let newestRecord = null;
        // Count executions and find date range
        for (const executions of this.executions.values()) {
            totalExecutions += executions.length;
            for (const execution of executions) {
                if (!oldestRecord || execution.timestamp < oldestRecord) {
                    oldestRecord = execution.timestamp;
                }
                if (!newestRecord || execution.timestamp > newestRecord) {
                    newestRecord = execution.timestamp;
                }
            }
        }
        // Count snapshots
        for (const snapshots of this.snapshots.values()) {
            totalSnapshots += snapshots.length;
        }
        // Count events
        for (const events of this.events.values()) {
            totalEvents += events.length;
        }
        // Calculate average executions per day
        let averageExecutionsPerDay = 0;
        if (oldestRecord && newestRecord && totalExecutions > 0) {
            const daysDiff = Math.max(1, Math.ceil((newestRecord.getTime() - oldestRecord.getTime()) / (24 * 60 * 60 * 1000)));
            averageExecutionsPerDay = totalExecutions / daysDiff;
        }
        // Calculate approximate data size
        const dataSize = this.calculateDataSize();
        // Check retention compliance
        const retentionCompliance = await this.checkRetentionCompliance();
        return {
            totalExecutions,
            totalSnapshots,
            totalEvents,
            oldestRecord: oldestRecord || new Date(),
            newestRecord: newestRecord || new Date(),
            averageExecutionsPerDay,
            dataSize,
            retentionCompliance
        };
    }
    // Private helper methods
    calculateExecutionMetrics(executions) {
        const totalExecutions = executions.length;
        const passedExecutions = executions.filter(exec => exec.status === 'pass').length;
        const failedExecutions = executions.filter(exec => exec.status === 'fail').length;
        const skippedExecutions = executions.filter(exec => exec.status === 'skip').length;
        const successRate = totalExecutions > 0 ? passedExecutions / totalExecutions : 0;
        const durations = executions.filter(exec => exec.duration).map(exec => exec.duration);
        const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : undefined;
        // Calculate flakiness score (simplified)
        const recentExecutions = executions.slice(-20);
        const recentFailures = recentExecutions.filter(exec => exec.status === 'fail').length;
        const flakinessScore = recentExecutions.length > 0 ? recentFailures / recentExecutions.length : 0;
        const lastExecutionAt = executions.length > 0 ? executions[executions.length - 1].timestamp : undefined;
        const lastPassedAt = executions.reverse().find(exec => exec.status === 'pass')?.timestamp;
        const lastFailedAt = executions.reverse().find(exec => exec.status === 'fail')?.timestamp;
        return {
            totalExecutions,
            passedExecutions,
            failedExecutions,
            skippedExecutions,
            successRate,
            averageDuration,
            flakinessScore,
            lastExecutionAt,
            lastPassedAt,
            lastFailedAt
        };
    }
    async checkSnapshotCreation(testId, entityId) {
        const key = `${testId}:${entityId}`;
        const snapshots = this.snapshots.get(key) || [];
        if (snapshots.length === 0) {
            // Create initial snapshot
            return;
        }
        const lastSnapshot = snapshots[snapshots.length - 1];
        const now = new Date();
        const timeSinceLastSnapshot = now.getTime() - lastSnapshot.timestamp.getTime();
        let shouldCreateSnapshot = false;
        switch (this.snapshotConfig.frequency) {
            case 'daily':
                shouldCreateSnapshot = timeSinceLastSnapshot > 24 * 60 * 60 * 1000;
                break;
            case 'weekly':
                shouldCreateSnapshot = timeSinceLastSnapshot > 7 * 24 * 60 * 60 * 1000;
                break;
            case 'monthly':
                shouldCreateSnapshot = timeSinceLastSnapshot > 30 * 24 * 60 * 60 * 1000;
                break;
        }
        if (shouldCreateSnapshot) {
            // Would create snapshot here if we had the metadata
            // This would typically be called from a scheduler or external trigger
        }
    }
    async applyRetentionPolicy(key, dataType) {
        let retentionDays;
        let dataMap;
        switch (dataType) {
            case 'executions':
                retentionDays = this.retentionPolicy.executionRetentionDays;
                dataMap = this.executions;
                break;
            case 'snapshots':
                retentionDays = this.retentionPolicy.snapshotRetentionDays;
                dataMap = this.snapshots;
                break;
            case 'events':
                retentionDays = this.retentionPolicy.eventRetentionDays;
                dataMap = this.events;
                break;
        }
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const data = dataMap.get(key) || [];
        const filtered = data.filter(item => item.timestamp >= cutoffDate);
        dataMap.set(key, filtered);
    }
    async queryExecutions(query) {
        const results = [];
        for (const [key, executions] of this.executions.entries()) {
            const [testId, entityId] = key.split(':');
            if (query.testId && testId !== query.testId)
                continue;
            if (query.entityId && entityId !== query.entityId)
                continue;
            for (const execution of executions) {
                if (query.startDate && execution.timestamp < query.startDate)
                    continue;
                if (query.endDate && execution.timestamp > query.endDate)
                    continue;
                results.push(execution);
            }
        }
        // Apply limit and offset
        const offset = query.offset || 0;
        const limit = query.limit || results.length;
        return results
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(offset, offset + limit);
    }
    async queryEvents(query) {
        const results = [];
        for (const [key, events] of this.events.entries()) {
            const [testId, entityId] = key.split(':');
            if (query.testId && testId !== query.testId)
                continue;
            if (query.entityId && entityId !== query.entityId)
                continue;
            for (const event of events) {
                if (query.startDate && event.timestamp < query.startDate)
                    continue;
                if (query.endDate && event.timestamp > query.endDate)
                    continue;
                if (query.eventTypes && !query.eventTypes.includes(event.type))
                    continue;
                results.push(event);
            }
        }
        return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async queryRelationships(query) {
        if (!query.includeRelationships)
            return [];
        const results = [];
        for (const [key, relationships] of this.relationships.entries()) {
            const [testId, entityId] = key.split(':');
            if (query.testId && testId !== query.testId)
                continue;
            if (query.entityId && entityId !== query.entityId)
                continue;
            for (const relationship of relationships) {
                if (query.startDate && relationship.validFrom < query.startDate)
                    continue;
                if (query.endDate && relationship.validTo && relationship.validTo > query.endDate)
                    continue;
                results.push(relationship);
            }
        }
        return results;
    }
    async querySnapshots(query) {
        const results = [];
        for (const [key, snapshots] of this.snapshots.entries()) {
            const [testId, entityId] = key.split(':');
            if (query.testId && testId !== query.testId)
                continue;
            if (query.entityId && entityId !== query.entityId)
                continue;
            for (const snapshot of snapshots) {
                if (query.startDate && snapshot.timestamp < query.startDate)
                    continue;
                if (query.endDate && snapshot.timestamp > query.endDate)
                    continue;
                results.push(snapshot);
            }
        }
        return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getFilteredExecutions(testId, entityId) {
        const results = [];
        for (const [key, executions] of this.executions.entries()) {
            const [keyTestId, keyEntityId] = key.split(':');
            if (testId && keyTestId !== testId)
                continue;
            if (entityId && keyEntityId !== entityId)
                continue;
            results.push(...executions);
        }
        return results;
    }
    getFilteredSnapshots(testId, entityId) {
        const results = [];
        for (const [key, snapshots] of this.snapshots.entries()) {
            const [keyTestId, keyEntityId] = key.split(':');
            if (testId && keyTestId !== testId)
                continue;
            if (entityId && keyEntityId !== entityId)
                continue;
            results.push(...snapshots);
        }
        return results;
    }
    getFilteredEvents(testId, entityId) {
        const results = [];
        for (const [key, events] of this.events.entries()) {
            const [keyTestId, keyEntityId] = key.split(':');
            if (testId && keyTestId !== testId)
                continue;
            if (entityId && keyEntityId !== entityId)
                continue;
            results.push(...events);
        }
        return results;
    }
    getFilteredRelationships(testId, entityId) {
        const results = [];
        for (const [key, relationships] of this.relationships.entries()) {
            const [keyTestId, keyEntityId] = key.split(':');
            if (testId && keyTestId !== testId)
                continue;
            if (entityId && keyEntityId !== entityId)
                continue;
            results.push(...relationships);
        }
        return results;
    }
    convertToCSV(data) {
        // Simplified CSV conversion - in practice would be more sophisticated
        let csv = 'timestamp,testId,entityId,type,status,duration,coverage\n';
        for (const execution of data.executions) {
            csv += `${execution.timestamp},${execution.testId},${execution.entityId},execution,${execution.status},${execution.duration || ''},${execution.coverage?.overall || ''}\n`;
        }
        return csv;
    }
    parseCSV(data) {
        // Simplified CSV parsing - in practice would be more sophisticated
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        const executions = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim())
                continue;
            const values = lines[i].split(',');
            const execution = {};
            headers.forEach((header, index) => {
                execution[header] = values[index];
            });
            executions.push(execution);
        }
        return { executions };
    }
    calculateDataSize() {
        // Simplified size calculation
        let size = 0;
        for (const executions of this.executions.values()) {
            size += JSON.stringify(executions).length;
        }
        for (const snapshots of this.snapshots.values()) {
            size += JSON.stringify(snapshots).length;
        }
        for (const events of this.events.values()) {
            size += JSON.stringify(events).length;
        }
        return size;
    }
    async checkRetentionCompliance() {
        const now = new Date();
        // Check if any data exceeds retention policy
        for (const executions of this.executions.values()) {
            for (const execution of executions) {
                const age = now.getTime() - execution.timestamp.getTime();
                const ageDays = age / (24 * 60 * 60 * 1000);
                if (ageDays > this.retentionPolicy.executionRetentionDays) {
                    return false;
                }
            }
        }
        return true;
    }
}
//# sourceMappingURL=TestHistory.js.map