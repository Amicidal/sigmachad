/**
 * Security Policies Management
 * Manages security rules, policies, and suppression rules
 */
import { SecurityPolicy, SecurityPolicySet, SecurityIssue, Vulnerability, SecuritySuppressionRule } from "./types.js";
export declare class SecurityPolicies {
    private policies;
    private policySets;
    private suppressionRules;
    private activePolicySet;
    initialize(policiesPath?: string): Promise<void>;
    loadPoliciesFromFile(filePath: string): Promise<void>;
    filterIssues(issues: SecurityIssue[]): Promise<SecurityIssue[]>;
    filterVulnerabilities(vulnerabilities: Vulnerability[]): Promise<Vulnerability[]>;
    getActivePolicy(): SecurityPolicySet | null;
    setActivePolicy(policySetId: string): boolean;
    addSuppressionRule(rule: Omit<SecuritySuppressionRule, 'id' | 'createdAt'>): string;
    removeSuppressionRule(id: string): boolean;
    getSuppressionRules(): SecuritySuppressionRule[];
    saveSuppressionRules(filePath?: string): Promise<void>;
    validatePolicyCompliance(issues: SecurityIssue[], vulnerabilities: Vulnerability[]): {
        compliant: boolean;
        violations: Array<{
            type: 'issue' | 'vulnerability';
            item: SecurityIssue | Vulnerability;
            policy: SecurityPolicy;
            reason: string;
        }>;
    };
    private loadDefaultPolicies;
    private loadSuppressionRules;
    private shouldSuppressIssue;
    private shouldSuppressVulnerability;
    private shouldEnforceIssue;
    private shouldEnforceVulnerability;
    private isInPolicyScope;
    private meetsSeverityThreshold;
    private checkIssueCompliance;
    private checkVulnerabilityCompliance;
    private validatePolicy;
    private validatePolicySet;
}
//# sourceMappingURL=policies.d.ts.map