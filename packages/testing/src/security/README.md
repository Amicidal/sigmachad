# Security Module

A comprehensive security scanning and analysis module for the Memento project that integrates Static Application Security Testing (SAST), Software Composition Analysis (SCA), secrets detection, and compliance checking into development workflows.

## Features

### Core Security Scanning
- **Static Application Security Testing (SAST)**: Analyzes source code for security vulnerabilities
- **Secrets Detection**: Identifies exposed credentials, API keys, and sensitive information
- **Software Composition Analysis (SCA)**: Scans dependencies for known vulnerabilities
- **Dependency Scanning**: Comprehensive analysis of project dependencies across multiple ecosystems

### Security Management
- **Policy Management**: Configurable security policies and rule sets
- **Compliance Checking**: OWASP Top 10, NIST, and custom framework compliance
- **Suppression Rules**: Manage false positives and acceptable risks
- **Security Reporting**: Generate detailed reports in multiple formats

### CI/CD Integration
- **GitHub Actions**: Automated security scanning in CI/CD pipelines
- **Pre-commit Hooks**: Prevent security issues from being committed
- **CLI Interface**: Command-line tools for development workflows
- **SARIF Support**: Integration with GitHub Security tab

## Quick Start

### Installation

```bash
pnpm add @memento/testing
```

### Basic Usage

```typescript
import { SecurityScanner } from '@memento/testing';

const scanner = new SecurityScanner(db, kgService);
await scanner.initialize();

const result = await scanner.performScan({
  entityIds: ['file-1', 'file-2'],
  scanTypes: ['sast', 'secrets', 'dependencies']
});

console.log(`Found ${result.summary.totalIssues} security issues`);
```

### CLI Usage

```bash
# Full security scan
pnpm security:scan

# Scan for secrets only
pnpm security:secrets:check

# Check dependencies
pnpm security:deps:check

# Generate security report
pnpm security:report --format=html --output=security-report.html

# Check compliance
pnpm security:compliance --framework=owasp
```

## Architecture

### Components

- **SecurityScanner**: Main orchestrator for all security scanning activities
- **CodeScanner**: SAST engine for static code analysis
- **SecretsScanner**: Detects exposed secrets and credentials
- **DependencyScanner**: SCA for dependency vulnerability scanning
- **VulnerabilityDatabase**: Manages vulnerability data from OSV, NVD, and other sources
- **SecurityPolicies**: Policy management and enforcement
- **SecurityReports**: Report generation in multiple formats

### Scanning Process

1. **Entity Discovery**: Identify files and dependencies to scan
2. **Parallel Scanning**: Run multiple scanners concurrently
3. **Policy Application**: Apply security policies and filters
4. **Result Aggregation**: Combine and deduplicate findings
5. **Report Generation**: Create reports in requested formats

## Security Rules

### SAST Rules
- SQL Injection (CWE-89)
- Cross-Site Scripting (CWE-79)
- Command Injection (CWE-78)
- Path Traversal (CWE-22)
- Weak Cryptography (CWE-327)
- Insecure Random Generation (CWE-338)
- XXE Injection (CWE-611)
- LDAP Injection (CWE-90)

### Secrets Detection
- AWS Access Keys & Secret Keys
- GitHub Personal Access Tokens
- Google API Keys
- Slack Bot Tokens
- Discord Bot Tokens
- SSH Private Keys
- Database Connection Strings
- JWT Tokens
- Hardcoded Passwords

### Dependency Scanning
- Known CVEs via OSV.dev
- License compliance
- Outdated packages
- Malicious packages

## Configuration

### Security Policies

Create `.security-policies.json`:

```json
{
  "activePolicySet": "default",
  "policySets": [
    {
      "id": "default",
      "name": "Default Security Policy",
      "defaultSeverityThreshold": "medium",
      "defaultConfidenceThreshold": 0.7,
      "policies": [
        {
          "id": "owasp-top-10",
          "enabled": true,
          "enforcement": "blocking"
        }
      ]
    }
  ]
}
```

### Suppression Rules

Create `.security-suppressions.json`:

