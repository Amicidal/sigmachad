import { KnowledgeGraphService } from "../services/knowledge/KnowledgeGraphService.js";
import type { EntityTimelineResult } from "../models/types.js";

export type TemporalValidationIssueType =
  | "missing_previous"
  | "misordered_previous"
  | "unexpected_head";

export interface TemporalValidationIssue {
  entityId: string;
  versionId: string;
  type: TemporalValidationIssueType;
  expectedPreviousId?: string;
  actualPreviousId?: string | null;
  message?: string;
  repaired?: boolean;
}

export interface TemporalValidationReport {
  scannedEntities: number;
  inspectedVersions: number;
  repairedLinks: number;
  issues: TemporalValidationIssue[];
}

export interface TemporalValidationOptions {
  batchSize?: number;
  maxEntities?: number;
  timelineLimit?: number;
  autoRepair?: boolean;
  dryRun?: boolean;
  logger?: (message: string, context?: Record<string, unknown>) => void;
}

export class TemporalHistoryValidator {
  constructor(private readonly kgService: KnowledgeGraphService) {}

  async validate(
    options: TemporalValidationOptions = {}
  ): Promise<TemporalValidationReport> {
    const batchSize = Math.max(1, Math.min(100, options.batchSize ?? 25));
    const timelineLimit = Math.max(10, Math.min(200, options.timelineLimit ?? 200));
    const autoRepair = Boolean(options.autoRepair);
    const dryRun = Boolean(options.dryRun);
    const log = options.logger ?? (() => undefined);

    const issues: TemporalValidationIssue[] = [];
    let repairedLinks = 0;
    let inspectedVersions = 0;
    let scannedEntities = 0;
    let offset = 0;
    let totalEntities: number | undefined;

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
        if (
          typeof options.maxEntities === "number" &&
          scannedEntities > options.maxEntities
        ) {
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
        this.evaluateTimeline(
          timeline,
          issues,
          autoRepair,
          dryRun,
          timelineLimit,
          () => {
            log("temporal_history_validator.missing_previous", {
              entityId: timeline.entityId,
              versionId: timeline.versions.length
                ? timeline.versions[timeline.versions.length - 1].versionId
                : undefined,
            });
          }
        );

        if (autoRepair && !dryRun) {
          const repairedIds = await this.repairMissingLinks(timeline);
          repairedLinks += repairedIds.length;
          if (repairedIds.length > 0) {
            for (const issue of issues) {
              if (
                issue.entityId === timeline.entityId &&
                issue.type === "missing_previous"
              ) {
                if (repairedIds.includes(issue.versionId)) {
                  issue.repaired = true;
                } else if (issue.repaired === undefined) {
                  issue.repaired = false;
                }
              }
            }
            log("temporal_history_validator.repaired", {
              entityId: timeline.entityId,
              repairs: repairedIds.length,
            });
          } else {
            for (const issue of issues) {
              if (
                issue.entityId === timeline.entityId &&
                issue.type === "missing_previous" &&
                issue.repaired === undefined
              ) {
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

  private evaluateTimeline(
    timeline: EntityTimelineResult,
    issues: TemporalValidationIssue[],
    autoRepair: boolean,
    dryRun: boolean,
    timelineLimit: number,
    onMissing?: () => void
  ): void {
    const versions = [...timeline.versions].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );
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
      const actualPrev = current.previousVersionId ?? null;

      if (!actualPrev) {
        onMissing?.();
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
      } else if (current.timestamp.getTime() < prev.timestamp.getTime()) {
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

  private async repairMissingLinks(
    timeline: EntityTimelineResult
  ): Promise<string[]> {
    const sorted = [...timeline.versions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const repairedVersionIds: string[] = [];

    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1];
      const current = sorted[index];
      if (current.previousVersionId) {
        continue;
      }
      const repaired = await this.kgService.repairPreviousVersionLink(
        timeline.entityId,
        current.versionId,
        prev.versionId,
        { timestamp: current.timestamp }
      );
      if (repaired) {
        repairedVersionIds.push(current.versionId);
      }
    }

    return repairedVersionIds;
  }
}
