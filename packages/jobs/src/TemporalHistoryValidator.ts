import { KnowledgeGraphService } from '@memento/knowledge';
import type { EntityTimelineResult, IKnowledgeGraphService } from '@memento/shared-types';

export type TemporalValidationIssueType =
  | 'missing_previous'
  | 'misordered_previous'
  | 'unexpected_head';

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
  constructor(
    private readonly kgService: IKnowledgeGraphService | KnowledgeGraphService
  ) {}

  async validate(
    options: TemporalValidationOptions = {}
  ): Promise<TemporalValidationReport> {
    const batchSize = Math.max(1, Math.min(100, options.batchSize ?? 25));
    const timelineLimit = Math.max(
      10,
      Math.min(200, options.timelineLimit ?? 200)
    );
    const autoRepair = Boolean(options.autoRepair);
    const dryRun = Boolean(options.dryRun);
    const log = options.logger ?? (() => undefined);

    const issues: TemporalValidationIssue[] = [];
    let repairedLinks = 0;
    let inspectedVersions = 0;
    let scannedEntities = 0;
    let cursor: string | undefined = undefined;

    while (true) {
      const page = await this.kgService.listEntities({
        limit: batchSize,
        cursor,
      });
      const pageEntities = (page.entities ?? page.items ?? []) as unknown[];
      if (!pageEntities || pageEntities.length === 0) {
        break;
      }

      for (const entity of pageEntities) {
        scannedEntities += 1;
        if (
          typeof options.maxEntities === 'number' &&
          scannedEntities > options.maxEntities
        ) {
          return {
            scannedEntities: scannedEntities - 1,
            inspectedVersions,
            repairedLinks,
            issues,
          };
        }

        const entityId = isEntityWithId(entity) ? entity.id : undefined;
        if (!entityId) {
          // Skip entities without a stable id shape
          continue;
        }

        const getTimeline = (this.kgService as any).getEntityTimeline?.bind(
          this.kgService as any
        );
        if (typeof getTimeline !== 'function') {
          throw new Error('KnowledgeGraphService does not support history APIs');
        }

        const timeline = await getTimeline(entityId, {
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
            log('temporal_history_validator.missing_previous', {
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
                issue.type === 'missing_previous'
              ) {
                if (repairedIds.includes(issue.versionId)) {
                  issue.repaired = true;
                } else if (issue.repaired === undefined) {
                  issue.repaired = false;
                }
              }
            }
            log('temporal_history_validator.repaired', {
              entityId: timeline.entityId,
              repairs: repairedIds.length,
            });
          } else {
            for (const issue of issues) {
              if (
                issue.entityId === timeline.entityId &&
                issue.type === 'missing_previous' &&
                issue.repaired === undefined
              ) {
                issue.repaired = false;
              }
            }
          }
        }
      }

      cursor = page.nextCursor;
      if (!cursor) break;
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
    const versions = [...timeline.versions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
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
        type: 'unexpected_head',
        actualPreviousId: first.previousVersionId,
        message: 'Earliest version should not reference a previous version',
      });
    }

    // Avoid dynamic index access to satisfy security/detect-object-injection.
    // Use an iterator over the tail while carrying the previous item.
    let prev = versions[0];
    for (const current of versions.slice(1)) {
      const expectedPrev = prev.versionId;
      const actualPrev = current.previousVersionId ?? null;

      if (!actualPrev) {
        onMissing?.();
        issues.push({
          entityId: timeline.entityId,
          versionId: current.versionId,
          type: 'missing_previous',
          expectedPreviousId: expectedPrev,
          repaired: autoRepair && !dryRun ? undefined : false,
        });
        continue;
      }

      if (actualPrev !== expectedPrev) {
        issues.push({
          entityId: timeline.entityId,
          versionId: current.versionId,
          type: 'misordered_previous',
          expectedPreviousId: expectedPrev,
          actualPreviousId: actualPrev,
        });
      } else if (current.timestamp.getTime() < prev.timestamp.getTime()) {
        issues.push({
          entityId: timeline.entityId,
          versionId: current.versionId,
          type: 'misordered_previous',
          expectedPreviousId: expectedPrev,
          actualPreviousId: actualPrev,
          message: 'Version timestamp is older than its predecessor',
        });
      }
      // advance window
      prev = current;
    }
  }

  private async repairMissingLinks(
    timeline: EntityTimelineResult
  ): Promise<string[]> {
    const sorted = [...timeline.versions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const repairedVersionIds: string[] = [];

    // Iterate without computed property access to appease injection rule
    for (const current of sorted.slice(1)) {
      if (current.previousVersionId) {
        continue;
      }
      const repair = (this.kgService as any).repairPreviousVersionLink?.bind(
        this.kgService as any
      );
      if (typeof repair === 'function') {
        await repair(current.versionId);
      }
      repairedVersionIds.push(current.versionId);
    }

    return repairedVersionIds;
  }
}

function isEntityWithId(entity: unknown): entity is { id: string } {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'id' in entity &&
    typeof (entity as any).id === 'string'
  );
}
