---

## Metadata

- Scope: root
- Status: Draft
- Last Updated: 2025-09-27

## Working TODO

- [ ] Add/update Scope metadata (Scope: root).
- [ ] Confirm Desired Capabilities with acceptance tests.
- [ ] Link to code touchpoints (packages/, api routes).
- [ ] Add migration/backfill plan if needed.

## Desired Capabilities

- [ ] Define required capabilities and acceptance criteria.
- [ ] Note API/Graph impacts.

title: Rollback Capabilities Operator Guide
category: blueprint
created: 2025-09-23
updated: 2025-09-23
status: draft
authors:
  - unknown
---

# Rollback Capabilities Operator Guide

## Overview

The Memento Rollback Capabilities system provides comprehensive backup, restoration, and conflict resolution for knowledge graph operations. This guide covers deployment, monitoring, maintenance, and troubleshooting procedures for production environments.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Rollback Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  RollbackManager│    │ EnhancedStrategies│   │  Monitoring │ │
│  │                 │    │                 │    │  Dashboard  │ │
│  │  • Orchestration│    │ • PartialRollback│   │             │ │
│  │  • Snapshots    │    │ • TimebasedRolbck│   │ • Metrics   │ │
│  │  • Diff Engine  │    │ • DryRunStrategy │    │ • Alerts    │ │
│  │  • Conflict Res │    │ • ConflictResolve│   │ • Health    │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                       │                      │     │
│           └───────────────────────┼──────────────────────┘     │
│                                   │                            │
│  ┌─────────────────────────────────┼────────────────────────┐   │
│  │              Storage Layer                               │   │
│  │                                 │                        │   │
│  │  ┌─────────────┐  ┌─────────────▼──────┐  ┌─────────────┐ │ │
│  │  │   Memory    │  │   PostgreSQL       │  │   Hybrid    │ │ │
│  │  │   Cache     │  │   Persistence      │  │   Storage   │ │ │
│  │  │             │  │                    │  │             │ │ │
│  │  │ • Fast      │  │ • Durable         │  │ • Best of   │ │ │
│  │  │ • Temporary │  │ • Scalable        │  │   Both      │ │ │
│  │  │ • LRU       │  │ • ACID            │  │ • Auto Tier │ │ │
│  │  └─────────────┘  └────────────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                   │                              │
│  ┌─────────────────────────────────┼────────────────────────────┐ │
│  │              Integration Layer                               │ │
│  │                                 │                            │ │
│  │  ┌─────────────┐  ┌─────────────▼──────┐  ┌─────────────┐   │ │
│  │  │ Knowledge   │  │   Session         │  │   External  │   │ │
│  │  │ Graph       │  │   Manager         │  │   Services  │   │ │
│  │  │ Service     │  │                    │  │             │   │ │
│  │  └─────────────┘  └────────────────────┘  └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (for persistence)
- Redis 6+ (for session management)
- Minimum 2GB RAM
- 10GB disk space (for snapshots and logs)

### Installation

1. **Database Setup**
   ```bash
   # Run migration scripts
   psql -h localhost -U postgres -d memento -f scripts/migrations/001_rollback_schema.sql
   ```

2. **Environment Configuration**
   ```bash
   # .env configuration
   ROLLBACK_ENABLE_PERSISTENCE=true
   ROLLBACK_MAX_POINTS=10000
   ROLLBACK_DEFAULT_TTL=86400000
   ROLLBACK_CLEANUP_INTERVAL=300000
   ROLLBACK_MEMORY_LIMIT=536870912

   # PostgreSQL settings
   POSTGRESQL_HOST=localhost
   POSTGRESQL_PORT=5432
   POSTGRESQL_DATABASE=memento
   POSTGRESQL_USER=rollback_user
   POSTGRESQL_PASSWORD=secure_password
   POSTGRESQL_POOL_SIZE=20
   ```

3. **Service Initialization**
   ```typescript
   import { RollbackManager } from '@memento/core/rollback';
   import { PostgreSQLRollbackStore } from '@memento/core/rollback/PostgreSQLRollbackStore';

   const config = {
     maxRollbackPoints: parseInt(process.env.ROLLBACK_MAX_POINTS || '10000'),
     defaultTTL: parseInt(process.env.ROLLBACK_DEFAULT_TTL || '86400000'),
     enablePersistence: process.env.ROLLBACK_ENABLE_PERSISTENCE === 'true',
     autoCleanup: true
   };

   const rollbackManager = new RollbackManager(config, {
     connectionString: process.env.DATABASE_URL,
     schema: 'memento_rollback'
   });
   ```

