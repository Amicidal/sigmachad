/**
 * Event Orchestrator
 * Manages event forwarding from sub-services to the main KnowledgeGraphService
 */

import { EventEmitter } from 'events';
import { EntityServiceOGM } from '../graph/EntityServiceOGM';
import { RelationshipServiceOGM } from '../graph/RelationshipServiceOGM';
import { SearchServiceOGM } from '../graph/SearchServiceOGM';
import { AnalysisService } from '../analysis/AnalysisService';

export class EventOrchestrator extends EventEmitter {
  constructor(
    private entities: EntityServiceOGM,
    private relationships: RelationshipServiceOGM,
    private searchService: SearchServiceOGM,
    private analysis: AnalysisService
  ) {
    super();
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from sub-services
   */
  private setupEventForwarding(): void {
    // Forward entity events
    this.entities.on('entity:created', (data) => {
      this.emit('entity:created', data);
    });
    this.entities.on('entity:updated', (data) => {
      this.emit('entity:updated', data);
    });
    this.entities.on('entity:deleted', (data) => {
      this.emit('entity:deleted', data);
    });
    this.entities.on('entities:bulk:created', (data) => {
      this.emit('entities:bulk:created', data);
    });

    // Forward relationship events
    this.relationships.on('relationship:created', (data) => {
      this.emit('relationship:created', data);
    });
    this.relationships.on('relationship:deleted', (data) => {
      this.emit('relationship:deleted', data);
    });

    // Forward search events
    this.searchService.on('search:completed', (data) =>
      this.emit('search:completed', data)
    );

    // Forward analysis events
    this.analysis.on('impact:analyzed', (data) =>
      this.emit('impact:analyzed', data)
    );
  }

  /**
   * Get the emitter interface for forwarding events
   */
  getEmitter(): EventEmitter {
    return this;
  }
}
