/**
 * Static Application Security Testing (SAST) Code Scanner
 * Analyzes source code for security vulnerabilities and issues
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import {
  SecurityRule,
  SecurityScanOptions,
  SecurityIssue,
  CodeSecurityIssue,
  SecuritySeverity
} from "./types.js";

export class CodeScanner {
  private rules: SecurityRule[] = [];

  async initialize(): Promise<void> {
    this.loadSecurityRules();
  }

  async scan(entities: any[], options: SecurityScanOptions): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const entity of entities) {
      if (!this.isFileEntity(entity)) continue;

      try {
        const content = await this.readFileContent(entity.path);
        if (!content) continue;

        const fileIssues = this.scanFileForIssues(content, entity, options);
        issues.push(...fileIssues);
      } catch (error) {
        console.warn(`Failed to scan file ${entity.path}:`, error);
      }
    }

    return issues;
  }

  private loadSecurityRules(): void {
    this.rules = [
      // SQL Injection patterns
      {
        id: "SQL_INJECTION",
        name: "SQL Injection Vulnerability",
        description: "Potential SQL injection vulnerability detected",
        severity: "critical",
        cwe: "CWE-89",
        owasp: "A03:2021-Injection",
        pattern: /SELECT.*FROM.*WHERE.*[+=]\s*['"][^'"]*\s*\+\s*\w+|execute\s*\([^)]*[+=]\s*['"][^'"]*\s*\+\s*\w+\)/gi,
        category: "sast",
        remediation: "Use parameterized queries or prepared statements instead of string concatenation",
        confidence: 0.9,
        tags: ["injection", "database"]
      },

      // Cross-Site Scripting patterns
      {
        id: "XSS_VULNERABILITY",
        name: "Cross-Site Scripting (XSS)",
        description: "Potential XSS vulnerability in user input handling",
        severity: "high",
        cwe: "CWE-79",
        owasp: "A03:2021-Injection",
        pattern: /(innerHTML|outerHTML|document\.write)\s*=\s*\w+|getElementById\s*\([^)]*\)\.innerHTML\s*=/gi,
        category: "sast",
        remediation: "Use textContent or properly sanitize HTML input",
        confidence: 0.8,
        tags: ["xss", "injection", "web"]
      },

      // Command injection patterns
      {
        id: "COMMAND_INJECTION",
        name: "Command Injection",
        description: "Potential command injection vulnerability",
        severity: "critical",
        cwe: "CWE-78",
        owasp: "A03:2021-Injection",
        pattern: /exec\s*\(\s*['"].*['"]\s*\+\s*\w+|spawn\s*\(\s*\w+|system\s*\(\s*['"].*['"]\s*\+/gi,
        category: "sast",
        remediation: "Validate and sanitize input, use safe APIs",
        confidence: 0.9,
        tags: ["injection", "command", "execution"]
      },

      // Path traversal patterns
      {
        id: "PATH_TRAVERSAL",
        name: "Path Traversal",
        description: "Potential path traversal vulnerability",
        severity: "high",
        cwe: "CWE-22",
        owasp: "A01:2021-Broken Access Control",
        pattern: /\.\.[\/\\]|\.\.%2f|\.\.%5c/gi,
        category: "sast",
        remediation: "Validate file paths and use path.join with proper validation",
        confidence: 0.7,
        tags: ["traversal", "filesystem", "access-control"]
      },

      // Insecure random number generation
      {
        id: "INSECURE_RANDOM",
        name: "Insecure Random Number Generation",
        description: "Use of insecure random number generation",
        severity: "medium",
        cwe: "CWE-338",
        owasp: "A02:2021-Cryptographic Failures",
        pattern: /\bMath\.random\(\)/gi,
        category: "sast",
        remediation: "Use crypto.randomBytes() or crypto.randomInt() for secure random generation",
        confidence: 0.6,
        tags: ["crypto", "random", "weak"]
      },

      // Weak cryptography
      {
        id: "WEAK_CRYPTO",
        name: "Weak Cryptographic Algorithm",
        description: "Use of weak cryptographic algorithms",
        severity: "medium",
        cwe: "CWE-327",
        owasp: "A02:2021-Cryptographic Failures",
        pattern: /\b(md5|sha1)\s*\(/gi,
        category: "sast",
        remediation: "Use strong cryptographic algorithms like SHA-256, AES-256",
        confidence: 0.8,
        tags: ["crypto", "weak", "hash"]
      },

      // Missing input validation
      {
        id: "MISSING_VALIDATION",
        name: "Missing Input Validation",
        description: "Potential missing input validation",
        severity: "medium",
        cwe: "CWE-20",
        owasp: "A03:2021-Injection",
        pattern: /\b(req\.body|req\.query|req\.params)\s*\[\s*['"][^'"]*['"]\s*\]/gi,
        category: "sast",
        remediation: "Add proper input validation and sanitization",
        confidence: 0.5,
        tags: ["validation", "input", "web"]
      },

      // Insecure deserialization
      {
        id: "INSECURE_DESERIALIZATION",
        name: "Insecure Deserialization",
        description: "Potential insecure deserialization vulnerability",
        severity: "high",
        cwe: "CWE-502",
        owasp: "A08:2021-Software and Data Integrity Failures",
        pattern: /(JSON\.parse|eval|Function|setTimeout|setInterval)\s*\(\s*\w+\s*\)/gi,
        category: "sast",
        remediation: "Validate and sanitize input before deserialization",
        confidence: 0.6,
        tags: ["deserialization", "execution", "injection"]
      },

      // LDAP injection
      {
        id: "LDAP_INJECTION",
        name: "LDAP Injection",
        description: "Potential LDAP injection vulnerability",
        severity: "high",
        cwe: "CWE-90",
        owasp: "A03:2021-Injection",
        pattern: /ldap.*search.*\+.*\w+|ldap.*filter.*\+.*\w+/gi,
        category: "sast",
        remediation: "Use parameterized LDAP queries and input validation",
        confidence: 0.8,
        tags: ["injection", "ldap", "authentication"]
      },

      // XXE (XML External Entity) injection
      {
        id: "XXE_INJECTION",
        name: "XML External Entity (XXE) Injection",
        description: "Potential XXE injection vulnerability",
        severity: "high",
        cwe: "CWE-611",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /<!ENTITY.*SYSTEM|<!DOCTYPE.*\[.*<!ENTITY/gi,
        category: "sast",
        remediation: "Disable external entity processing in XML parsers",
        confidence: 0.9,
        tags: ["xxe", "xml", "injection"]
      },

      // OWASP Top 10 2021 - A01: Broken Access Control
      {
        id: "BROKEN_ACCESS_CONTROL",
        name: "Broken Access Control",
        description: "Potential broken access control - missing authorization checks",
        severity: "high",
        cwe: "CWE-862",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(route|endpoint|handler).*\.(get|post|put|delete).*(?!.*\b(auth|authorize|permission|role)\b)/gi,
        category: "sast",
        remediation: "Implement proper authorization checks before accessing resources",
        confidence: 0.5,
        tags: ["access-control", "authorization", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A02: Cryptographic Failures (Additional patterns)
      {
        id: "WEAK_ENCRYPTION",
        name: "Weak Encryption Algorithm",
        description: "Use of weak encryption algorithms",
        severity: "high",
        cwe: "CWE-327",
        owasp: "A02:2021-Cryptographic Failures",
        pattern: /\b(DES|3DES|RC4|RC2)\b/gi,
        category: "sast",
        remediation: "Use AES-256 or other strong encryption algorithms",
        confidence: 0.9,
        tags: ["crypto", "weak-encryption", "owasp-top10"]
      },

      {
        id: "HARDCODED_CRYPTO_KEY",
        name: "Hardcoded Cryptographic Key",
        description: "Cryptographic key hardcoded in source code",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A02:2021-Cryptographic Failures",
        pattern: /(encrypt|decrypt|cipher|key)\s*[:=]\s*['"][^'"]{16,}['"]/gi,
        category: "sast",
        remediation: "Store cryptographic keys in secure key management systems",
        confidence: 0.7,
        tags: ["crypto", "hardcoded-key", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A03: Injection (Additional patterns)
      {
        id: "NOSQL_INJECTION",
        name: "NoSQL Injection",
        description: "Potential NoSQL injection vulnerability",
        severity: "high",
        cwe: "CWE-943",
        owasp: "A03:2021-Injection",
        pattern: /\$where.*\+.*\w+|find\s*\(\s*{.*\+.*}|eval\s*\(.*\+.*\)/gi,
        category: "sast",
        remediation: "Use parameterized queries and validate input for NoSQL operations",
        confidence: 0.8,
        tags: ["nosql", "injection", "database", "owasp-top10"]
      },

      {
        id: "OS_COMMAND_INJECTION",
        name: "OS Command Injection",
        description: "Operating system command injection vulnerability",
        severity: "critical",
        cwe: "CWE-78",
        owasp: "A03:2021-Injection",
        pattern: /(exec|system|spawn|popen|subprocess)\s*\(\s*['"].*['"]\s*\+\s*\w+/gi,
        category: "sast",
        remediation: "Use safe APIs and validate/sanitize all user input",
        confidence: 0.9,
        tags: ["command-injection", "os", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A04: Insecure Design
      {
        id: "MISSING_RATE_LIMITING",
        name: "Missing Rate Limiting",
        description: "API endpoint without rate limiting implementation",
        severity: "medium",
        cwe: "CWE-770",
        owasp: "A04:2021-Insecure Design",
        pattern: /(app\.(get|post|put|delete)|router\.(get|post|put|delete))(?!.*\b(rateLimit|throttle|limit)\b)/gi,
        category: "sast",
        remediation: "Implement rate limiting to prevent abuse",
        confidence: 0.4,
        tags: ["rate-limiting", "dos", "owasp-top10"]
      },

      {
        id: "INSUFFICIENT_LOGGING",
        name: "Insufficient Security Logging",
        description: "Security events not properly logged",
        severity: "medium",
        cwe: "CWE-778",
        owasp: "A09:2021-Security Logging and Monitoring Failures",
        pattern: /(login|authentication|authorization|access.*denied)(?!.*\b(log|audit|record)\b)/gi,
        category: "sast",
        remediation: "Implement comprehensive security event logging",
        confidence: 0.3,
        tags: ["logging", "monitoring", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A05: Security Misconfiguration
      {
        id: "DEBUG_MODE_ENABLED",
        name: "Debug Mode Enabled",
        description: "Debug mode enabled in production code",
        severity: "medium",
        cwe: "CWE-489",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(debug\s*[:=]\s*true|DEBUG\s*[:=]\s*true|NODE_ENV.*development)/gi,
        category: "sast",
        remediation: "Disable debug mode in production environments",
        confidence: 0.8,
        tags: ["debug", "configuration", "owasp-top10"]
      },

      {
        id: "CORS_MISCONFIGURATION",
        name: "CORS Misconfiguration",
        description: "Potentially insecure CORS configuration",
        severity: "medium",
        cwe: "CWE-346",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(Access-Control-Allow-Origin\s*:\s*\*|cors.*origin.*\*)/gi,
        category: "sast",
        remediation: "Configure CORS with specific allowed origins",
        confidence: 0.7,
        tags: ["cors", "configuration", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A06: Vulnerable and Outdated Components
      {
        id: "DEPRECATED_FUNCTION",
        name: "Deprecated Function Usage",
        description: "Usage of deprecated functions that may have security issues",
        severity: "medium",
        cwe: "CWE-477",
        owasp: "A06:2021-Vulnerable and Outdated Components",
        pattern: /\b(eval|unescape|escape|document\.write|innerHTML)\s*\(/gi,
        category: "sast",
        remediation: "Replace deprecated functions with secure alternatives",
        confidence: 0.6,
        tags: ["deprecated", "legacy", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A07: Identification and Authentication Failures
      {
        id: "WEAK_SESSION_CONFIG",
        name: "Weak Session Configuration",
        description: "Insecure session configuration detected",
        severity: "high",
        cwe: "CWE-384",
        owasp: "A07:2021-Identification and Authentication Failures",
        pattern: /(session.*secure\s*:\s*false|session.*httpOnly\s*:\s*false)/gi,
        category: "sast",
        remediation: "Configure sessions with secure and httpOnly flags",
        confidence: 0.8,
        tags: ["session", "authentication", "owasp-top10"]
      },

      {
        id: "MISSING_PASSWORD_POLICY",
        name: "Missing Password Policy",
        description: "Password validation without proper complexity requirements",
        severity: "medium",
        cwe: "CWE-521",
        owasp: "A07:2021-Identification and Authentication Failures",
        pattern: /password.*validate(?!.*\b(length|complexity|special|number|uppercase)\b)/gi,
        category: "sast",
        remediation: "Implement strong password policy validation",
        confidence: 0.5,
        tags: ["password", "authentication", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A08: Software and Data Integrity Failures
      {
        id: "UNSIGNED_CODE_EXECUTION",
        name: "Unsigned Code Execution",
        description: "Execution of unsigned or unverified code",
        severity: "high",
        cwe: "CWE-494",
        owasp: "A08:2021-Software and Data Integrity Failures",
        pattern: /(eval|Function|setTimeout|setInterval)\s*\(\s*[^)]*\+[^)]*\)/gi,
        category: "sast",
        remediation: "Validate and verify code integrity before execution",
        confidence: 0.8,
        tags: ["code-execution", "integrity", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A09: Security Logging and Monitoring Failures
      {
        id: "SENSITIVE_DATA_LOGGED",
        name: "Sensitive Data in Logs",
        description: "Sensitive information potentially logged",
        severity: "medium",
        cwe: "CWE-532",
        owasp: "A09:2021-Security Logging and Monitoring Failures",
        pattern: /log.*\b(password|token|secret|key|credit.*card|ssn)\b/gi,
        category: "sast",
        remediation: "Remove sensitive data from log statements",
        confidence: 0.7,
        tags: ["logging", "sensitive-data", "owasp-top10"]
      },

      // OWASP Top 10 2021 - A10: Server-Side Request Forgery (SSRF)
      {
        id: "SSRF_VULNERABILITY",
        name: "Server-Side Request Forgery (SSRF)",
        description: "Potential SSRF vulnerability in HTTP requests",
        severity: "high",
        cwe: "CWE-918",
        owasp: "A10:2021-Server-Side Request Forgery (SSRF)",
        pattern: /(http\.|fetch|axios|request)\s*\(\s*[^)]*\+[^)]*/gi,
        category: "sast",
        remediation: "Validate and whitelist URLs before making requests",
        confidence: 0.6,
        tags: ["ssrf", "http", "owasp-top10"]
      },

      // CWE Top 25 2023 - Additional dangerous software weaknesses

      // CWE-79: Cross-site Scripting (already covered above, enhanced pattern)
      {
        id: "DOM_XSS",
        name: "DOM-based Cross-Site Scripting",
        description: "DOM-based XSS vulnerability detected",
        severity: "high",
        cwe: "CWE-79",
        owasp: "A03:2021-Injection",
        pattern: /(location\.hash|location\.search|window\.name|document\.referrer).*innerHTML/gi,
        category: "sast",
        remediation: "Sanitize DOM sources before using in innerHTML or other DOM sinks",
        confidence: 0.9,
        tags: ["xss", "dom", "cwe-top25"]
      },

      // CWE-20: Improper Input Validation
      {
        id: "IMPROPER_INPUT_VALIDATION",
        name: "Improper Input Validation",
        description: "Input validation bypass or insufficient validation",
        severity: "high",
        cwe: "CWE-20",
        owasp: "A03:2021-Injection",
        pattern: /\b(req\.(body|query|params)|input|userInput)(?!.*\b(validate|sanitize|escape|check)\b)/gi,
        category: "sast",
        remediation: "Implement comprehensive input validation and sanitization",
        confidence: 0.4,
        tags: ["input-validation", "sanitization", "cwe-top25"]
      },

      // CWE-125: Out-of-bounds Read
      {
        id: "BUFFER_OVERFLOW_READ",
        name: "Potential Buffer Over-read",
        description: "Array or buffer access without bounds checking",
        severity: "high",
        cwe: "CWE-125",
        owasp: "A06:2021-Vulnerable and Outdated Components",
        pattern: /\[[^\]]*\+[^\]]*\](?!.*\b(length|bounds|check)\b)/gi,
        category: "sast",
        remediation: "Add bounds checking before array/buffer access",
        confidence: 0.5,
        tags: ["buffer", "bounds-check", "cwe-top25"]
      },

      // CWE-787: Out-of-bounds Write
      {
        id: "BUFFER_OVERFLOW_WRITE",
        name: "Potential Buffer Overflow Write",
        description: "Buffer write operation without bounds checking",
        severity: "critical",
        cwe: "CWE-787",
        owasp: "A06:2021-Vulnerable and Outdated Components",
        pattern: /(strcpy|strcat|sprintf|memcpy)(?!.*\b(bounds|size|limit)\b)/gi,
        category: "sast",
        remediation: "Use safe string functions and bounds checking",
        confidence: 0.8,
        tags: ["buffer-overflow", "memory", "cwe-top25"]
      },

      // CWE-22: Improper Limitation of a Pathname (already covered above, enhanced)
      {
        id: "PATH_INJECTION",
        name: "Path Injection",
        description: "Unsanitized path construction vulnerability",
        severity: "high",
        cwe: "CWE-22",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(path\.join|fs\.(readFile|writeFile|unlink)|require)\s*\([^)]*\+[^)]*/gi,
        category: "sast",
        remediation: "Sanitize and validate file paths, use path.resolve securely",
        confidence: 0.7,
        tags: ["path-injection", "filesystem", "cwe-top25"]
      },

      // CWE-352: Cross-Site Request Forgery (CSRF)
      {
        id: "CSRF_VULNERABILITY",
        name: "Cross-Site Request Forgery (CSRF)",
        description: "Missing CSRF protection on state-changing operations",
        severity: "medium",
        cwe: "CWE-352",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(app\.(post|put|delete)|router\.(post|put|delete))(?!.*\b(csrf|token|authenticity)\b)/gi,
        category: "sast",
        remediation: "Implement CSRF tokens for state-changing operations",
        confidence: 0.4,
        tags: ["csrf", "state-change", "cwe-top25"]
      },

      // CWE-434: Unrestricted Upload of File with Dangerous Type
      {
        id: "UNRESTRICTED_FILE_UPLOAD",
        name: "Unrestricted File Upload",
        description: "File upload without proper type validation",
        severity: "high",
        cwe: "CWE-434",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(upload|multer|formidable)(?!.*\b(fileFilter|mimetype|extension|whitelist)\b)/gi,
        category: "sast",
        remediation: "Implement file type validation and content verification",
        confidence: 0.6,
        tags: ["file-upload", "validation", "cwe-top25"]
      },

      // CWE-94: Improper Control of Generation of Code (Code Injection)
      {
        id: "CODE_INJECTION_DYNAMIC",
        name: "Dynamic Code Injection",
        description: "Dynamic code generation from user input",
        severity: "critical",
        cwe: "CWE-94",
        owasp: "A03:2021-Injection",
        pattern: /(new Function|eval|setTimeout|setInterval)\s*\([^)]*\b(req\.|input|user)\b[^)]*/gi,
        category: "sast",
        remediation: "Avoid dynamic code generation, use safe alternatives",
        confidence: 0.9,
        tags: ["code-injection", "dynamic", "cwe-top25"]
      },

      // CWE-269: Improper Privilege Management
      {
        id: "PRIVILEGE_ESCALATION",
        name: "Improper Privilege Management",
        description: "Potential privilege escalation vulnerability",
        severity: "high",
        cwe: "CWE-269",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(setuid|seteuid|setgid|setegid|sudo)(?!.*\b(check|validate|authorize)\b)/gi,
        category: "sast",
        remediation: "Implement proper privilege checks and validation",
        confidence: 0.7,
        tags: ["privilege", "escalation", "cwe-top25"]
      },

      // CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization (Race Condition)
      {
        id: "RACE_CONDITION",
        name: "Race Condition",
        description: "Potential race condition in shared resource access",
        severity: "medium",
        cwe: "CWE-362",
        owasp: "A04:2021-Insecure Design",
        pattern: /(global\.|this\.)\w+(?!.*\b(lock|mutex|atomic|synchronized)\b)/gi,
        category: "sast",
        remediation: "Implement proper synchronization mechanisms",
        confidence: 0.3,
        tags: ["race-condition", "concurrency", "cwe-top25"]
      },

      // CWE-190: Integer Overflow or Wraparound
      {
        id: "INTEGER_OVERFLOW",
        name: "Integer Overflow",
        description: "Potential integer overflow in arithmetic operations",
        severity: "medium",
        cwe: "CWE-190",
        owasp: "A04:2021-Insecure Design",
        pattern: /\b(parseInt|parseFloat|Number)\s*\([^)]*\)\s*[\+\-\*]/gi,
        category: "sast",
        remediation: "Add bounds checking for arithmetic operations",
        confidence: 0.4,
        tags: ["integer-overflow", "arithmetic", "cwe-top25"]
      },

      // CWE-611: Improper Restriction of XML External Entity Reference (XXE) - enhanced
      {
        id: "XXE_LIBXML_VULNERABILITY",
        name: "XML Parser XXE Vulnerability",
        description: "XML parser configured to process external entities",
        severity: "high",
        cwe: "CWE-611",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(libxml|xmldom|xml2js)(?!.*\b(noent|false|disable.*entities)\b)/gi,
        category: "sast",
        remediation: "Disable external entity processing in XML parsers",
        confidence: 0.8,
        tags: ["xxe", "xml", "parser", "cwe-top25"]
      },

      // CWE-416: Use After Free (relevant for unsafe operations)
      {
        id: "USE_AFTER_FREE_JS",
        name: "Use After Free Pattern",
        description: "Potential use-after-free pattern in object management",
        severity: "medium",
        cwe: "CWE-416",
        owasp: "A06:2021-Vulnerable and Outdated Components",
        pattern: /(delete\s+\w+|\.destroy\(\)|\.close\(\)).*\1/gi,
        category: "sast",
        remediation: "Ensure proper object lifecycle management",
        confidence: 0.5,
        tags: ["use-after-free", "memory", "cwe-top25"]
      },

      // CWE-863: Incorrect Authorization
      {
        id: "INCORRECT_AUTHORIZATION",
        name: "Incorrect Authorization Logic",
        description: "Authorization logic that may be bypassed",
        severity: "high",
        cwe: "CWE-863",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(if.*\|\||&&.*false|return.*true).*\b(auth|permission|role)\b/gi,
        category: "sast",
        remediation: "Review and strengthen authorization logic",
        confidence: 0.6,
        tags: ["authorization", "logic-flaw", "cwe-top25"]
      },

      // CWE-306: Missing Authentication for Critical Function
      {
        id: "MISSING_AUTHENTICATION",
        name: "Missing Authentication",
        description: "Critical function accessible without authentication",
        severity: "critical",
        cwe: "CWE-306",
        owasp: "A07:2021-Identification and Authentication Failures",
        pattern: /(admin|delete|modify|create).*\.(get|post|put|delete)(?!.*\b(auth|login|authenticate|verify)\b)/gi,
        category: "sast",
        remediation: "Add authentication requirements for critical functions",
        confidence: 0.5,
        tags: ["authentication", "critical-function", "cwe-top25"]
      },

      // CWE-732: Incorrect Permission Assignment for Critical Resource
      {
        id: "INCORRECT_PERMISSIONS",
        name: "Incorrect File/Resource Permissions",
        description: "Overly permissive file or resource permissions",
        severity: "medium",
        cwe: "CWE-732",
        owasp: "A01:2021-Broken Access Control",
        pattern: /(chmod|umask)\s*\(\s*(777|666|755)/gi,
        category: "sast",
        remediation: "Use least-privilege permissions for files and resources",
        confidence: 0.8,
        tags: ["permissions", "filesystem", "cwe-top25"]
      },

      // CWE-476: NULL Pointer Dereference (adapted for JavaScript)
      {
        id: "NULL_REFERENCE",
        name: "Null Reference Access",
        description: "Potential null or undefined reference access",
        severity: "medium",
        cwe: "CWE-476",
        owasp: "A06:2021-Vulnerable and Outdated Components",
        pattern: /\w+\.\w+(?!.*\b(null|undefined|exists|check)\b)/gi,
        category: "sast",
        remediation: "Add null/undefined checks before object access",
        confidence: 0.2,
        tags: ["null-reference", "undefined", "cwe-top25"]
      },

      // CWE-798: Use of Hard-coded Credentials (enhanced coverage)
      {
        id: "HARDCODED_DATABASE_CREDENTIALS",
        name: "Hardcoded Database Credentials",
        description: "Database credentials hardcoded in connection strings",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A02:2021-Cryptographic Failures",
        pattern: /(mongodb|mysql|postgres|redis):\/\/[^:]+:[^@]+@/gi,
        category: "sast",
        remediation: "Use environment variables or secure credential stores",
        confidence: 0.95,
        tags: ["hardcoded-credentials", "database", "cwe-top25"]
      }
    ];
  }

  private scanFileForIssues(
    content: string,
    file: any,
    options: SecurityScanOptions
  ): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const applicableRules = this.getApplicableRules(file.path, options);
    const lines = content.split("\n");

    for (const rule of applicableRules) {
      const matches = Array.from(content.matchAll(rule.pattern));

      for (const match of matches) {
        const lineNumber = this.getLineNumber(lines, match.index || 0);
        const codeSnippet = this.getCodeSnippet(lines, lineNumber);

        // Generate stable fingerprint
        const fpInput = `${file.id}|${rule.id}|${lineNumber}|${codeSnippet}`;
        const uniqueId = `sec_${createHash("sha1").update(fpInput).digest("hex")}`;

        const issue: CodeSecurityIssue = {
          id: uniqueId,
          type: "securityIssue",
          tool: "CodeScanner",
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.name,
          description: rule.description,
          cwe: rule.cwe,
          owasp: rule.owasp,
          affectedEntityId: file.id,
          lineNumber,
          codeSnippet,
          remediation: rule.remediation,
          status: "open",
          discoveredAt: new Date(),
          lastScanned: new Date(),
          confidence: rule.confidence || 0.8,
          filePath: file.path,
          column: this.getColumnNumber(lines[lineNumber - 1] || "", match.index || 0),
          context: {
            before: this.getContextLines(lines, lineNumber, -2),
            after: this.getContextLines(lines, lineNumber, 2)
          },
          metadata: {
            ruleCategory: rule.category,
            tags: rule.tags || [],
            matchedText: match[0]
          }
        };

        issues.push(issue);
      }
    }

    return issues;
  }

  private getApplicableRules(filePath: string, options: SecurityScanOptions): SecurityRule[] {
    return this.rules.filter(rule => {
      // Check if rule category is enabled
      if (rule.category === "sast" && !options.includeSAST) {
        return false;
      }

      // Check severity threshold
      if (!this.meetsSeverityThreshold(rule.severity, options.severityThreshold)) {
        return false;
      }

      // Check confidence threshold
      if ((rule.confidence || 0.8) < options.confidenceThreshold) {
        return false;
      }

      // Check file type applicability
      return this.isRuleApplicableToFile(rule, filePath);
    });
  }

  private isRuleApplicableToFile(rule: SecurityRule, filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();

    // Apply rules based on file type
    switch (ext) {
      case ".js":
      case ".ts":
      case ".jsx":
      case ".tsx":
        return true; // Most rules apply to JavaScript/TypeScript
      case ".py":
        return ["SQL_INJECTION", "COMMAND_INJECTION", "PATH_TRAVERSAL"].includes(rule.id);
      case ".java":
        return ["SQL_INJECTION", "XSS_VULNERABILITY", "COMMAND_INJECTION"].includes(rule.id);
      case ".php":
        return ["SQL_INJECTION", "XSS_VULNERABILITY", "COMMAND_INJECTION", "PATH_TRAVERSAL"].includes(rule.id);
      case ".xml":
        return ["XXE_INJECTION"].includes(rule.id);
      default:
        return false;
    }
  }

  private meetsSeverityThreshold(
    ruleSeverity: SecuritySeverity,
    threshold: SecuritySeverity
  ): boolean {
    const severityLevels: Record<SecuritySeverity, number> = {
      "info": 0,
      "low": 1,
      "medium": 2,
      "high": 3,
      "critical": 4
    };

    return severityLevels[ruleSeverity] >= severityLevels[threshold];
  }

  private getLineNumber(lines: string[], charIndex: number): number {
    let currentChar = 0;
    for (let i = 0; i < lines.length; i++) {
      currentChar += lines[i].length + 1; // +1 for newline
      if (currentChar > charIndex) {
        return i + 1;
      }
    }
    return lines.length;
  }

  private getColumnNumber(line: string, charIndex: number): number {
    const lineStart = charIndex - line.length;
    return Math.max(0, charIndex - lineStart);
  }

  private getCodeSnippet(
    lines: string[],
    lineNumber: number,
    context: number = 2
  ): string {
    const start = Math.max(0, lineNumber - context - 1);
    const end = Math.min(lines.length, lineNumber + context);
    return lines.slice(start, end).join("\n");
  }

  private getContextLines(
    lines: string[],
    lineNumber: number,
    offset: number
  ): string[] {
    if (offset < 0) {
      const start = Math.max(0, lineNumber + offset - 1);
      const end = lineNumber - 1;
      return lines.slice(start, end);
    } else {
      const start = lineNumber;
      const end = Math.min(lines.length, lineNumber + offset);
      return lines.slice(start, end);
    }
  }

  private isFileEntity(entity: any): boolean {
    return entity && entity.type === "file" && entity.path;
  }

  private async readFileContent(filePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024) { // Skip files larger than 10MB
        console.warn(`Skipping large file: ${filePath} (${stats.size} bytes)`);
        return null;
      }

      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }
}