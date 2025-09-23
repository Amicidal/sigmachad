/**
 * Event Orchestrator
 * Manages event forwarding from sub-services to the main KnowledgeGraphService
 */
import { EventEmitter } from "events";
import { EntityServiceOGM } from "../ogm/EntityServiceOGM.js";
import { RelationshipServiceOGM } from "../ogm/RelationshipServiceOGM.js";
import { SearchServiceOGM } from "../ogm/SearchServiceOGM.js";
import { AnalysisService } from "../AnalysisService.js";
export declare class EventOrchestrator extends EventEmitter {
    private entities;
    private relationships;
    private searchService;
    private analysis;
    constructor(entities: EntityServiceOGM, relationships: RelationshipServiceOGM, searchService: SearchServiceOGM, analysis: AnalysisService);
    /**
     * Setup event forwarding from sub-services
     */
    private setupEventForwarding;
    /**
     * Get the emitter interface for forwarding events
     */
    getEmitter(): EventEmitter;
}
//# sourceMappingURL=EventOrchestrator.d.ts.map