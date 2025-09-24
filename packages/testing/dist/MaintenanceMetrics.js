import { performance } from "node:perf_hooks";
export class MaintenanceMetrics {
    constructor() {
        this.histogramBuckets = [1, 5, 10, 30, 60, 180, 600, 1800];
        this.backupCounters = new Map();
        this.backupHistograms = new Map();
        this.restoreCounters = new Map();
        this.restoreHistograms = new Map();
        this.taskCounters = new Map();
        this.approvalCounters = new Map();
        this.lastUpdated = performance.now();
        this.summary = {
            backups: {
                total: 0,
                success: 0,
                failure: 0,
                byProvider: new Map(),
                byType: new Map(),
                sizeBytes: 0,
            },
            restores: {
                preview: { total: 0, success: 0, failure: 0 },
                apply: { total: 0, success: 0, failure: 0 },
            },
            tasks: {
                total: 0,
                success: 0,
                failure: 0,
                byType: new Map(),
            },
            approvals: {
                total: 0,
                approved: 0,
                rejected: 0,
            },
        };
    }
    static getInstance() {
        if (!MaintenanceMetrics.instance) {
            MaintenanceMetrics.instance = new MaintenanceMetrics();
        }
        return MaintenanceMetrics.instance;
    }
    recordBackup(params) {
        const durationSeconds = params.durationMs / 1000;
        const labels = {
            status: params.status,
            provider: params.storageProviderId,
            type: params.type,
        };
        this.incrementCounter(this.backupCounters, "maintenance_backup_total", labels, 1);
        this.observeHistogram(this.backupHistograms, "maintenance_backup_duration_seconds", { status: params.status }, durationSeconds);
        this.summary.backups.total += 1;
        if (params.status === "success") {
            this.summary.backups.success += 1;
        }
        else {
            this.summary.backups.failure += 1;
        }
        const providerStats = this.getOrCreate(this.summary.backups.byProvider, params.storageProviderId, {
            total: 0,
            success: 0,
            failure: 0,
        });
        providerStats.total += 1;
        if (params.status === "success") {
            providerStats.success += 1;
        }
        else {
            providerStats.failure += 1;
        }
        const typeStats = this.getOrCreate(this.summary.backups.byType, params.type, {
            total: 0,
            success: 0,
            failure: 0,
        });
        typeStats.total += 1;
        if (params.status === "success") {
            typeStats.success += 1;
        }
        else {
            typeStats.failure += 1;
        }
        if (typeof params.sizeBytes === "number" && Number.isFinite(params.sizeBytes)) {
            this.summary.backups.sizeBytes += params.sizeBytes;
        }
        this.touch();
    }
    recordRestore(params) {
        const durationSeconds = params.durationMs / 1000;
        const labels = {
            mode: params.mode,
            status: params.status,
            requires_approval: String(params.requiresApproval),
        };
        if (params.storageProviderId) {
            labels["provider"] = params.storageProviderId;
        }
        if (params.backupId) {
            labels["backup_id"] = params.backupId;
        }
        this.incrementCounter(this.restoreCounters, "maintenance_restore_total", labels, 1);
        this.observeHistogram(this.restoreHistograms, "maintenance_restore_duration_seconds", { mode: params.mode, status: params.status }, durationSeconds);
        const bucket = params.mode === "preview" ? this.summary.restores.preview : this.summary.restores.apply;
        bucket.total += 1;
        if (params.status === "success") {
            bucket.success += 1;
        }
        else {
            bucket.failure += 1;
        }
        this.touch();
    }
    recordMaintenanceTask(params) {
        const labels = {
            task_type: params.taskType,
            status: params.status,
        };
        this.incrementCounter(this.taskCounters, "maintenance_task_total", labels, 1);
        this.summary.tasks.total += 1;
        if (params.status === "success") {
            this.summary.tasks.success += 1;
        }
        else {
            this.summary.tasks.failure += 1;
        }
        const typeStats = this.getOrCreate(this.summary.tasks.byType, params.taskType, {
            total: 0,
            success: 0,
            failure: 0,
        });
        typeStats.total += 1;
        if (params.status === "success") {
            typeStats.success += 1;
        }
        else {
            typeStats.failure += 1;
        }
        this.touch();
    }
    recordRestoreApproval(params) {
        this.incrementCounter(this.approvalCounters, "maintenance_restore_approvals_total", { status: params.status }, 1);
        this.summary.approvals.total += 1;
        if (params.status === "approved") {
            this.summary.approvals.approved += 1;
        }
        else {
            this.summary.approvals.rejected += 1;
        }
        this.touch();
    }
    getSummary() {
        return {
            updatedAt: new Date().toISOString(),
            backups: {
                total: this.summary.backups.total,
                success: this.summary.backups.success,
                failure: this.summary.backups.failure,
                averageSizeBytes: this.summary.backups.total > 0
                    ? this.summary.backups.sizeBytes / this.summary.backups.total
                    : 0,
                byProvider: Array.from(this.summary.backups.byProvider.entries()).map(([provider, stats]) => ({
                    provider,
                    ...stats,
                })),
                byType: Array.from(this.summary.backups.byType.entries()).map(([type, stats]) => ({
                    type,
                    ...stats,
                })),
            },
            restores: {
                preview: this.summary.restores.preview,
                apply: this.summary.restores.apply,
            },
            tasks: {
                total: this.summary.tasks.total,
                success: this.summary.tasks.success,
                failure: this.summary.tasks.failure,
                byType: Array.from(this.summary.tasks.byType.entries()).map(([taskType, stats]) => ({
                    taskType,
                    ...stats,
                })),
            },
            approvals: this.summary.approvals,
        };
    }
    toPrometheus() {
        const lines = [];
        const defined = new Set();
        const define = (metric, type, help) => {
            if (defined.has(metric)) {
                return;
            }
            lines.push(`# HELP ${metric} ${help}`);
            lines.push(`# TYPE ${metric} ${type}`);
            defined.add(metric);
        };
        this.backupCounters.forEach((entry, key) => {
            const metricName = key.split("::", 1)[0];
            define(metricName, "counter", "Count of maintenance backups executed");
            lines.push(`${metricName}${this.promLabels(entry.labels)} ${entry.value}`);
        });
        this.renderHistograms(lines, define, this.backupHistograms, "Histogram of maintenance backup durations");
        this.restoreCounters.forEach((entry, key) => {
            const metricName = key.split("::", 1)[0];
            define(metricName, "counter", "Count of maintenance restores executed");
            lines.push(`${metricName}${this.promLabels(entry.labels)} ${entry.value}`);
        });
        this.renderHistograms(lines, define, this.restoreHistograms, "Histogram of maintenance restore durations");
        this.taskCounters.forEach((entry, key) => {
            const metricName = key.split("::", 1)[0];
            define(metricName, "counter", "Count of maintenance tasks executed");
            lines.push(`${metricName}${this.promLabels(entry.labels)} ${entry.value}`);
        });
        this.approvalCounters.forEach((entry, key) => {
            const metricName = key.split("::", 1)[0];
            define(metricName, "counter", "Count of maintenance restore approvals processed");
            lines.push(`${metricName}${this.promLabels(entry.labels)} ${entry.value}`);
        });
        define("maintenance_metrics_age_seconds", "gauge", "Seconds since maintenance metrics were last updated");
        lines.push(`maintenance_metrics_age_seconds ${Math.max(0, (performance.now() - this.lastUpdated) / 1000)}`);
        return lines.join("\n");
    }
    incrementCounter(map, metricName, labels, value) {
        const key = this.labelKey(metricName, labels);
        const entry = map.get(key);
        if (entry) {
            entry.value += value;
        }
        else {
            map.set(key, { labels: { ...labels }, value });
        }
    }
    observeHistogram(map, metricName, labels, value) {
        const key = this.labelKey(metricName, labels);
        let entry = map.get(key);
        if (!entry) {
            entry = {
                labels: { ...labels },
                buckets: [...this.histogramBuckets],
                counts: new Array(this.histogramBuckets.length).fill(0),
                sum: 0,
                count: 0,
            };
            map.set(key, entry);
        }
        entry.count += 1;
        entry.sum += value;
        for (let i = 0; i < entry.buckets.length; i += 1) {
            if (value <= entry.buckets[i]) {
                entry.counts[i] += 1;
            }
        }
    }
    renderHistograms(lines, define, map, help) {
        map.forEach((entry, key) => {
            const metricName = key.split("::", 1)[0];
            define(metricName, "histogram", help);
            let cumulative = 0;
            for (let i = 0; i < entry.buckets.length; i += 1) {
                cumulative += entry.counts[i];
                lines.push(`${metricName}_bucket${this.promLabels({ ...entry.labels, le: String(entry.buckets[i]) })} ${cumulative}`);
            }
            lines.push(`${metricName}_bucket${this.promLabels({ ...entry.labels, le: "+Inf" })} ${entry.count}`);
            lines.push(`${metricName}_sum${this.promLabels(entry.labels)} ${entry.sum}`);
            lines.push(`${metricName}_count${this.promLabels(entry.labels)} ${entry.count}`);
        });
    }
    promLabels(labels) {
        const entries = Object.entries(labels);
        if (!entries.length) {
            return "";
        }
        const serialized = entries
            .map(([key, value]) => `${key}="${String(value).replace(/"/g, '\\"')}"`)
            .join(",");
        return `{${serialized}}`;
    }
    labelKey(metricName, labels) {
        const sorted = Object.entries(labels)
            .map(([key, value]) => `${key}=${value}`)
            .sort();
        return `${metricName}::${sorted.join("|")}`;
    }
    getOrCreate(map, key, defaultValue) {
        const existing = map.get(key);
        if (existing) {
            return existing;
        }
        map.set(key, defaultValue);
        return defaultValue;
    }
    touch() {
        this.lastUpdated = performance.now();
    }
}
//# sourceMappingURL=MaintenanceMetrics.js.map