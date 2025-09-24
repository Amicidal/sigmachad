/**
 * Security Policies Management
 * Manages security rules, policies, and suppression rules
 */
import * as fs from "fs";
export class SecurityPolicies {
    constructor() {
        this.policies = new Map();
        this.policySets = new Map();
        this.suppressionRules = [];
        this.activePolicySet = null;
    }
    async initialize(policiesPath) {
        this.loadDefaultPolicies();
        if (policiesPath && fs.existsSync(policiesPath)) {
            await this.loadPoliciesFromFile(policiesPath);
        }
        await this.loadSuppressionRules();
    }
    async loadPoliciesFromFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            if (data.policies && Array.isArray(data.policies)) {
                for (const policyData of data.policies) {
                    const policy = this.validatePolicy(policyData);
                    if (policy) {
                        this.policies.set(policy.id, policy);
                    }
                }
            }
            if (data.policySets && Array.isArray(data.policySets)) {
                for (const policySetData of data.policySets) {
                    const policySet = this.validatePolicySet(policySetData);
                    if (policySet) {
                        this.policySets.set(policySet.id, policySet);
                    }
                }
            }
            if (data.activePolicySet) {
                this.activePolicySet = this.policySets.get(data.activePolicySet) || null;
            }
            console.log(`📋 Loaded security policies from ${filePath}`);
        }
        catch (error) {
            console.error(`Failed to load security policies from ${filePath}:`, error);
        }
    }
    async filterIssues(issues) {
        const filtered = [];
        for (const issue of issues) {
            if (this.shouldSuppressIssue(issue)) {
                continue;
            }
            if (this.shouldEnforceIssue(issue)) {
                filtered.push(issue);
            }
        }
        return filtered;
    }
    async filterVulnerabilities(vulnerabilities) {
        const filtered = [];
        for (const vuln of vulnerabilities) {
            if (this.shouldSuppressVulnerability(vuln)) {
                continue;
            }
            if (this.shouldEnforceVulnerability(vuln)) {
                filtered.push(vuln);
            }
        }
        return filtered;
    }
    getActivePolicy() {
        return this.activePolicySet;
    }
    setActivePolicy(policySetId) {
        const policySet = this.policySets.get(policySetId);
        if (policySet) {
            this.activePolicySet = policySet;
            return true;
        }
        return false;
    }
    addSuppressionRule(rule) {
        const id = `supp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const suppressionRule = {
            id,
            createdAt: new Date(),
            ...rule
        };
        this.suppressionRules.push(suppressionRule);
        return id;
    }
    removeSuppressionRule(id) {
        const index = this.suppressionRules.findIndex(rule => rule.id === id);
        if (index !== -1) {
            this.suppressionRules.splice(index, 1);
            return true;
        }
        return false;
    }
    getSuppressionRules() {
        return [...this.suppressionRules];
    }
    async saveSuppressionRules(filePath) {
        const path = filePath || '.security-suppressions.json';
        const data = {
            suppressions: this.suppressionRules,
            generatedAt: new Date().toISOString()
        };
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        console.log(`💾 Saved suppression rules to ${path}`);
    }
    validatePolicyCompliance(issues, vulnerabilities) {
        const violations = [];
        if (!this.activePolicySet) {
            return { compliant: true, violations };
        }
        // Check issue compliance
        for (const issue of issues) {
            for (const policy of this.activePolicySet.policies) {
                if (!policy.enabled)
                    continue;
                const violation = this.checkIssueCompliance(issue, policy);
                if (violation) {
                    violations.push({
                        type: 'issue',
                        item: issue,
                        policy,
                        reason: violation
                    });
                }
            }
        }
        // Check vulnerability compliance
        for (const vuln of vulnerabilities) {
            for (const policy of this.activePolicySet.policies) {
                if (!policy.enabled)
                    continue;
                const violation = this.checkVulnerabilityCompliance(vuln, policy);
                if (violation) {
                    violations.push({
                        type: 'vulnerability',
                        item: vuln,
                        policy,
                        reason: violation
                    });
                }
            }
        }
        return {
            compliant: violations.length === 0,
            violations
        };
    }
    loadDefaultPolicies() {
        // OWASP Top 10 based policies
        const owaspPolicy = {
            id: "owasp-top-10",
            name: "OWASP Top 10 Security Policy",
            description: "Security policy based on OWASP Top 10 2021",
            rules: [
                {
                    id: "injection-prevention",
                    name: "Injection Prevention",
                    description: "Prevent injection vulnerabilities",
                    severity: "critical",
                    category: "sast",
                    pattern: /.*/,
                    remediation: "Use parameterized queries and input validation",
                    tags: ["owasp-a03", "injection"]
                },
                {
                    id: "broken-access-control",
                    name: "Broken Access Control Prevention",
                    description: "Prevent access control issues",
                    severity: "high",
                    category: "sast",
                    pattern: /.*/,
                    remediation: "Implement proper access controls",
                    tags: ["owasp-a01", "access-control"]
                },
                {
                    id: "security-misconfiguration",
                    name: "Security Misconfiguration Prevention",
                    description: "Prevent security misconfigurations",
                    severity: "medium",
                    category: "configuration",
                    pattern: /.*/,
                    remediation: "Follow security configuration best practices",
                    tags: ["owasp-a05", "configuration"]
                }
            ],
            enabled: true,
            enforcement: "blocking",
            scope: ["**/*"]
        };
        // Secrets management policy
        const secretsPolicy = {
            id: "secrets-management",
            name: "Secrets Management Policy",
            description: "Prevent hardcoded secrets and credentials",
            rules: [
                {
                    id: "no-hardcoded-secrets",
                    name: "No Hardcoded Secrets",
                    description: "Secrets must not be hardcoded in source code",
                    severity: "critical",
                    category: "secrets",
                    pattern: /.*/,
                    remediation: "Use environment variables or secure key management",
                    tags: ["secrets", "credentials"]
                }
            ],
            enabled: true,
            enforcement: "blocking",
            scope: ["**/*"]
        };
        // Dependency security policy
        const dependencyPolicy = {
            id: "dependency-security",
            name: "Dependency Security Policy",
            description: "Ensure dependencies are secure and up-to-date",
            rules: [
                {
                    id: "no-critical-vulnerabilities",
                    name: "No Critical Vulnerabilities",
                    description: "Dependencies must not have critical vulnerabilities",
                    severity: "critical",
                    category: "dependency",
                    pattern: /.*/,
                    remediation: "Update dependencies to secure versions",
                    tags: ["dependencies", "vulnerabilities"]
                },
                {
                    id: "no-high-vulnerabilities",
                    name: "Limited High Severity Vulnerabilities",
                    description: "Limit high severity vulnerabilities in dependencies",
                    severity: "high",
                    category: "dependency",
                    pattern: /.*/,
                    remediation: "Update or replace vulnerable dependencies",
                    tags: ["dependencies", "vulnerabilities"]
                }
            ],
            enabled: true,
            enforcement: "warning",
            scope: ["**/package.json", "**/requirements.txt", "**/pom.xml"]
        };
        this.policies.set(owaspPolicy.id, owaspPolicy);
        this.policies.set(secretsPolicy.id, secretsPolicy);
        this.policies.set(dependencyPolicy.id, dependencyPolicy);
        // Default policy set
        const defaultPolicySet = {
            id: "default",
            name: "Default Security Policy Set",
            description: "Standard security policies for general use",
            policies: [owaspPolicy, secretsPolicy, dependencyPolicy],
            defaultSeverityThreshold: "medium",
            defaultConfidenceThreshold: 0.7
        };
        this.policySets.set(defaultPolicySet.id, defaultPolicySet);
        this.activePolicySet = defaultPolicySet;
    }
    async loadSuppressionRules() {
        const suppressionFile = process.env.SECURITY_SUPPRESSIONS || '.security-suppressions.json';
        if (fs.existsSync(suppressionFile)) {
            try {
                const content = fs.readFileSync(suppressionFile, 'utf-8');
                const data = JSON.parse(content);
                if (data.suppressions && Array.isArray(data.suppressions)) {
                    this.suppressionRules = data.suppressions.map((rule) => ({
                        id: rule.id || `supp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: rule.type || 'issue',
                        target: rule.target || {},
                        until: rule.until,
                        reason: rule.reason || 'No reason provided',
                        createdBy: rule.createdBy || 'unknown',
                        createdAt: rule.createdAt ? new Date(rule.createdAt) : new Date()
                    }));
                }
                console.log(`🛡️ Loaded ${this.suppressionRules.length} suppression rules`);
            }
            catch (error) {
                console.warn(`Failed to load suppression rules from ${suppressionFile}:`, error);
            }
        }
    }
    shouldSuppressIssue(issue) {
        const now = Date.now();
        for (const rule of this.suppressionRules) {
            if (rule.type !== 'issue')
                continue;
            // Check if rule has expired
            if (rule.until) {
                const until = new Date(rule.until).getTime();
                if (until < now)
                    continue;
            }
            // Check rule ID match
            if (rule.target.ruleId && rule.target.ruleId !== issue.ruleId) {
                continue;
            }
            // Check path match (if applicable)
            if (rule.target.path) {
                // Would need file path from issue to match
                // For now, skip path matching
            }
            return true;
        }
        return false;
    }
    shouldSuppressVulnerability(vulnerability) {
        const now = Date.now();
        for (const rule of this.suppressionRules) {
            if (rule.type !== 'vulnerability')
                continue;
            // Check if rule has expired
            if (rule.until) {
                const until = new Date(rule.until).getTime();
                if (until < now)
                    continue;
            }
            // Check package match
            if (rule.target.package && rule.target.package !== vulnerability.packageName) {
                continue;
            }
            // Check vulnerability ID match
            if (rule.target.vulnerabilityId && rule.target.vulnerabilityId !== vulnerability.vulnerabilityId) {
                continue;
            }
            return true;
        }
        return false;
    }
    shouldEnforceIssue(issue) {
        if (!this.activePolicySet)
            return true;
        // Check against active policies
        for (const policy of this.activePolicySet.policies) {
            if (!policy.enabled)
                continue;
            // Check if issue falls under this policy's scope
            if (this.isInPolicyScope(issue, policy)) {
                // Check severity threshold
                if (this.meetsSeverityThreshold(issue.severity, this.activePolicySet.defaultSeverityThreshold)) {
                    return true;
                }
            }
        }
        return false;
    }
    shouldEnforceVulnerability(vulnerability) {
        if (!this.activePolicySet)
            return true;
        return this.meetsSeverityThreshold(vulnerability.severity, this.activePolicySet.defaultSeverityThreshold);
    }
    isInPolicyScope(issue, policy) {
        // Simple scope matching - in production would use more sophisticated glob matching
        return policy.scope.includes("**/*") || policy.scope.some(scope => scope.includes("*"));
    }
    meetsSeverityThreshold(severity, threshold) {
        const severityLevels = {
            "info": 0,
            "low": 1,
            "medium": 2,
            "high": 3,
            "critical": 4
        };
        return severityLevels[severity] >= severityLevels[threshold];
    }
    checkIssueCompliance(issue, policy) {
        // Check if issue violates policy rules
        for (const rule of policy.rules) {
            if (rule.category === "sast" && issue.ruleId.includes(rule.id)) {
                if (policy.enforcement === "blocking" && issue.severity === "critical") {
                    return `Critical security issue violates ${policy.name}: ${rule.name}`;
                }
            }
            if (rule.category === "secrets" && issue.ruleId.includes("SECRET")) {
                if (policy.enforcement === "blocking") {
                    return `Hardcoded secret violates ${policy.name}: ${rule.name}`;
                }
            }
        }
        return null;
    }
    checkVulnerabilityCompliance(vuln, policy) {
        // Check if vulnerability violates policy rules
        for (const rule of policy.rules) {
            if (rule.category === "dependency") {
                if (rule.id === "no-critical-vulnerabilities" && vuln.severity === "critical") {
                    return `Critical vulnerability violates ${policy.name}: ${rule.name}`;
                }
                if (rule.id === "no-high-vulnerabilities" && vuln.severity === "high") {
                    return `High severity vulnerability violates ${policy.name}: ${rule.name}`;
                }
            }
        }
        return null;
    }
    validatePolicy(data) {
        try {
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                rules: data.rules || [],
                enabled: data.enabled !== false,
                enforcement: data.enforcement || "warning",
                scope: data.scope || ["**/*"],
                metadata: data.metadata
            };
        }
        catch (error) {
            console.warn("Invalid policy data:", error);
            return null;
        }
    }
    validatePolicySet(data) {
        try {
            const policies = (data.policies || []).map((p) => this.policies.get(p.id) || this.validatePolicy(p)).filter(Boolean);
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                policies,
                defaultSeverityThreshold: data.defaultSeverityThreshold || "medium",
                defaultConfidenceThreshold: data.defaultConfidenceThreshold || 0.7,
                metadata: data.metadata
            };
        }
        catch (error) {
            console.warn("Invalid policy set data:", error);
            return null;
        }
    }
}
//# sourceMappingURL=policies.js.map