```json
{
  "suppressions": [
    {
      "type": "vulnerability",
      "target": {
        "package": "lodash",
        "vulnerabilityId": "CVE-2021-23337"
      },
      "until": "2024-12-31",
      "reason": "Risk accepted for testing environment"
    },
    {
      "type": "issue",
      "target": {
        "ruleId": "HARDCODED_SECRET",
        "path": "tests/**/*"
      },
      "reason": "Test data, not production secrets"
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions

The module includes a comprehensive GitHub Actions workflow (`.github/workflows/security-scan.yml`) that:

- Runs on push, PR, and scheduled intervals
- Performs multi-stage security scanning
- Uploads results to GitHub Security tab
- Comments on PRs with security findings
- Fails builds on critical security issues

### Pre-commit Hooks

Security checks are integrated into pre-commit hooks to prevent security issues from being committed:

- Secrets scanning on staged files
- Quick dependency vulnerability check
- Security policy validation

## Reporting

### Supported Formats
- **JSON**: Machine-readable results
- **HTML**: Rich visual reports
- **Markdown**: Documentation-friendly format
- **CSV**: Spreadsheet analysis
- **SARIF**: GitHub Security integration

### Report Types
- **Vulnerability Reports**: Dependency vulnerabilities grouped by package
- **Security Audits**: Comprehensive security posture assessment
- **Compliance Reports**: Framework-specific compliance status
- **Trend Analysis**: Security metrics over time

## Extensibility

### Custom Rules

Add custom security rules:

```typescript
const customRule: SecurityRule = {
  id: 'CUSTOM_RULE',
  name: 'Custom Security Rule',
  description: 'Detects custom security pattern',
  severity: 'high',
  category: 'sast',
  pattern: /dangerous-pattern/gi,
  remediation: 'Replace with secure alternative'
};
```

### Custom Scanners

Implement the scanner interface:

```typescript
class CustomScanner {
  async scan(entities: any[], options: SecurityScanOptions): Promise<SecurityIssue[]> {
    // Custom scanning logic
    return issues;
  }
}
```

## Environment Variables

- `SECURITY_OSV_ENABLED`: Enable OSV.dev vulnerability scanning (default: true)
- `SECURITY_OSV_BATCH`: Use batch API for better performance (default: true)
- `SECURITY_MIN_SEVERITY`: Minimum severity to report (default: medium)
- `SECURITY_MIN_CONFIDENCE`: Minimum confidence threshold (default: 0.7)
- `SECURITY_SUPPRESSIONS`: Path to suppression rules file (default: .security-suppressions.json)

## Best Practices

### Development Workflow
1. Run `pnpm security:secrets:check` before committing
2. Address critical and high severity issues immediately
3. Use suppression rules judiciously with expiration dates
4. Regular dependency updates to fix vulnerabilities
5. Review security reports in CI/CD pipeline

### Production Deployment
1. Scan production dependencies separately
2. Implement runtime security monitoring
3. Use environment variables for all secrets
4. Regular security audits and penetration testing
5. Keep vulnerability database updated

## Troubleshooting

### Common Issues

**OSV API Rate Limiting**
```bash
# Use batch mode for better performance
export SECURITY_OSV_BATCH=true
```

**False Positives**
```bash
# Add suppression rule
pnpm security:policy:suppress --rule-id=RULE_ID --reason="False positive"
```

**Large Repository Scanning**
```bash
# Use incremental scanning
pnpm security:scan --scope=recent
```

### Performance Tuning

- Use `.gitignore` patterns to exclude unnecessary files
- Implement file size limits for large repositories
- Use parallel scanning for better performance
- Cache vulnerability database locally

## Contributing

### Adding New Rules
1. Define rule in appropriate scanner
2. Add comprehensive tests
3. Update documentation
4. Consider false positive rate

### Testing
```bash
# Run security module tests
pnpm test security

# Run specific scanner tests
pnpm test code-scanner
pnpm test secrets-scanner
```

## Security Considerations

- Secrets are redacted in reports and logs
- Vulnerability data is cached securely
- Network requests use HTTPS with timeouts
- File access is validated and restricted
- No sensitive data is stored permanently

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.