## Configuration

### Core Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `maxRollbackPoints` | 1000 | Maximum number of rollback points to store |
| `defaultTTL` | 86400000 | Default time-to-live for rollback points (ms) |
| `enablePersistence` | true | Enable PostgreSQL persistence |
| `enableCompression` | false | Enable snapshot compression |
| `autoCleanup` | true | Enable automatic cleanup of expired data |
| `cleanupInterval` | 300000 | Cleanup interval in milliseconds |

### Performance Tuning

```typescript
// High-throughput configuration
const highThroughputConfig = {
  maxRollbackPoints: 50000,
  enablePersistence: true,
  enableCompression: true,
  storeOptions: {
    maxItems: 1000,  // Memory cache size
    enableLRU: true,
    defaultTTL: 3600000  // 1 hour
  },
  pgConfig: {
    pool: {
      max: 50,  // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  }
};
```

### Memory-Optimized Configuration

```typescript
// Memory-constrained environment
const memoryOptimizedConfig = {
  maxRollbackPoints: 5000,
  enablePersistence: true,
  enableCompression: true,
  storeOptions: {
    maxItems: 100,  // Smaller cache
    enableLRU: true,
    defaultTTL: 1800000  // 30 minutes
  }
};
```

## Monitoring and Alerting

### Dashboard Setup

```typescript
import { RollbackMonitoringDashboard } from '@memento/core/rollback/monitoring';

const dashboard = new RollbackMonitoringDashboard(rollbackManager, {
  metricsInterval: 30000,  // 30 seconds
  alertThresholds: {
    maxFailureRate: 5,      // 5%
    maxAverageTime: 10000,  // 10 seconds
    maxMemoryUsage: 1024 * 1024 * 1024,  // 1GB
    maxPendingOperations: 100
  },
  enableAlerting: true
});

dashboard.start();
```

### Key Metrics to Monitor

1. **Performance Metrics**
   - Average rollback operation time
   - Success/failure rate
   - Memory usage trends
   - Database query performance

2. **Capacity Metrics**
   - Number of active rollback points
   - Storage usage (disk and memory)
   - Pending operations queue depth
   - Database connection pool utilization

3. **Health Metrics**
   - Service uptime
   - Error rates and patterns
   - Resource utilization
   - Alert resolution times

### Prometheus Integration

```typescript
// Export metrics for Prometheus
app.get('/metrics', (req, res) => {
  const metrics = dashboard.exportMetrics('prometheus');
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

## Operational Procedures

### Daily Operations

1. **Health Checks**
   ```bash
   # Check service health
   curl http://localhost:3000/health/rollback

   # Check database connectivity
   psql -h localhost -U rollback_user -d memento -c "SELECT get_rollback_statistics();"
   ```

2. **Metrics Review**
   ```bash
   # Get dashboard summary
   curl http://localhost:3000/api/rollback/dashboard/summary

   # Check for active alerts
   curl http://localhost:3000/api/rollback/alerts?resolved=false
   ```

### Weekly Maintenance

1. **Database Maintenance**
   ```sql
   -- Cleanup old operations (older than 7 days)
   SELECT cleanup_old_operations(168);

   -- Get storage statistics
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables
   WHERE schemaname = 'memento_rollback'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

2. **Performance Analysis**
   ```bash
   # Generate performance report
   node scripts/generate-rollback-report.js --period=7d
   ```

### Monthly Operations

1. **Capacity Planning Review**
   - Analyze growth trends
   - Project storage requirements
   - Review performance benchmarks

2. **Configuration Optimization**
   - Tune memory cache sizes
   - Adjust cleanup intervals
   - Update alert thresholds

## Troubleshooting

### Common Issues

#### High Memory Usage

**Symptoms:**
- Memory usage alerts
- Slow rollback operations
- OOM errors

**Diagnosis:**
```bash
# Check memory metrics
curl http://localhost:3000/api/rollback/metrics | jq '.memoryUsage'

# Check cache statistics
curl http://localhost:3000/api/rollback/dashboard/summary | jq '.currentMemoryUsage'
```

**Solutions:**
1. Reduce cache size: `storeOptions.maxItems`
2. Enable compression: `enableCompression: true`
3. Reduce TTL: `defaultTTL`
4. Increase cleanup frequency

#### Slow Rollback Operations

**Symptoms:**
- High average operation times
- Timeout errors
- Performance alerts

