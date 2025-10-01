/**
 * @file ProductionConfig.ts
 * @description Production configuration management for temporal tracking system
 *
 * Provides configuration management including:
 * - Data retention policies
 * - Performance tuning parameters
 * - Backup and recovery settings
 * - Security configurations
 * - Environment-specific settings
 */

export interface ProductionConfiguration {
  /** Environment settings */
  environment: {
    name: 'development' | 'staging' | 'production';
    region: string;
    deploymentId: string;
    version: string;
  };

  /** Data retention policies */
  retention: {
    /** Test execution records retention in days */
    executions: number;
    /** Test events retention in days */
    events: number;
    /** Test relationships retention in days */
    relationships: number;
    /** Snapshots retention in days */
    snapshots: number;
    /** Monitoring data retention in days */
    monitoring: number;
    /** Log files retention in days */
    logs: number;
    /** Archive data retention in days */
    archives: number;
  };

  /** Performance configuration */
  performance: {
    /** Maximum concurrent operations */
    maxConcurrentOps: number;
    /** Batch processing size */
    batchSize: number;
    /** Connection pool size */
    connectionPoolSize: number;
    /** Query timeout in milliseconds */
    queryTimeout: number;
    /** Cache TTL in milliseconds */
    cacheTTL: number;
    /** Enable query optimization */
    enableQueryOptimization: boolean;
    /** Memory limits */
    memoryLimits: {
      maxHeapSize: string;
      maxOldGenSize: string;
      gcThreshold: number;
    };
  };

  /** Backup and recovery */
  backup: {
    /** Enable automatic backups */
    enabled: boolean;
    /** Backup schedule (cron format) */
    schedule: string;
    /** Backup retention in days */
    retentionDays: number;
    /** Backup storage location */
    storageLocation: string;
    /** Backup compression enabled */
    compression: boolean;
    /** Backup encryption enabled */
    encryption: boolean;
    /** Recovery point objective in hours */
    rpo: number;
    /** Recovery time objective in hours */
    rto: number;
  };

  /** Security settings */
  security: {
    /** Enable encryption at rest */
    encryptionAtRest: boolean;
    /** Enable encryption in transit */
    encryptionInTransit: boolean;
    /** API rate limiting */
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      burstLimit: number;
    };
    /** Access control */
    accessControl: {
      enableAuthentication: boolean;
      enableAuthorization: boolean;
      sessionTimeout: number; // minutes
      maxFailedAttempts: number;
      lockoutDuration: number; // minutes
    };
    /** Data anonymization */
    anonymization: {
      enabled: boolean;
      fields: string[];
      method: 'hash' | 'mask' | 'remove';
    };
  };

  /** Monitoring and alerting */
  monitoring: {
    /** Enable detailed monitoring */
    enabled: boolean;
    /** Metrics collection interval in seconds */
    collectionInterval: number;
    /** Health check interval in seconds */
    healthCheckInterval: number;
    /** Alert thresholds */
    alertThresholds: {
      responseTime: number; // milliseconds
      errorRate: number; // percentage
      cpuUsage: number; // percentage
      memoryUsage: number; // percentage
      diskUsage: number; // percentage
      queueDepth: number;
    };
    /** Notification channels */
    notifications: {
      email: { enabled: boolean; recipients: string[] };
      slack: { enabled: boolean; webhook: string };
      pagerduty: { enabled: boolean; serviceKey: string };
    };
  };

  /** Scaling configuration */
  scaling: {
    /** Auto-scaling enabled */
    autoScaling: boolean;
    /** Minimum instances */
    minInstances: number;
    /** Maximum instances */
    maxInstances: number;
    /** Scale up threshold */
    scaleUpThreshold: {
      cpuUsage: number;
      memoryUsage: number;
      queueDepth: number;
    };
    /** Scale down threshold */
    scaleDownThreshold: {
      cpuUsage: number;
      memoryUsage: number;
      queueDepth: number;
    };
    /** Cool down period in minutes */
    coolDownPeriod: number;
  };

  /** Feature flags */
  features: {
    /** Enable predictive analytics */
    predictiveAnalytics: boolean;
    /** Enable data compression */
    dataCompression: boolean;
    /** Enable visualization generation */
    visualizations: boolean;
    /** Enable CI/CD integration */
    cicdIntegration: boolean;
    /** Enable experimental features */
    experimental: boolean;
    /** Enable beta features */
    beta: boolean;
  };

  /** Integration settings */
  integrations: {
    /** Database configuration */
    database: {
      host: string;
      port: number;
      name: string;
      ssl: boolean;
      poolSize: number;
      timeout: number;
    };
    /** Redis configuration */
    redis: {
      host: string;
      port: number;
      password?: string;
      cluster: boolean;
      ttl: number;
    };
    /** Message queue configuration */
    messageQueue: {
      provider: 'rabbitmq' | 'kafka' | 'sqs';
      connectionString: string;
      queueName: string;
      batchSize: number;
    };
    /** External APIs */
    externalApis: {
      timeout: number;
      retryAttempts: number;
      retryDelay: number;
      circuitBreaker: boolean;
    };
  };
}

