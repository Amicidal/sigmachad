/**
 * Event Orchestrator
 * Manages event forwarding from sub-services to the main KnowledgeGraphService
 */
import { EventEmitter } from "events";
export class EventOrchestrator extends EventEmitter {
    constructor(entities, relationships, searchService, analysis) {
        super();
        this.entities = entities;
        this.relationships = relationships;
        this.searchService = searchService;
        this.analysis = analysis;
        this.setupEventForwarding();
    }
    /**
     * Setup event forwarding from sub-services
     */
    setupEventForwarding() {
        // Forward entity events
        this.entities.on("entity:created", (data) => {
            this.emit("entity:created", data);
        });
        this.entities.on("entity:updated", (data) => {
            this.emit("entity:updated", data);
        });
        this.entities.on("entity:deleted", (data) => {
            this.emit("entity:deleted", data);
        });
        this.entities.on("entities:bulk:created", (data) => {
            this.emit("entities:bulk:created", data);
        });
        // Forward relationship events
        this.relationships.on("relationship:created", (data) => {
            this.emit("relationship:created", data);
        });
        this.relationships.on("relationship:deleted", (data) => {
            this.emit("relationship:deleted", data);
        });
        // Forward search events
        this.searchService.on("search:completed", (data) => this.emit("search:completed", data));
        // Forward analysis events
        this.analysis.on("impact:analyzed", (data) => this.emit("impact:analyzed", data));
    }
    /**
     * Get the emitter interface for forwarding events
     */
    getEmitter() {
        return this;
    }
}
//# sourceMappingURL=EventOrchestrator.js.map