**Diagnosis:**
```sql
-- Check operation performance
SELECT
  type,
  status,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) as avg_duration_ms,
  COUNT(*) as operation_count
FROM memento_rollback.rollback_operations
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY type, status;
```

**Solutions:**
1. Check database performance
2. Optimize snapshot sizes
3. Use partial rollback strategies
4. Scale database resources

#### Database Connection Issues

**Symptoms:**
- Connection timeout errors
- Failed rollback operations
- Database connectivity alerts

**Diagnosis:**
```bash
# Check database connectivity
pg_isready -h localhost -p 5432

# Check connection pool
curl http://localhost:3000/api/rollback/dashboard/summary | jq '.healthStatus'
```

**Solutions:**
1. Increase connection pool size
2. Check database server health
3. Review connection timeout settings
4. Monitor connection leaks

### Performance Tuning

#### Optimization Checklist

1. **Database Optimization**
   - [ ] Appropriate indexes created
   - [ ] Connection pool sized correctly
   - [ ] Query performance acceptable
   - [ ] Regular maintenance scheduled

2. **Memory Management**
   - [ ] Cache size optimized
   - [ ] Compression enabled if needed
   - [ ] TTL values appropriate
   - [ ] Cleanup working effectively

3. **Application Performance**
   - [ ] Monitoring in place
   - [ ] Alerts configured
   - [ ] Performance baselines established
   - [ ] Regular performance reviews

## Disaster Recovery

### Backup Procedures

1. **Database Backups**
   ```bash
   # Full database backup
   pg_dump -h localhost -U postgres -d memento \
     --schema=memento_rollback \
     --file=rollback_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Configuration Backups**
   ```bash
   # Backup configuration
   tar -czf rollback_config_$(date +%Y%m%d).tar.gz \
     config/ scripts/ .env
   ```

### Recovery Procedures

1. **Database Recovery**
   ```bash
   # Restore from backup
   psql -h localhost -U postgres -d memento -f rollback_backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Service Recovery**
   ```bash
   # Restart service with clean state
   systemctl stop memento-rollback
   systemctl start memento-rollback

   # Verify recovery
   curl http://localhost:3000/health/rollback
   ```

### Data Validation

```sql
-- Validate data integrity
SELECT
  'rollback_points' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM memento_rollback.rollback_points

UNION ALL

SELECT
  'rollback_operations',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM memento_rollback.rollback_operations;
```

## Security Considerations

### Access Control

1. **Database Access**
   - Use dedicated rollback database user
   - Limit permissions to required schemas
   - Enable connection encryption
   - Regular password rotation

2. **API Security**
   - Authentication required for rollback operations
   - Rate limiting for rollback endpoints
   - Audit logging for all operations
   - Input validation and sanitization

### Data Protection

1. **Encryption**
   - Database connections encrypted (SSL/TLS)
   - Sensitive data encrypted at rest
   - Snapshot data protection

2. **Audit Logging**
   ```sql
   -- View audit logs
   SELECT
     event_type,
     user_id,
     session_id,
     event_data,
     created_at
   FROM memento_rollback.rollback_audit_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

## Scaling Considerations

### Horizontal Scaling

1. **Read Replicas**
   - Setup PostgreSQL read replicas
   - Route read-only queries to replicas
   - Monitor replication lag

2. **Load Balancing**
   - Multiple rollback service instances
   - Session affinity for operations
   - Health check endpoints

### Vertical Scaling

1. **Resource Requirements**
   - CPU: 2+ cores per 1000 operations/hour
   - Memory: 4GB base + 1GB per 10K rollback points
   - Storage: 10GB base + growth projections
   - Network: 1Gbps for high-throughput scenarios

## Support and Maintenance

### Log Locations

- Application logs: `/var/log/memento/rollback.log`
- Database logs: PostgreSQL logs directory
- System logs: `/var/log/syslog`

### Contact Information

- On-call rotation: [oncall-schedule-url]
- Escalation procedures: [escalation-doc-url]
- Documentation: [docs-url]

### Regular Maintenance Schedule

| Task | Frequency | Automation |
|------|-----------|------------|
| Health checks | Continuous | Automated |
| Performance review | Daily | Manual |
| Database cleanup | Weekly | Automated |
| Backup verification | Weekly | Semi-automated |
| Configuration review | Monthly | Manual |
| Disaster recovery test | Quarterly | Manual |

---

*This operator guide should be reviewed and updated quarterly or after major system changes.*