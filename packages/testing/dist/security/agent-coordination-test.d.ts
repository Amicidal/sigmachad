/**
 * Security Agent Coordination Test
 * Tests the coordination between SecurityFixAgent and other agents
 */
export declare class SecurityAgentCoordinationTest {
    private coordinator;
    private registry;
    private securityFixAgent;
    private mockDb;
    private mockKgService;
    constructor();
    runCoordinationTests(): Promise<void>;
    private setupAgents;
    private testBasicCommunication;
    private testScanToFixWorkflow;
    private testParallelSecurityFixes;
    private testRollbackCoordination;
    private testAgentFailureHandling;
    testSecurityWorkflowIntegration(): Promise<void>;
    benchmarkCoordinationPerformance(): Promise<void>;
}
export declare function runCoordinationTests(): Promise<void>;
export { SecurityAgentCoordinationTest };
//# sourceMappingURL=agent-coordination-test.d.ts.map