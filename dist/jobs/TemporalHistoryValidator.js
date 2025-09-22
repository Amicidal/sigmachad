export class TemporalHistoryValidator {
    constructor(kgService) {
        this.kgService = kgService;
    }
    async validate(options = {}) {
        var _a, _b, _c;
        const batchSize = Math.max(1, Math.min(100, (_a = options.batchSize) !== null && _a !== void 0 ? _a : 25));
        const timelineLimit = Math.max(10, Math.min(200, (_b = options.timelineLimit) !== null && _b !== void 0 ? _b : 200));
        const autoRepair = Boolean(options.autoRepair);
        const dryRun = Boolean(options.dryRun);
        const log = (_c = options.logger) !== null && _c !== void 0 ? _c : (() => undefined);
        const issues = [];
        let repairedLinks = 0;
        let inspectedVersions = 0;
        let scannedEntities = 0;
        let offset = 0;
        let totalEntities;
        while (true) {
            const { entities, total } = await this.kgService.listEntities({
                limit: batchSize,
                offset,
            });
            totalEntities = total;
            if (entities.length === 0) {
                break;
            }
            for (const entity of entities) {
                scannedEntities += 1;
                if (typeof options.maxEntities === "number" &&
                    scannedEntities > options.maxEntities) {
                    return {
                        scannedEntities: scannedEntities - 1,
                        inspectedVersions,
                        repairedLinks,
                        issues,
                    };
                }
                const timeline = await this.kgService.getEntityTimeline(entity.id, {
                    limit: timelineLimit,
                });
                inspectedVersions += timeline.versions.length;
                this.evaluateTimeline(timeline, issues, autoRepair, dryRun, timelineLimit, () => {
                    log("temporal_history_validator.missing_previous", {
                        entityId: timeline.entityId,
                        versionId: timeline.versions.length
                            ? timeline.versions[timeline.versions.length - 1].versionId
                            : undefined,
                    });
                });
                if (autoRepair && !dryRun) {
                    const repairedIds = await this.repairMissingLinks(timeline);
                    repairedLinks += repairedIds.length;
                    if (repairedIds.length > 0) {
                        for (const issue of issues) {
                            if (issue.entityId === timeline.entityId &&
                                issue.type === "missing_previous") {
                                if (repairedIds.includes(issue.versionId)) {
                                    issue.repaired = true;
                                }
                                else if (issue.repaired === undefined) {
                                    issue.repaired = false;
                                }
                            }
                        }
                        log("temporal_history_validator.repaired", {
                            entityId: timeline.entityId,
                            repairs: repairedIds.length,
                        });
                    }
                    else {
                        for (const issue of issues) {
                            if (issue.entityId === timeline.entityId &&
                                issue.type === "missing_previous" &&
                                issue.repaired === undefined) {
                                issue.repaired = false;
                            }
                        }
                    }
                }
            }
            offset += batchSize;
            if (typeof totalEntities === "number" && offset >= totalEntities) {
                break;
            }
        }
        return { scannedEntities, inspectedVersions, repairedLinks, issues };
    }
    evaluateTimeline(timeline, issues, autoRepair, dryRun, timelineLimit, onMissing) {
        var _a;
        const versions = [...timeline.versions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        if (versions.length === 0) {
            return;
        }
        const hasFullHistory = versions.length < timelineLimit;
        const first = versions[0];
        if (hasFullHistory && first.previousVersionId) {
            issues.push({
                entityId: timeline.entityId,
                versionId: first.versionId,
                type: "unexpected_head",
                actualPreviousId: first.previousVersionId,
                message: "Earliest version should not reference a previous version",
            });
        }
        for (let index = 1; index < versions.length; index += 1) {
            const prev = versions[index - 1];
            const current = versions[index];
            const expectedPrev = prev.versionId;
            const actualPrev = (_a = current.previousVersionId) !== null && _a !== void 0 ? _a : null;
            if (!actualPrev) {
                onMissing === null || onMissing === void 0 ? void 0 : onMissing();
                issues.push({
                    entityId: timeline.entityId,
                    versionId: current.versionId,
                    type: "missing_previous",
                    expectedPreviousId: expectedPrev,
                    repaired: autoRepair && !dryRun ? undefined : false,
                });
                continue;
            }
            if (actualPrev !== expectedPrev) {
                issues.push({
                    entityId: timeline.entityId,
                    versionId: current.versionId,
                    type: "misordered_previous",
                    expectedPreviousId: expectedPrev,
                    actualPreviousId: actualPrev,
                });
            }
            else if (current.timestamp.getTime() < prev.timestamp.getTime()) {
                issues.push({
                    entityId: timeline.entityId,
                    versionId: current.versionId,
                    type: "misordered_previous",
                    expectedPreviousId: expectedPrev,
                    actualPreviousId: actualPrev,
                    message: "Version timestamp is older than its predecessor",
                });
            }
        }
    }
    async repairMissingLinks(timeline) {
        const sorted = [...timeline.versions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const repairedVersionIds = [];
        for (let index = 1; index < sorted.length; index += 1) {
            const prev = sorted[index - 1];
            const current = sorted[index];
            if (current.previousVersionId) {
                continue;
            }
            const repaired = await this.kgService.repairPreviousVersionLink(timeline.entityId, current.versionId, prev.versionId, { timestamp: current.timestamp });
            if (repaired) {
                repairedVersionIds.push(current.versionId);
            }
        }
        return repairedVersionIds;
    }
}
//# sourceMappingURL=TemporalHistoryValidator.js.map