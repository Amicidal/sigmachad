/**
 * Secrets Scanner
 * Detects exposed secrets, credentials, and sensitive information in code
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import {
  SecurityRule,
  SecurityScanOptions,
  SecurityIssue,
  SecretMatch,
  SecuritySeverity
} from "./types.js";

export class SecretsScanner {
  private rules: SecurityRule[] = [];
  private patterns: Map<string, RegExp> = new Map();

  async initialize(): Promise<void> {
    this.loadSecretPatterns();
  }

  async scan(entities: any[], options: SecurityScanOptions): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const entity of entities) {
      if (!this.isFileEntity(entity) || this.shouldSkipFile(entity.path)) {
        continue;
      }

      try {
        const content = await this.readFileContent(entity.path);
        if (!content) continue;

        const secrets = this.scanForSecrets(content, entity.path);
        const fileIssues = this.convertSecretsToIssues(secrets, entity);
        issues.push(...fileIssues);
      } catch (error) {
        console.warn(`Failed to scan file ${entity.path} for secrets:`, error);
      }
    }

    return issues;
  }

  private loadSecretPatterns(): void {
    this.rules = [
      // Generic hardcoded secrets
      {
        id: "HARDCODED_SECRET",
        name: "Hardcoded Secret",
        description: "Potential hardcoded secret or credential",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(password|secret|key|token|API_KEY)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
        category: "secrets",
        remediation: "Move secrets to environment variables or secure key management system",
        confidence: 0.7,
        tags: ["hardcoded", "credentials"]
      },

      // AWS Access Keys
      {
        id: "AWS_ACCESS_KEY",
        name: "AWS Access Key",
        description: "AWS Access Key ID detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /AKIA[0-9A-Z]{16}/gi,
        category: "secrets",
        remediation: "Remove AWS credentials from code and use IAM roles or environment variables",
        confidence: 0.9,
        tags: ["aws", "access-key", "cloud"]
      },

      // AWS Secret Access Keys
      {
        id: "AWS_SECRET_KEY",
        name: "AWS Secret Access Key",
        description: "AWS Secret Access Key detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[A-Za-z0-9/+=]{40}/g,
        category: "secrets",
        remediation: "Remove AWS credentials from code and use IAM roles or environment variables",
        confidence: 0.6, // Lower confidence due to potential false positives
        tags: ["aws", "secret-key", "cloud"]
      },

      // GitHub Personal Access Tokens
      {
        id: "GITHUB_TOKEN",
        name: "GitHub Personal Access Token",
        description: "GitHub Personal Access Token detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/gi,
        category: "secrets",
        remediation: "Remove GitHub tokens from code and use environment variables or GitHub Actions secrets",
        confidence: 0.95,
        tags: ["github", "token", "vcs"]
      },

      // Google API Keys
      {
        id: "GOOGLE_API_KEY",
        name: "Google API Key",
        description: "Google API Key detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /AIza[0-9A-Za-z\\-_]{35}/gi,
        category: "secrets",
        remediation: "Remove Google API keys from code and use environment variables",
        confidence: 0.9,
        tags: ["google", "api-key", "cloud"]
      },

      // Slack Bot Tokens
      {
        id: "SLACK_TOKEN",
        name: "Slack Bot Token",
        description: "Slack Bot Token detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[A-Za-z0-9]{24}/gi,
        category: "secrets",
        remediation: "Remove Slack tokens from code and use environment variables",
        confidence: 0.9,
        tags: ["slack", "token", "api"]
      },

      // Discord Bot Tokens
      {
        id: "DISCORD_TOKEN",
        name: "Discord Bot Token",
        description: "Discord Bot Token detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/gi,
        category: "secrets",
        remediation: "Remove Discord tokens from code and use environment variables",
        confidence: 0.85,
        tags: ["discord", "token", "bot"]
      },

      // JWT Tokens
      {
        id: "JWT_TOKEN",
        name: "JWT Token",
        description: "JWT Token detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /eyJ[A-Za-z0-9_\/+=]+\.eyJ[A-Za-z0-9_\/+=]+\.[A-Za-z0-9_\/+=]+/gi,
        category: "secrets",
        remediation: "Remove JWT tokens from code and generate them dynamically",
        confidence: 0.8,
        tags: ["jwt", "token", "authentication"]
      },

      // Private SSH Keys
      {
        id: "SSH_PRIVATE_KEY",
        name: "SSH Private Key",
        description: "SSH Private Key detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/gi,
        category: "secrets",
        remediation: "Remove private keys from code and use secure key management",
        confidence: 0.95,
        tags: ["ssh", "private-key", "crypto"]
      },

      // Database URLs with credentials
      {
        id: "DATABASE_URL",
        name: "Database URL with Credentials",
        description: "Database connection string with embedded credentials",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(mongodb|mysql|postgresql|postgres):\/\/[^:\s]+:[^@\s]+@[^\/\s]+/gi,
        category: "secrets",
        remediation: "Remove credentials from connection strings and use environment variables",
        confidence: 0.9,
        tags: ["database", "credentials", "connection-string"]
      },

      // Generic passwords in configuration
      {
        id: "PASSWORD_IN_CONFIG",
        name: "Password in Configuration",
        description: "Password found in configuration file",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/gi,
        category: "secrets",
        remediation: "Move passwords to environment variables or secure configuration",
        confidence: 0.6,
        tags: ["password", "configuration"]
      },

      // Credit card numbers (basic pattern)
      {
        id: "CREDIT_CARD",
        name: "Credit Card Number",
        description: "Potential credit card number detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A03:2021-Sensitive Data Exposure",
        pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        category: "secrets",
        remediation: "Remove credit card numbers from code and use tokenization",
        confidence: 0.5, // Lower confidence due to potential false positives
        tags: ["credit-card", "pii", "financial"]
      },

      // Email addresses in certain contexts
      {
        id: "EMAIL_IN_CODE",
        name: "Email Address in Code",
        description: "Email address found in code (potential PII)",
        severity: "low",
        cwe: "CWE-200",
        owasp: "A03:2021-Sensitive Data Exposure",
        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        category: "secrets",
        remediation: "Remove email addresses from code or ensure they are not sensitive",
        confidence: 0.3,
        tags: ["email", "pii"]
      },

      // Additional Cloud Provider Secrets

      // Azure Storage Account Keys
      {
        id: "AZURE_STORAGE_KEY",
        name: "Azure Storage Account Key",
        description: "Azure Storage Account Key detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[A-Za-z0-9+/]{88}==/g,
        category: "secrets",
        remediation: "Remove Azure storage keys from code and use managed identities",
        confidence: 0.7,
        tags: ["azure", "storage", "cloud"]
      },

      // Azure Service Principal Secrets
      {
        id: "AZURE_CLIENT_SECRET",
        name: "Azure Client Secret",
        description: "Azure Service Principal client secret detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[A-Za-z0-9~._-]{34,40}/g,
        category: "secrets",
        remediation: "Remove Azure client secrets from code and use managed identities",
        confidence: 0.6,
        tags: ["azure", "service-principal", "cloud"]
      },

      // Google Cloud Service Account Keys
      {
        id: "GOOGLE_SERVICE_ACCOUNT_KEY",
        name: "Google Cloud Service Account Key",
        description: "Google Cloud Service Account private key detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /-----BEGIN PRIVATE KEY-----[\s\S]*-----END PRIVATE KEY-----/gi,
        category: "secrets",
        remediation: "Remove service account keys from code and use workload identity",
        confidence: 0.9,
        tags: ["google-cloud", "service-account", "private-key"]
      },

      // DigitalOcean Personal Access Tokens
      {
        id: "DIGITALOCEAN_TOKEN",
        name: "DigitalOcean Personal Access Token",
        description: "DigitalOcean Personal Access Token detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /dop_v1_[a-f0-9]{64}/gi,
        category: "secrets",
        remediation: "Remove DigitalOcean tokens from code and use environment variables",
        confidence: 0.95,
        tags: ["digitalocean", "token", "cloud"]
      },

      // Heroku API Keys
      {
        id: "HEROKU_API_KEY",
        name: "Heroku API Key",
        description: "Heroku API Key detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        category: "secrets",
        remediation: "Remove Heroku API keys from code and use environment variables",
        confidence: 0.7,
        tags: ["heroku", "api-key", "cloud"]
      },

      // Stripe API Keys
      {
        id: "STRIPE_API_KEY",
        name: "Stripe API Key",
        description: "Stripe API Key detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}/gi,
        category: "secrets",
        remediation: "Remove Stripe keys from code and use environment variables",
        confidence: 0.95,
        tags: ["stripe", "payment", "api-key"]
      },

      // PayPal Client Secrets
      {
        id: "PAYPAL_CLIENT_SECRET",
        name: "PayPal Client Secret",
        description: "PayPal Client Secret detected",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[A-Za-z0-9_-]{80}/g,
        category: "secrets",
        remediation: "Remove PayPal secrets from code and use secure configuration",
        confidence: 0.5,
        tags: ["paypal", "payment", "client-secret"]
      },

      // Twilio API Keys
      {
        id: "TWILIO_API_KEY",
        name: "Twilio API Key",
        description: "Twilio API Key or Auth Token detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /SK[a-f0-9]{32}|AC[a-f0-9]{32}/gi,
        category: "secrets",
        remediation: "Remove Twilio credentials from code and use environment variables",
        confidence: 0.9,
        tags: ["twilio", "api-key", "communications"]
      },

      // SendGrid API Keys
      {
        id: "SENDGRID_API_KEY",
        name: "SendGrid API Key",
        description: "SendGrid API Key detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/gi,
        category: "secrets",
        remediation: "Remove SendGrid keys from code and use environment variables",
        confidence: 0.95,
        tags: ["sendgrid", "email", "api-key"]
      },

      // Mailgun API Keys
      {
        id: "MAILGUN_API_KEY",
        name: "Mailgun API Key",
        description: "Mailgun API Key detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /key-[a-f0-9]{32}/gi,
        category: "secrets",
        remediation: "Remove Mailgun keys from code and use environment variables",
        confidence: 0.9,
        tags: ["mailgun", "email", "api-key"]
      },

      // Additional Database Connection Strings

      // MongoDB Atlas connection strings
      {
        id: "MONGODB_ATLAS_URI",
        name: "MongoDB Atlas Connection String",
        description: "MongoDB Atlas connection string with credentials",
        severity: "critical",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /mongodb\+srv:\/\/[^:]+:[^@]+@[^\/]+\.mongodb\.net/gi,
        category: "secrets",
        remediation: "Remove credentials from MongoDB connection strings",
        confidence: 0.95,
        tags: ["mongodb", "atlas", "database", "connection-string"]
      },

      // Redis connection strings with auth
      {
        id: "REDIS_AUTH_STRING",
        name: "Redis Connection String with Auth",
        description: "Redis connection string with authentication",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /redis:\/\/(:[^@]+@)?[^\/]+/gi,
        category: "secrets",
        remediation: "Remove Redis auth from connection strings",
        confidence: 0.8,
        tags: ["redis", "database", "auth", "connection-string"]
      },

      // Elasticsearch credentials
      {
        id: "ELASTICSEARCH_CREDENTIALS",
        name: "Elasticsearch Credentials",
        description: "Elasticsearch connection with embedded credentials",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(https?:\/\/[^:]+:[^@]+@[^\/]+\/(es|elasticsearch))/gi,
        category: "secrets",
        remediation: "Remove Elasticsearch credentials from URLs",
        confidence: 0.9,
        tags: ["elasticsearch", "database", "credentials"]
      },

      // Cassandra/ScyllaDB credentials
      {
        id: "CASSANDRA_CREDENTIALS",
        name: "Cassandra/ScyllaDB Credentials",
        description: "Cassandra or ScyllaDB credentials detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(cassandra|scylla):\/\/[^:]+:[^@]+@/gi,
        category: "secrets",
        remediation: "Remove database credentials from connection strings",
        confidence: 0.9,
        tags: ["cassandra", "scylla", "database", "credentials"]
      },

      // Additional API Keys and Tokens

      // OpenAI API Keys
      {
        id: "OPENAI_API_KEY",
        name: "OpenAI API Key",
        description: "OpenAI API Key detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /sk-[a-zA-Z0-9]{48}/gi,
        category: "secrets",
        remediation: "Remove OpenAI API keys from code and use environment variables",
        confidence: 0.95,
        tags: ["openai", "ai", "api-key"]
      },

      // Anthropic API Keys
      {
        id: "ANTHROPIC_API_KEY",
        name: "Anthropic API Key",
        description: "Anthropic API Key detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /sk-ant-[a-zA-Z0-9_-]{95}/gi,
        category: "secrets",
        remediation: "Remove Anthropic API keys from code and use environment variables",
        confidence: 0.95,
        tags: ["anthropic", "ai", "api-key"]
      },

      // Firebase/Google Cloud API Keys
      {
        id: "FIREBASE_API_KEY",
        name: "Firebase API Key",
        description: "Firebase/Google Cloud API Key detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /AIza[0-9A-Za-z_-]{35}/gi,
        category: "secrets",
        remediation: "Restrict Firebase API key usage and use environment variables",
        confidence: 0.8,
        tags: ["firebase", "google-cloud", "api-key"]
      },

      // Algolia API Keys
      {
        id: "ALGOLIA_API_KEY",
        name: "Algolia API Key",
        description: "Algolia API Key detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[a-f0-9]{32}/gi,
        category: "secrets",
        remediation: "Remove Algolia API keys from code and use environment variables",
        confidence: 0.4, // Lower confidence due to potential false positives
        tags: ["algolia", "search", "api-key"]
      },

      // Datadog API Keys
      {
        id: "DATADOG_API_KEY",
        name: "Datadog API Key",
        description: "Datadog API Key detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[a-f0-9]{32}/gi,
        category: "secrets",
        remediation: "Remove Datadog API keys from code and use environment variables",
        confidence: 0.4,
        tags: ["datadog", "monitoring", "api-key"]
      },

      // New Relic API Keys
      {
        id: "NEWRELIC_API_KEY",
        name: "New Relic API Key",
        description: "New Relic API Key detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /NRAK-[A-Z0-9]{27}/gi,
        category: "secrets",
        remediation: "Remove New Relic keys from code and use environment variables",
        confidence: 0.95,
        tags: ["newrelic", "monitoring", "api-key"]
      },

      // Honeybadger API Keys
      {
        id: "HONEYBADGER_API_KEY",
        name: "Honeybadger API Key",
        description: "Honeybadger API Key detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /hbp_[a-f0-9]{32}/gi,
        category: "secrets",
        remediation: "Remove Honeybadger keys from code and use environment variables",
        confidence: 0.9,
        tags: ["honeybadger", "monitoring", "api-key"]
      },

      // Telegram Bot Tokens
      {
        id: "TELEGRAM_BOT_TOKEN",
        name: "Telegram Bot Token",
        description: "Telegram Bot Token detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/gi,
        category: "secrets",
        remediation: "Remove Telegram bot tokens from code and use environment variables",
        confidence: 0.9,
        tags: ["telegram", "bot", "token"]
      },

      // Generic Bearer Tokens
      {
        id: "BEARER_TOKEN",
        name: "Bearer Token",
        description: "Generic Bearer token detected",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /Bearer\s+[A-Za-z0-9_.-]{20,}/gi,
        category: "secrets",
        remediation: "Remove bearer tokens from code and use secure token management",
        confidence: 0.6,
        tags: ["bearer", "token", "auth"]
      },

      // OAuth Client Secrets
      {
        id: "OAUTH_CLIENT_SECRET",
        name: "OAuth Client Secret",
        description: "OAuth client secret detected",
        severity: "high",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /(client_secret|clientSecret)\s*[:=]\s*['"][^'"]{20,}['"]/gi,
        category: "secrets",
        remediation: "Remove OAuth secrets from code and use secure configuration",
        confidence: 0.8,
        tags: ["oauth", "client-secret", "auth"]
      },

      // Webhook URLs with tokens
      {
        id: "WEBHOOK_URL_WITH_TOKEN",
        name: "Webhook URL with Token",
        description: "Webhook URL containing authentication tokens",
        severity: "medium",
        cwe: "CWE-798",
        owasp: "A05:2021-Security Misconfiguration",
        pattern: /https?:\/\/[^\/\s]+\/[^?\s]*\?[^=\s]*token[^=\s]*=[^&\s]+/gi,
        category: "secrets",
        remediation: "Remove tokens from webhook URLs and use header-based authentication",
        confidence: 0.7,
        tags: ["webhook", "token", "url"]
      }
    ];

    // Build pattern map for efficient lookup
    this.rules.forEach(rule => {
      this.patterns.set(rule.id, rule.pattern);
    });
  }

  private scanForSecrets(content: string, filePath: string): SecretMatch[] {
    const secrets: SecretMatch[] = [];
    const lines = content.split('\n');

    for (const rule of this.rules) {
      const matches = Array.from(content.matchAll(rule.pattern));

      for (const match of matches) {
        if (!match.index) continue;

        const lineNumber = this.getLineNumber(lines, match.index);
        const line = lines[lineNumber - 1] || '';
        const column = match.index - content.lastIndexOf('\n', match.index) - 1;

        // Calculate entropy for better confidence scoring
        const entropy = this.calculateEntropy(match[0]);
        const verified = this.verifySecret(rule.id, match[0]);

        const secret: SecretMatch = {
          type: rule.id,
          value: match[0],
          filePath,
          lineNumber,
          column: Math.max(0, column),
          entropy,
          verified
        };

        // Skip if it looks like a placeholder or example
        if (this.isPlaceholder(match[0], line)) {
          continue;
        }

        secrets.push(secret);
      }
    }

    return secrets;
  }

  private convertSecretsToIssues(secrets: SecretMatch[], entity: any): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const secret of secrets) {
      const rule = this.rules.find(r => r.id === secret.type);
      if (!rule) continue;

      // Adjust confidence based on entropy and verification
      let confidence = rule.confidence || 0.8;
      if (secret.entropy && secret.entropy > 4.0) {
        confidence = Math.min(1.0, confidence + 0.1);
      }
      if (secret.verified) {
        confidence = Math.min(1.0, confidence + 0.2);
      }

      const fpInput = `${entity.id}|${rule.id}|${secret.lineNumber}|${secret.column}`;
      const uniqueId = `sec_${createHash("sha1").update(fpInput).digest("hex")}`;

      const issue: SecurityIssue = {
        id: uniqueId,
        type: "securityIssue",
        tool: "SecretsScanner",
        ruleId: rule.id,
        severity: rule.severity,
        title: rule.name,
        description: `${rule.description} at line ${secret.lineNumber}`,
        cwe: rule.cwe,
        owasp: rule.owasp,
        affectedEntityId: entity.id,
        lineNumber: secret.lineNumber,
        codeSnippet: this.getCodeSnippet(secret.filePath, secret.lineNumber),
        remediation: rule.remediation,
        status: "open",
        discoveredAt: new Date(),
        lastScanned: new Date(),
        confidence,
        metadata: {
          secretType: secret.type,
          entropy: secret.entropy,
          verified: secret.verified,
          redactedValue: this.redactSecret(secret.value)
        }
      };

      issues.push(issue);
    }

    return issues;
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

  private getCodeSnippet(filePath: string, lineNumber: number, context: number = 2): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const start = Math.max(0, lineNumber - context - 1);
      const end = Math.min(lines.length, lineNumber + context);
      return lines.slice(start, end).join('\n');
    } catch (error) {
      return `Error reading file: ${error}`;
    }
  }

  private calculateEntropy(text: string): number {
    const frequency: { [key: string]: number } = {};

    for (const char of text) {
      frequency[char] = (frequency[char] || 0) + 1;
    }

    let entropy = 0;
    const length = text.length;

    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  private verifySecret(type: string, value: string): boolean {
    // Basic verification for certain secret types
    switch (type) {
      case "AWS_ACCESS_KEY":
        return /^AKIA[0-9A-Z]{16}$/.test(value);
      case "GITHUB_TOKEN":
        return /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59})$/.test(value);
      case "GOOGLE_API_KEY":
        return /^AIza[0-9A-Za-z\-_]{35}$/.test(value);
      case "JWT_TOKEN":
        const parts = value.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
      default:
        return false;
    }
  }

  private isPlaceholder(value: string, line: string): boolean {
    const placeholderPatterns = [
      /xxx+/i,
      /placeholder/i,
      /example/i,
      /dummy/i,
      /fake/i,
      /test/i,
      /sample/i,
      /your.*(key|token|secret)/i,
      /replace.*(this|me)/i,
      /\*{3,}/,
      /_{3,}/,
      /-{3,}/
    ];

    // Check if the value itself looks like a placeholder
    if (placeholderPatterns.some(pattern => pattern.test(value))) {
      return true;
    }

    // Check if the line contains placeholder-like context
    const contextPatterns = [
      /\/\/.*(example|placeholder|todo|fixme)/i,
      /\*.*(example|placeholder|todo|fixme)/i,
      /#.*(example|placeholder|todo|fixme)/i
    ];

    return contextPatterns.some(pattern => pattern.test(line));
  }

  private redactSecret(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }

    const prefix = value.substring(0, 3);
    const suffix = value.substring(value.length - 3);
    const middle = '*'.repeat(Math.max(0, value.length - 6));

    return `${prefix}${middle}${suffix}`;
  }

  private shouldSkipFile(filePath: string): boolean {
    const skipPatterns = [
      /node_modules/,
      /\.git/,
      /\.lock$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
      /pnpm-lock\.yaml$/,
      /\.(jpg|jpeg|png|gif|bmp|ico|svg)$/i,
      /\.(mp3|mp4|avi|mov|wmv)$/i,
      /\.(zip|tar|gz|rar|7z)$/i,
      /\.(pdf|doc|docx|xls|xlsx)$/i,
      /dist\//,
      /build\//,
      /coverage\//,
      /\.nyc_output\//
    ];

    return skipPatterns.some(pattern => pattern.test(filePath));
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
      if (stats.size > 5 * 1024 * 1024) { // Skip files larger than 5MB
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