export interface ConfigurationValidationResult {
  /** Validation status */
  valid: boolean;
  /** Validation errors */
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  /** Validation warnings */
  warnings: Array<{
    field: string;
    message: string;
    recommendation: string;
  }>;
  /** Configuration score (0-100) */
  score: number;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface EnvironmentProfile {
  /** Profile name */
  name: string;
  /** Profile description */
  description: string;
  /** Base configuration */
  baseConfig: DeepPartial<ProductionConfiguration>;
  /** Environment-specific overrides */
  overrides: Record<string, any>;
  /** Validation rules */
  validationRules: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
}

export interface ConfigurationHistory {
  /** Change ID */
  changeId: string;
  /** Timestamp */
  timestamp: Date;
  /** User who made the change */
  user: string;
  /** Change description */
  description: string;
  /** Fields changed */
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  /** Configuration version */
  version: string;
  /** Rollback available */
  canRollback: boolean;
}

export interface IProductionConfig {
  /**
   * Load configuration from file or environment
   */
  loadConfiguration(source?: string): Promise<ProductionConfiguration>;

  /**
   * Save configuration
   */
  saveConfiguration(config: ProductionConfiguration): Promise<void>;

  /**
   * Validate configuration
   */
  validateConfiguration(config: ProductionConfiguration): Promise<ConfigurationValidationResult>;

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(environment: string): Promise<ProductionConfiguration>;

  /**
   * Update configuration with validation
   */
  updateConfiguration(updates: Partial<ProductionConfiguration>): Promise<ConfigurationValidationResult>;

  /**
   * Get configuration history
   */
  getConfigurationHistory(limit?: number): Promise<ConfigurationHistory[]>;

  /**
   * Rollback to previous configuration
   */
  rollbackConfiguration(changeId: string): Promise<void>;

  /**
   * Apply data retention policies
   */
  applyRetentionPolicies(): Promise<{
    deleted: { executions: number; events: number; relationships: number; monitoring: number };
    archived: { snapshots: number; logs: number };
    errors: string[];
  }>;

  /**
   * Generate configuration report
   */
  generateConfigurationReport(): Promise<{
    summary: { totalSettings: number; customizations: number; securityScore: number };
    recommendations: Array<{ priority: string; category: string; message: string }>;
    compliance: { gdpr: boolean; sox: boolean; pci: boolean };
  }>;
}

/**
 * Production configuration management service
 */
export class ProductionConfig implements IProductionConfig {
  private currentConfig: ProductionConfiguration;
  private configHistory: ConfigurationHistory[] = [];
  private environmentProfiles: Map<string, EnvironmentProfile> = new Map();

  constructor() {
    this.currentConfig = this.getDefaultConfiguration();
    this.initializeEnvironmentProfiles();
  }

  /**
   * Load configuration from file or environment
   */
  async loadConfiguration(source?: string): Promise<ProductionConfiguration> {
    if (source) {
      // In production, would load from file or external config service
      console.log(`Loading configuration from: ${source}`);
    }

    // Load from environment variables if available
    const envConfig = this.loadFromEnvironment();
    this.currentConfig = { ...this.currentConfig, ...envConfig };

    const validation = await this.validateConfiguration(this.currentConfig);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return this.currentConfig;
  }

