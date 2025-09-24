# Security Scanner Examples

This document provides examples of common security issues detected by the Memento Security Scanner, along with remediation guidance.

## Table of Contents

- [SQL Injection Vulnerabilities](#sql-injection-vulnerabilities)
- [Cross-Site Scripting (XSS)](#cross-site-scripting-xss)
- [Command Injection](#command-injection)
- [Hardcoded Secrets](#hardcoded-secrets)
- [Insecure Cryptography](#insecure-cryptography)
- [Path Traversal](#path-traversal)
- [Dependency Vulnerabilities](#dependency-vulnerabilities)
- [OWASP Top 10 Coverage](#owasp-top-10-coverage)

## SQL Injection Vulnerabilities

**CWE-89 | OWASP A03:2021-Injection**

### Vulnerable Code Example
```javascript
// ❌ VULNERABLE - String concatenation in SQL query
const getUserById = (userId) => {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
};

// ❌ VULNERABLE - Template literal with user input
const searchUsers = (searchTerm) => {
  const query = `SELECT * FROM users WHERE name LIKE '%${searchTerm}%'`;
  return db.execute(query);
};
```

### Secure Code Example
```javascript
// ✅ SECURE - Parameterized query
const getUserById = (userId) => {
  const query = "SELECT * FROM users WHERE id = ?";
  return db.execute(query, [userId]);
};

// ✅ SECURE - Using ORM/Query Builder
const searchUsers = (searchTerm) => {
  return User.where('name', 'LIKE', `%${searchTerm}%`).get();
};

// ✅ SECURE - Prepared statement
const getUserByEmail = async (email) => {
  const statement = await db.prepare('SELECT * FROM users WHERE email = ?');
  return statement.get(email);
};
```

### Detection Pattern
```regex
/SELECT.*FROM.*WHERE.*[+=]\s*['"][^'"]*\s*\+\s*\w+|execute\s*\([^)]*[+=]\s*['"][^'"]*\s*\+\s*\w+\)/gi
```

## Cross-Site Scripting (XSS)

**CWE-79 | OWASP A03:2021-Injection**

### Vulnerable Code Example
```javascript
// ❌ VULNERABLE - Direct innerHTML assignment
const displayUserComment = (comment) => {
  document.getElementById('comments').innerHTML = comment;
};

// ❌ VULNERABLE - jQuery HTML insertion
const showMessage = (message) => {
  $('#message').html(message);
};

// ❌ VULNERABLE - React dangerouslySetInnerHTML
const MessageComponent = ({ message }) => {
  return <div dangerouslySetInnerHTML={{ __html: message }} />;
};
```

### Secure Code Example
```javascript
// ✅ SECURE - Use textContent for plain text
const displayUserComment = (comment) => {
  document.getElementById('comments').textContent = comment;
};

// ✅ SECURE - jQuery text() method
const showMessage = (message) => {
  $('#message').text(message);
};

// ✅ SECURE - React with proper escaping
const MessageComponent = ({ message }) => {
  return <div>{message}</div>;
};

// ✅ SECURE - HTML sanitization library
import DOMPurify from 'dompurify';

const displayHTML = (htmlContent) => {
  const cleanHTML = DOMPurify.sanitize(htmlContent);
  document.getElementById('content').innerHTML = cleanHTML;
};
```

### Detection Pattern
```regex
/(innerHTML|outerHTML|document\.write)\s*=\s*\w+|getElementById\s*\([^)]*\)\.innerHTML\s*=/gi
```

## Command Injection

**CWE-78 | OWASP A03:2021-Injection**

### Vulnerable Code Example
```javascript
// ❌ VULNERABLE - Shell command with user input
const processFile = (filename) => {
  const { exec } = require('child_process');
  exec(`cat ${filename}`, (error, stdout) => {
    console.log(stdout);
  });
};

// ❌ VULNERABLE - System command
const compressFile = (filename) => {
  const command = `gzip ${filename}`;
  require('child_process').spawn('sh', ['-c', command]);
};
```

### Secure Code Example
```javascript
// ✅ SECURE - Parameterized execution
const processFile = (filename) => {
  const { execFile } = require('child_process');
  execFile('cat', [filename], (error, stdout) => {
    console.log(stdout);
  });
};

// ✅ SECURE - Input validation and escaping
const compressFile = (filename) => {
  // Validate filename
  if (!/^[\w\-. ]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  const { spawn } = require('child_process');
  spawn('gzip', [filename]);
};

// ✅ SECURE - Use safe APIs
const processFile = async (filename) => {
  const fs = require('fs').promises;
  const path = require('path');

  // Validate and sanitize path
  const safePath = path.resolve('./uploads', path.basename(filename));
  const content = await fs.readFile(safePath, 'utf8');
  console.log(content);
};
```

### Detection Pattern
```regex
/exec\s*\(\s*['"].*['"]\s*\+\s*\w+|spawn\s*\(\s*\w+|system\s*\(\s*['"].*['"]\s*\+/gi
```

## Hardcoded Secrets

**CWE-798 | OWASP A05:2021-Security Misconfiguration**

### Vulnerable Code Example
```javascript
// ❌ VULNERABLE - Hardcoded API keys
const API_KEY = "sk-1234567890abcdef";
const DATABASE_PASSWORD = "super-secret-password";

// ❌ VULNERABLE - Database connection string
const connectionString = "mongodb://admin:password123@localhost:27017/mydb";

// ❌ VULNERABLE - JWT secret
const JWT_SECRET = "my-super-secret-jwt-key";
```

### Secure Code Example
```javascript
// ✅ SECURE - Environment variables
const API_KEY = process.env.API_KEY;
const DATABASE_PASSWORD = process.env.DB_PASSWORD;

// ✅ SECURE - Configuration service
import config from './config/security';
const JWT_SECRET = config.jwt.secret;

// ✅ SECURE - Azure Key Vault / AWS Secrets Manager
const { SecretClient } = require('@azure/keyvault-secrets');
const client = new SecretClient(vaultUrl, credential);
const secret = await client.getSecret('api-key');

// ✅ SECURE - Docker secrets
const fs = require('fs');
const secret = fs.readFileSync('/run/secrets/api_key', 'utf8').trim();
```

### Common Secret Patterns Detected
- AWS Access Keys: `AKIA[0-9A-Z]{16}`
- GitHub Tokens: `ghp_[A-Za-z0-9]{36}`
- Google API Keys: `AIza[0-9A-Za-z\\-_]{35}`
- Slack Bot Tokens: `xoxb-[0-9]{11,13}-[0-9]{11,13}-[A-Za-z0-9]{24}`
- JWT Tokens: `eyJ[A-Za-z0-9_\/+=]+\.eyJ[A-Za-z0-9_\/+=]+\.[A-Za-z0-9_\/+=]+`

## Insecure Cryptography

**CWE-327 | OWASP A02:2021-Cryptographic Failures**

### Vulnerable Code Example
```javascript
// ❌ VULNERABLE - Weak hashing algorithms
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');

// ❌ VULNERABLE - Insecure random generation
const sessionId = Math.random().toString(36);

// ❌ VULNERABLE - Weak encryption
const cipher = crypto.createCipher('des', key);
```

### Secure Code Example
```javascript
// ✅ SECURE - Strong hashing with salt
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// ✅ SECURE - Secure random generation
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ✅ SECURE - Strong encryption
const encrypt = (text, key) => {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key, iv);
  // ... proper encryption implementation
};
```

## Path Traversal

**CWE-22 | OWASP A01:2021-Broken Access Control**

### Vulnerable Code Example
```javascript
// ❌ VULNERABLE - Direct path concatenation
const getFile = (filename) => {
  const filePath = './uploads/' + filename;
  return fs.readFileSync(filePath);
};

// ❌ VULNERABLE - User-controlled path
const downloadFile = (req, res) => {
  const filePath = req.query.path;
  res.sendFile(filePath);
};
```

### Secure Code Example
```javascript
// ✅ SECURE - Path validation and sanitization
const path = require('path');
const fs = require('fs');

const getFile = (filename) => {
  // Sanitize filename
  const safeName = path.basename(filename);
  const filePath = path.resolve('./uploads', safeName);

  // Ensure path is within allowed directory
  if (!filePath.startsWith(path.resolve('./uploads'))) {
    throw new Error('Invalid file path');
  }

  return fs.readFileSync(filePath);
};

// ✅ SECURE - Whitelist approach
const allowedFiles = ['readme.txt', 'manual.pdf', 'changelog.md'];

const downloadFile = (req, res) => {
  const filename = req.query.filename;

  if (!allowedFiles.includes(filename)) {
    return res.status(403).send('File not allowed');
  }

  const filePath = path.join('./public', filename);
  res.sendFile(path.resolve(filePath));
};
```

## Dependency Vulnerabilities

**CVE Tracking | OWASP A06:2021-Vulnerable and Outdated Components**

### Common Vulnerable Dependencies

#### Lodash < 4.17.12
```json
{
  "vulnerability": "CVE-2019-10744",
  "severity": "high",
  "description": "Prototype pollution in lodash",
  "affected_versions": "<4.17.12",
  "fixed_version": "4.17.12",
  "remediation": "Update lodash to version 4.17.12 or later"
}
```

#### Express < 4.17.2
```json
{
  "vulnerability": "CVE-2019-5413",
  "severity": "medium",
  "description": "Memory exposure in express",
  "affected_versions": "<4.17.2",
  "fixed_version": "4.17.2",
  "remediation": "Update express to version 4.17.2 or later"
}
```

### Remediation Strategy
```bash
# Check for vulnerabilities
pnpm audit

# Update to fix vulnerabilities
pnpm update

# For specific package updates
pnpm add lodash@latest

# For breaking changes, check migration guides
pnpm add express@^4.18.0
```

## OWASP Top 10 Coverage

| OWASP Category | Security Issues Detected | Example Rules |
|---|---|---|
| **A01:2021-Broken Access Control** | Missing authorization, Path traversal, Incorrect permissions | `MISSING_AUTHENTICATION`, `PATH_TRAVERSAL`, `BROKEN_ACCESS_CONTROL` |
| **A02:2021-Cryptographic Failures** | Weak crypto, Hardcoded keys, Insecure storage | `WEAK_CRYPTO`, `HARDCODED_CRYPTO_KEY`, `INSECURE_RANDOM` |
| **A03:2021-Injection** | SQL, NoSQL, Command, XSS injection | `SQL_INJECTION`, `XSS_VULNERABILITY`, `COMMAND_INJECTION` |
| **A04:2021-Insecure Design** | Missing security controls, Insufficient validation | `MISSING_RATE_LIMITING`, `INSUFFICIENT_LOGGING` |
| **A05:2021-Security Misconfiguration** | Debug mode, CORS issues, Default credentials | `DEBUG_MODE_ENABLED`, `CORS_MISCONFIGURATION` |
| **A06:2021-Vulnerable Components** | Outdated dependencies, Known CVEs | Dependency scanning via OSV/NVD databases |
| **A07:2021-Authentication Failures** | Weak sessions, Missing MFA, Password issues | `WEAK_SESSION_CONFIG`, `MISSING_PASSWORD_POLICY` |
| **A08:2021-Data Integrity Failures** | Insecure deserialization, Code execution | `INSECURE_DESERIALIZATION`, `UNSIGNED_CODE_EXECUTION` |
| **A09:2021-Logging Failures** | Insufficient logging, Sensitive data exposure | `INSUFFICIENT_LOGGING`, `SENSITIVE_DATA_LOGGED` |
| **A10:2021-Server-Side Request Forgery** | Unvalidated URL requests | `SSRF_VULNERABILITY` |

## Configuration Examples

### Security Policy Configuration
```yaml
# .security-policy.yml
security:
  severity_threshold: "medium"
  confidence_threshold: 0.7

  rules:
    enabled:
      - SQL_INJECTION
      - XSS_VULNERABILITY
      - COMMAND_INJECTION
      - HARDCODED_SECRET
      - WEAK_CRYPTO

    disabled:
      - NULL_REFERENCE  # Too many false positives

    custom_severity:
      HARDCODED_SECRET: "critical"  # Elevate from high to critical

  suppressions:
    - rule_id: "MISSING_VALIDATION"
      path: "tests/**"
      reason: "Test files don't need full validation"
      until: "2024-12-31"
```

### CI/CD Integration Examples

#### GitHub Actions
```yaml
- name: Security Scan
  run: |
    pnpm run security:scan --format=sarif --output=security.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: security.sarif
```

#### GitLab CI
```yaml
security_scan:
  script:
    - pnpm run security:scan --format=json --output=security-report.json
  artifacts:
    reports:
      security: security-report.json
```

#### Jenkins
```groovy
pipeline {
  stages {
    stage('Security Scan') {
      steps {
        sh 'pnpm run security:scan --format=json'
        publishHTML([
          allowMissing: false,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: '.',
          reportFiles: 'security-report.html',
          reportName: 'Security Report'
        ])
      }
    }
  }
}
```

## Performance Optimization

### Large Repository Scanning
```bash
# Use incremental scanning for faster results
pnpm run security:scan --incremental --baseline=last-scan-id

# Parallel scanning for large codebases
pnpm run security:scan --parallel --max-concurrent=8

# Skip large files to improve performance
pnpm run security:scan --max-file-size=10MB

# Cache results for faster subsequent scans
pnpm run security:scan --cache-enabled
```

### Memory Usage Optimization
```javascript
// Configure scanner for large repositories
const scanner = new SecurityScanner(db, kgService, {
  maxConcurrentScans: 4,
  timeout: 300000, // 5 minutes
  policies: './security-policies.yml'
});

// Monitor memory usage
const usage = process.memoryUsage();
console.log(`Memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
```

## Best Practices

### 1. Regular Scanning
- Run security scans on every commit (pre-commit hooks)
- Schedule daily full scans in CI/CD
- Perform comprehensive audits weekly

### 2. Issue Prioritization
- **Critical**: Fix immediately before deployment
- **High**: Address within current sprint
- **Medium**: Include in next release cycle
- **Low/Info**: Monitor and address as time permits

### 3. False Positive Management
- Use suppressions for confirmed false positives
- Document suppression reasons
- Regularly review and clean up suppressions

### 4. Team Training
- Regular security training for developers
- Code review guidelines including security checks
- Incident response procedures for security findings

### 5. Continuous Improvement
- Monitor scan performance and accuracy
- Update rules based on new threat intelligence
- Regular security tool evaluations and updates