/**
 * Core types for the multi-agent orchestration system
 */
/**
 * Event types for agent coordination
 */
export const AgentEventTypes = {
    TASK_STARTED: 'task:started',
    TASK_COMPLETED: 'task:completed',
    TASK_FAILED: 'task:failed',
    AGENT_REGISTERED: 'agent:registered',
    AGENT_UNREGISTERED: 'agent:unregistered',
    COORDINATION_REQUEST: 'coordination:request',
    COORDINATION_RESPONSE: 'coordination:response',
    STATE_UPDATED: 'state:updated',
    HEARTBEAT: 'heartbeat',
    ERROR: 'error'
};
//# sourceMappingURL=types.js.map