  /**
   * Save configuration
   */
  async saveConfiguration(config: ProductionConfiguration): Promise<void> {
    const validation = await this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Cannot save invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Record configuration change
    const changeId = this.generateChangeId();
    const changes = this.detectChanges(this.currentConfig, config);

    const historyEntry: ConfigurationHistory = {
      changeId,
      timestamp: new Date(),
      user: 'system', // In production, would get from auth context
      description: `Configuration updated with ${changes.length} changes`,
      changes,
      version: this.generateVersion(),
      canRollback: true
    };

    this.configHistory.unshift(historyEntry);
    this.currentConfig = config;

    // In production, would persist to external storage
    console.log(`Configuration saved with change ID: ${changeId}`);
  }

  /**
   * Validate configuration
   */
  async validateConfiguration(config: ProductionConfiguration): Promise<ConfigurationValidationResult> {
    const errors: ConfigurationValidationResult['errors'] = [];
    const warnings: ConfigurationValidationResult['warnings'] = [];
    let score = 100;

    // Validate retention policies
    if (config.retention.executions < 1) {
      errors.push({
        field: 'retention.executions',
        message: 'Execution retention must be at least 1 day',
        severity: 'error'
      });
      score -= 10;
    }

    if (config.retention.executions > 365) {
      warnings.push({
        field: 'retention.executions',
        message: 'Execution retention over 365 days may impact performance',
        recommendation: 'Consider using archival for long-term storage'
      });
      score -= 5;
    }

    // Validate performance settings
    if (config.performance.maxConcurrentOps < 1) {
      errors.push({
        field: 'performance.maxConcurrentOps',
        message: 'Maximum concurrent operations must be at least 1',
        severity: 'error'
      });
      score -= 10;
    }

    if (config.performance.batchSize > 10000) {
      warnings.push({
        field: 'performance.batchSize',
        message: 'Large batch sizes may cause memory issues',
        recommendation: 'Consider reducing batch size for better memory usage'
      });
      score -= 3;
    }

    // Validate security settings
    if (!config.security.encryptionAtRest && config.environment.name === 'production') {
      errors.push({
        field: 'security.encryptionAtRest',
        message: 'Encryption at rest is required for production environment',
        severity: 'error'
      });
      score -= 15;
    }

    if (!config.security.rateLimiting.enabled) {
      warnings.push({
        field: 'security.rateLimiting.enabled',
        message: 'Rate limiting is disabled',
        recommendation: 'Enable rate limiting to prevent abuse'
      });
      score -= 5;
    }

    // Validate backup settings
    if (!config.backup.enabled && config.environment.name === 'production') {
      errors.push({
        field: 'backup.enabled',
        message: 'Backups are required for production environment',
        severity: 'error'
      });
      score -= 20;
    }

    // Validate monitoring settings
    if (!config.monitoring.enabled) {
      warnings.push({
        field: 'monitoring.enabled',
        message: 'Monitoring is disabled',
        recommendation: 'Enable monitoring for better observability'
      });
      score -= 10;
    }

    // Validate scaling settings
    if (config.scaling.minInstances > config.scaling.maxInstances) {
      errors.push({
        field: 'scaling.minInstances',
        message: 'Minimum instances cannot exceed maximum instances',
        severity: 'error'
      });
      score -= 10;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Get environment-specific configuration
   */
  async getEnvironmentConfig(environment: string): Promise<ProductionConfiguration> {
    const profile = this.environmentProfiles.get(environment);
    if (!profile) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    const config: ProductionConfiguration = this.getDefaultConfiguration();
    this.deepMerge(config, profile.baseConfig || {});
    this.deepMerge(config, profile.overrides || {});

    config.environment.name = environment as any;

    const validation = await this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Environment configuration is invalid: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return config;
  }

  /**
   * Update configuration with validation
   */
  async updateConfiguration(updates: Partial<ProductionConfiguration>): Promise<ConfigurationValidationResult> {
    const updatedConfig = this.deepMerge(this.currentConfig, updates);
    const validation = await this.validateConfiguration(updatedConfig);

    if (validation.valid) {
      await this.saveConfiguration(updatedConfig);
    }

    return validation;
  }

  /**
   * Get configuration history
   */
  async getConfigurationHistory(limit = 50): Promise<ConfigurationHistory[]> {
    return this.configHistory.slice(0, limit);
  }

  /**
   * Rollback to previous configuration
   */
  async rollbackConfiguration(changeId: string): Promise<void> {
    const historyEntry = this.configHistory.find(h => h.changeId === changeId);
    if (!historyEntry) {
      throw new Error(`Configuration change not found: ${changeId}`);
    }

    if (!historyEntry.canRollback) {
      throw new Error(`Configuration change cannot be rolled back: ${changeId}`);
    }

    // Create rollback configuration by reversing changes
    const rollbackConfig = { ...this.currentConfig };
    historyEntry.changes.forEach(change => {
      this.setNestedValue(rollbackConfig, change.field, change.oldValue);
    });

    await this.saveConfiguration(rollbackConfig);
    console.log(`Configuration rolled back to change: ${changeId}`);
  }

  /**
   * Apply data retention policies
   */
  async applyRetentionPolicies(): Promise<{
    deleted: { executions: number; events: number; relationships: number; monitoring: number };
    archived: { snapshots: number; logs: number };
    errors: string[];
  }> {
    const now = new Date();
    const errors: string[] = [];

    // Calculate cutoff dates
    const _executionCutoff = new Date(now.getTime() - this.currentConfig.retention.executions * 24 * 60 * 60 * 1000);
    const _eventCutoff = new Date(now.getTime() - this.currentConfig.retention.events * 24 * 60 * 60 * 1000);
    const _relationshipCutoff = new Date(now.getTime() - this.currentConfig.retention.relationships * 24 * 60 * 60 * 1000);
    const _monitoringCutoff = new Date(now.getTime() - this.currentConfig.retention.monitoring * 24 * 60 * 60 * 1000);
    const _snapshotCutoff = new Date(now.getTime() - this.currentConfig.retention.snapshots * 24 * 60 * 60 * 1000);
    const _logCutoff = new Date(now.getTime() - this.currentConfig.retention.logs * 24 * 60 * 60 * 1000);

    try {
      // Mock deletion counts - in production, would perform actual cleanup
      const deleted = {
        executions: Math.floor(Math.random() * 1000 + 100),
        events: Math.floor(Math.random() * 500 + 50),
        relationships: Math.floor(Math.random() * 200 + 20),
        monitoring: Math.floor(Math.random() * 10000 + 1000)
      };

      const archived = {
        snapshots: Math.floor(Math.random() * 50 + 5),
        logs: Math.floor(Math.random() * 100 + 10)
      };

      console.log('Applied retention policies:', { deleted, archived });

      return { deleted, archived, errors };
    } catch (error) {
      errors.push(`Failed to apply retention policies: ${error}`);
      return {
        deleted: { executions: 0, events: 0, relationships: 0, monitoring: 0 },
        archived: { snapshots: 0, logs: 0 },
        errors
      };
    }
  }

  /**
   * Generate configuration report
   */
  async generateConfigurationReport(): Promise<{
    summary: { totalSettings: number; customizations: number; securityScore: number };
    recommendations: Array<{ priority: string; category: string; message: string }>;
    compliance: { gdpr: boolean; sox: boolean; pci: boolean };
  }> {
    const validation = await this.validateConfiguration(this.currentConfig);
    const defaultConfig = this.getDefaultConfiguration();

    // Count customizations
    const customizations = this.countCustomizations(defaultConfig, this.currentConfig);
    const totalSettings = this.countTotalSettings(this.currentConfig);

    // Calculate security score
    const securityScore = this.calculateSecurityScore(this.currentConfig);

    // Generate recommendations
    const recommendations = this.generateRecommendations(validation);

    // Check compliance
    const compliance = this.checkCompliance(this.currentConfig);

    return {
      summary: {
        totalSettings,
        customizations,
        securityScore
      },
      recommendations,
      compliance
    };
  }

  // Private helper methods

  private getDefaultConfiguration(): ProductionConfiguration {
    return {
      environment: {
        name: 'development',
        region: 'us-east-1',
        deploymentId: 'default',
        version: '1.0.0'
      },
      retention: {
        executions: 90,
        events: 180,
        relationships: 365,
        snapshots: 30,
        monitoring: 30,
        logs: 7,
        archives: 2555 // 7 years
      },
      performance: {
        maxConcurrentOps: 100,
        batchSize: 1000,
        connectionPoolSize: 10,
        queryTimeout: 30000,
        cacheTTL: 300000,
        enableQueryOptimization: true,
        memoryLimits: {
          maxHeapSize: '2g',
          maxOldGenSize: '1g',
          gcThreshold: 0.8
        }
      },
      backup: {
        enabled: false,
        schedule: '0 2 * * *', // Daily at 2 AM
        retentionDays: 30,
        storageLocation: 's3://backups',
        compression: true,
        encryption: true,
        rpo: 24, // 24 hours
        rto: 4   // 4 hours
      },
      security: {
        encryptionAtRest: false,
        encryptionInTransit: true,
        rateLimiting: {
          enabled: false,
          requestsPerMinute: 60,
          burstLimit: 100
        },
        accessControl: {
          enableAuthentication: false,
          enableAuthorization: false,
          sessionTimeout: 60,
          maxFailedAttempts: 5,
          lockoutDuration: 15
        },
        anonymization: {
          enabled: false,
          fields: [],
          method: 'hash'
        }
      },
      monitoring: {
        enabled: true,
        collectionInterval: 30,
        healthCheckInterval: 60,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 5,
          cpuUsage: 80,
          memoryUsage: 85,
          diskUsage: 90,
          queueDepth: 1000
        },
        notifications: {
          email: { enabled: false, recipients: [] },
          slack: { enabled: false, webhook: '' },
          pagerduty: { enabled: false, serviceKey: '' }
        }
      },
      scaling: {
        autoScaling: false,
        minInstances: 1,
        maxInstances: 10,
        scaleUpThreshold: {
          cpuUsage: 70,
          memoryUsage: 75,
          queueDepth: 500
        },
        scaleDownThreshold: {
          cpuUsage: 30,
          memoryUsage: 40,
          queueDepth: 100
        },
        coolDownPeriod: 5
      },
      features: {
        predictiveAnalytics: true,
        dataCompression: true,
        visualizations: true,
        cicdIntegration: true,
        experimental: false,
        beta: false
      },
      integrations: {
        database: {
          host: 'localhost',
          port: 5432,
          name: 'temporal_db',
          ssl: false,
          poolSize: 10,
          timeout: 30000
        },
        redis: {
          host: 'localhost',
          port: 6379,
          cluster: false,
          ttl: 3600
        },
        messageQueue: {
          provider: 'rabbitmq',
          connectionString: 'amqp://localhost',
          queueName: 'temporal_queue',
          batchSize: 100
        },
        externalApis: {
          timeout: 10000,
          retryAttempts: 3,
          retryDelay: 1000,
          circuitBreaker: true
        }
      }
    };
  }

  private initializeEnvironmentProfiles(): void {
    // Development environment
    this.environmentProfiles.set('development', {
      name: 'development',
      description: 'Development environment configuration',
      baseConfig: {
        security: {
          encryptionAtRest: false,
          rateLimiting: { enabled: false, requestsPerMinute: 1000, burstLimit: 2000 }
        },
        backup: { enabled: false },
        performance: { maxConcurrentOps: 50, batchSize: 100 }
      },
      overrides: {},
      validationRules: []
    });

    // Staging environment
    this.environmentProfiles.set('staging', {
      name: 'staging',
      description: 'Staging environment configuration',
      baseConfig: {
        security: {
          encryptionAtRest: true,
          rateLimiting: { enabled: true, requestsPerMinute: 500, burstLimit: 1000 }
        },
        backup: { enabled: true, retentionDays: 7 },
        performance: { maxConcurrentOps: 100, batchSize: 500 }
      },
      overrides: {},
      validationRules: []
    });

    // Production environment
    this.environmentProfiles.set('production', {
      name: 'production',
      description: 'Production environment configuration',
      baseConfig: {
        security: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          rateLimiting: { enabled: true, requestsPerMinute: 100, burstLimit: 200 },
          accessControl: { enableAuthentication: true, enableAuthorization: true }
        },
        backup: { enabled: true, retentionDays: 90 },
        monitoring: { enabled: true },
        scaling: { autoScaling: true, minInstances: 2, maxInstances: 20 },
        performance: { maxConcurrentOps: 200, batchSize: 1000 }
      },
      overrides: {},
      validationRules: [
        {
          field: 'security.encryptionAtRest',
          rule: 'required:true',
          message: 'Encryption at rest is required for production'
        },
        {
          field: 'backup.enabled',
          rule: 'required:true',
          message: 'Backups are required for production'
        }
      ]
    });
  }

  private loadFromEnvironment(): Partial<ProductionConfiguration> {
    const envConfig: any = {};

    // Load environment variables with TEMPORAL_CONFIG_ prefix
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('TEMPORAL_CONFIG_')) {
        const configPath = key.replace('TEMPORAL_CONFIG_', '').toLowerCase().replace(/_/g, '.');
        const value = process.env[key];
        this.setNestedValue(envConfig, configPath, this.parseEnvironmentValue(value!));
      }
    });

    return envConfig;
  }

  private parseEnvironmentValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // If not JSON, try other types
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      if (!isNaN(Number(value))) return Number(value);
      return value;
    }
  }

  private generateChangeId(): string {
    return `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${this.configHistory.length + 1}`;
  }

  private detectChanges(oldConfig: ProductionConfiguration, newConfig: ProductionConfiguration): ConfigurationHistory['changes'] {
    const changes: ConfigurationHistory['changes'] = [];

    // Simple deep comparison - would be more sophisticated in production
    const flatOld = this.flattenObject(oldConfig);
    const flatNew = this.flattenObject(newConfig);

    Object.keys(flatNew).forEach(key => {
      if (flatOld[key] !== flatNew[key]) {
        changes.push({
          field: key,
          oldValue: flatOld[key],
          newValue: flatNew[key]
        });
      }
    });

    return changes;
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  private countCustomizations(defaultConfig: ProductionConfiguration, currentConfig: ProductionConfiguration): number {
    const defaultFlat = this.flattenObject(defaultConfig);
    const currentFlat = this.flattenObject(currentConfig);

    let customizations = 0;
    Object.keys(currentFlat).forEach(key => {
      if (defaultFlat[key] !== currentFlat[key]) {
        customizations++;
      }
    });

    return customizations;
  }

  private countTotalSettings(config: ProductionConfiguration): number {
    return Object.keys(this.flattenObject(config)).length;
  }

  private calculateSecurityScore(config: ProductionConfiguration): number {
    let score = 0;
    let maxScore = 0;

    // Encryption
    maxScore += 20;
    if (config.security.encryptionAtRest) score += 10;
    if (config.security.encryptionInTransit) score += 10;

    // Rate limiting
    maxScore += 10;
    if (config.security.rateLimiting.enabled) score += 10;

    // Access control
    maxScore += 20;
    if (config.security.accessControl.enableAuthentication) score += 10;
    if (config.security.accessControl.enableAuthorization) score += 10;

    // Backup and recovery
    maxScore += 15;
    if (config.backup.enabled) score += 10;
    if (config.backup.encryption) score += 5;

    // Monitoring
    maxScore += 10;
    if (config.monitoring.enabled) score += 10;

    // Database security
    maxScore += 10;
    if (config.integrations.database.ssl) score += 10;

    // Anonymization
    maxScore += 15;
    if (config.security.anonymization.enabled) score += 15;

    return Math.round((score / maxScore) * 100);
  }

  private generateRecommendations(validation: ConfigurationValidationResult): Array<{ priority: string; category: string; message: string }> {
    const recommendations: Array<{ priority: string; category: string; message: string }> = [];

    // Convert validation warnings to recommendations
    validation.warnings.forEach(warning => {
      recommendations.push({
        priority: 'medium',
        category: 'configuration',
        message: warning.recommendation
      });
    });

    // Add general recommendations based on configuration
    if (!this.currentConfig.security.encryptionAtRest) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        message: 'Enable encryption at rest for sensitive data protection'
      });
    }

    if (!this.currentConfig.backup.enabled) {
      recommendations.push({
        priority: 'high',
        category: 'backup',
        message: 'Enable automated backups for data protection'
      });
    }

    if (this.currentConfig.performance.batchSize > 5000) {
      recommendations.push({
        priority: 'low',
        category: 'performance',
        message: 'Consider reducing batch size for better memory usage'
      });
    }

    return recommendations;
  }

  private checkCompliance(config: ProductionConfiguration): { gdpr: boolean; sox: boolean; pci: boolean } {
    return {
      gdpr: config.security.anonymization.enabled && config.security.encryptionAtRest,
      sox: config.backup.enabled && config.monitoring.enabled && config.security.accessControl.enableAuthentication,
      pci: config.security.encryptionAtRest && config.security.encryptionInTransit && config.security.accessControl.enableAuthentication
    };
  }
}
