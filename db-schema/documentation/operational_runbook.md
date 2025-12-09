# Operational Runbook - KwizMe Database

**Last Updated**: December 9, 2025
**Environment**: PostgreSQL (Supabase) + SQLite (Browser)
**Version**: 8-table schema with rate limiting

---

## 📋 **OVERVIEW**

This runbook provides operational procedures for managing the KwizMe database system, including backup/restore, monitoring, troubleshooting, and migration procedures.

### **System Architecture**
- **Primary DB**: PostgreSQL via Supabase (authenticated users)
- **Secondary DB**: SQLite via sql.js (anonymous users, browser storage)
- **Tables**: 8 total (5 core + 3 rate limiting)
- **Users**: Multi-tenant with Row Level Security (RLS)

---

## 🔄 **MIGRATION PROCEDURES**

### **Schema Migration Process**

#### **1. Pre-Migration Checklist**
```bash
# 1. Create full backup
pg_dump -h your-supabase-host -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run schema verification
psql -h your-supabase-host -U postgres -d postgres -f supabase_verify_schema_results.sql

# 3. Document current state
psql -h your-supabase-host -U postgres -d postgres -c "\dt" > current_tables.txt
```

#### **2. Migration Execution**
```sql
-- Safe migration pattern
BEGIN;

-- 1. Create migration log
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status TEXT DEFAULT 'running',
    notes TEXT
);

INSERT INTO migration_log (migration_name, notes)
VALUES ('schema_update_20251209', 'Adding new features');

-- 2. Execute migration steps
-- [Your migration SQL here]

-- 3. Verify migration success
-- [Verification queries here]

-- 4. Mark migration complete
UPDATE migration_log
SET completed_at = NOW(), status = 'completed'
WHERE migration_name = 'schema_update_20251209';

COMMIT;
```

#### **3. Post-Migration Verification**
```sql
-- Run comprehensive verification
\i supabase_verify_schema_results.sql

-- Check data integrity
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM quizzes;
SELECT COUNT(*) FROM questions;

-- Verify RLS policies
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Test core functionality
SELECT * FROM can_generate_quiz(auth.uid());
```

#### **4. Rollback Procedures**
```sql
-- Emergency rollback template
BEGIN;

-- 1. Log rollback
INSERT INTO migration_log (migration_name, status, notes)
VALUES ('rollback_schema_update_20251209', 'rolling_back', 'Migration failed');

-- 2. Restore from backup (if needed)
-- psql -h host -U user -d db < backup_file.sql

-- 3. Verify rollback
\i supabase_verify_schema_results.sql

COMMIT;
```

---

## 💾 **BACKUP & RESTORE PROCEDURES**

### **Backup Strategy**

#### **1. Daily Automated Backup**
```bash
#!/bin/bash
# daily_backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/kwizme"
DB_HOST="your-supabase-host"
DB_USER="postgres"
DB_NAME="postgres"

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --file=$BACKUP_DIR/$DATE/kwizme_full_$DATE.backup

# Schema-only backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --schema-only \
    --file=$BACKUP_DIR/$DATE/kwizme_schema_$DATE.sql

# Data-only backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --data-only \
    --format=custom \
    --file=$BACKUP_DIR/$DATE/kwizme_data_$DATE.backup

# Verification
pg_restore --list $BACKUP_DIR/$DATE/kwizme_full_$DATE.backup > $BACKUP_DIR/$DATE/restore_list.txt

echo "Backup completed: $BACKUP_DIR/$DATE"
```

#### **2. Table-Specific Backups**
```sql
-- Critical tables backup (before major changes)
\copy profiles TO 'profiles_backup.csv' WITH CSV HEADER;
\copy quizzes TO 'quizzes_backup.csv' WITH CSV HEADER;
\copy questions TO 'questions_backup.csv' WITH CSV HEADER;
\copy review_sessions TO 'sessions_backup.csv' WITH CSV HEADER;
```

### **Restore Procedures**

#### **1. Full Database Restore**
```bash
# Stop application (prevent new connections)
# Update maintenance mode flag

# Restore from backup
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --clean \
    --if-exists \
    --format=custom \
    kwizme_full_20251209_120000.backup

# Verify restore
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f supabase_verify_schema_results.sql

# Resume application
```

#### **2. Point-in-Time Recovery**
```bash
# Supabase provides automatic point-in-time recovery
# Use Supabase dashboard or CLI:
supabase db reset --db-url "your-connection-string"
```

#### **3. Selective Table Restore**
```sql
-- Restore specific table (careful with dependencies)
BEGIN;

-- Backup current data
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Clear table
TRUNCATE profiles CASCADE; -- BE CAREFUL WITH CASCADE

-- Restore from backup file
\copy profiles FROM 'profiles_backup.csv' WITH CSV HEADER;

-- Verify
SELECT COUNT(*) FROM profiles;

COMMIT;
```

---

## 📊 **MONITORING & ALERTING**

### **Database Health Monitoring**

#### **1. Daily Health Check Script**
```sql
-- health_check.sql
SELECT
    'Database Health Check - ' || NOW()::DATE as report_date,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM quizzes) as total_quizzes,
    (SELECT COUNT(*) FROM questions) as total_questions,
    (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size;

-- Table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
    n_live_tup as rows
FROM pg_tables t
JOIN pg_stat_user_tables s ON t.tablename = s.relname
WHERE t.schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- RLS Policy Status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND NOT rowsecurity;
```

#### **2. Performance Monitoring**
```sql
-- performance_check.sql
-- Index usage (weekly check)
SELECT
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN idx_tup_read = 0 THEN 'UNUSED'
        WHEN idx_tup_read < 100 THEN 'LOW'
        WHEN idx_tup_read < 1000 THEN 'MEDIUM'
        ELSE 'HIGH'
    END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Long-running queries (if available)
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 minute'
AND state = 'active';
```

#### **3. Rate Limiting Monitoring**
```sql
-- rate_limit_check.sql
-- Daily usage patterns
SELECT
    generated_date,
    COUNT(DISTINCT user_id) as active_users,
    SUM(quiz_count) as total_quizzes_generated,
    AVG(quiz_count) as avg_per_user,
    COUNT(DISTINCT ip_address) as unique_ips
FROM daily_usage
WHERE generated_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY generated_date
ORDER BY generated_date DESC;

-- Users hitting limits
SELECT
    p.email,
    du.quiz_count,
    COALESCE(ul.daily_limit, 5) as limit,
    ul.is_unlimited
FROM daily_usage du
JOIN profiles p ON du.user_id = p.id
LEFT JOIN user_limits ul ON du.user_id = ul.user_id
WHERE du.generated_date = CURRENT_DATE
AND du.quiz_count >= COALESCE(ul.daily_limit, 5)
AND NOT COALESCE(ul.is_unlimited, FALSE);
```

### **Alerting Thresholds**

#### **Critical Alerts**
- Database size > 80% of plan limit
- Active connections > 80% of limit
- Any table without RLS enabled
- Migration failures
- Backup failures

#### **Warning Alerts**
- Query response time > 1 second
- Index with 0 usage for 7+ days
- User hitting rate limits repeatedly
- Unusual data growth patterns

---

## 🚨 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

#### **1. Authentication/Authorization Issues**

**Symptom**: Users can't access their data
```sql
-- Diagnosis
SELECT * FROM profiles WHERE email = 'user@example.com';
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
```

**Solution**: Verify RLS policies are correctly configured
```sql
-- Fix missing RLS policy example
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);
```

#### **2. Rate Limiting Issues**

**Symptom**: Rate limiting not working
```sql
-- Diagnosis
SELECT * FROM can_generate_quiz(auth.uid());
SELECT * FROM daily_usage WHERE user_id = auth.uid();
SELECT * FROM user_limits WHERE user_id = auth.uid();
```

**Solutions**:
```sql
-- Reset user's daily count
UPDATE daily_usage
SET quiz_count = 0
WHERE user_id = 'user_id' AND generated_date = CURRENT_DATE;

-- Grant unlimited access
INSERT INTO user_limits (user_id, is_unlimited, reason, granted_by)
VALUES ('user_id', TRUE, 'Support override', auth.uid());
```

#### **3. Performance Issues**

**Symptom**: Slow query performance
```sql
-- Diagnosis
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM quizzes WHERE user_id = auth.uid();

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'quizzes';
```

**Solutions**:
```sql
-- Refresh statistics
ANALYZE quizzes;

-- Rebuild index if corrupted
REINDEX INDEX idx_quizzes_user_id;

-- Add missing index
CREATE INDEX CONCURRENTLY idx_missing ON table_name (column_name);
```

#### **4. Data Integrity Issues**

**Symptom**: Foreign key violations or orphaned data
```sql
-- Diagnosis: Find orphaned questions
SELECT q.* FROM questions q
LEFT JOIN quizzes qz ON q.quiz_id = qz.quiz_id
WHERE qz.quiz_id IS NULL;

-- Diagnosis: Find orphaned sessions
SELECT rs.* FROM review_sessions rs
LEFT JOIN quizzes q ON rs.quiz_id = q.quiz_id
WHERE q.quiz_id IS NULL;
```

**Solutions**:
```sql
-- Clean up orphaned data (BE CAREFUL)
DELETE FROM questions WHERE quiz_id NOT IN (SELECT quiz_id FROM quizzes);

-- Or move to cleanup table first
CREATE TABLE orphaned_questions AS
SELECT * FROM questions WHERE quiz_id NOT IN (SELECT quiz_id FROM quizzes);
```

### **Emergency Recovery Procedures**

#### **Database Corruption**
1. **Immediate**: Stop application, prevent new connections
2. **Assessment**: Run `pg_check` or verify basic queries
3. **Recovery**: Restore from latest backup
4. **Verification**: Full schema and data integrity check

#### **Data Loss**
1. **Immediate**: Identify scope of loss
2. **Recovery**: Point-in-time recovery if available
3. **Manual Recovery**: Restore specific tables from backup
4. **Communication**: Notify users of any data loss

#### **Performance Degradation**
1. **Immediate**: Check active connections and long queries
2. **Analysis**: Review recent changes and query patterns
3. **Mitigation**: Kill problematic queries, add indexes
4. **Monitoring**: Increase monitoring frequency

---

## 📈 **CAPACITY PLANNING**

### **Growth Projections**

#### **Current Baseline (Development)**
- Users: 2
- Quizzes: 16
- Questions: 394
- Sessions: 13
- Database Size: 912 kB

#### **Production Scaling Estimates**
```sql
-- Growth calculation queries
-- Estimate at 1,000 users
SELECT
    '1,000 users' as scenario,
    1000 * (16.0/2) as estimated_quizzes,
    1000 * (394.0/2) as estimated_questions,
    '~456 MB' as estimated_size;

-- Estimate at 10,000 users
SELECT
    '10,000 users' as scenario,
    10000 * (16.0/2) as estimated_quizzes,
    10000 * (394.0/2) as estimated_questions,
    '~4.5 GB' as estimated_size;
```

### **Scaling Thresholds**

| Metric | Current | Warning | Critical | Action Required |
|--------|---------|---------|----------|-----------------|
| Users | 2 | 1,000 | 5,000 | Review rate limiting |
| Questions | 394 | 100,000 | 500,000 | Consider partitioning |
| DB Size | 912 kB | 1 GB | 5 GB | Upgrade plan |
| Connections | Low | 80% limit | 95% limit | Connection pooling |

---

## 🔧 **MAINTENANCE PROCEDURES**

### **Daily Tasks**
```bash
# Automated daily maintenance
./scripts/daily_backup.sh
./scripts/health_check.sh
./scripts/cleanup_temp_data.sh
```

### **Weekly Tasks**
```sql
-- 1. Update table statistics
ANALYZE;

-- 2. Review index usage
\i performance_check.sql

-- 3. Check for unused indexes
SELECT * FROM pg_stat_user_indexes WHERE idx_tup_read = 0;

-- 4. Review rate limiting patterns
\i rate_limit_check.sql
```

### **Monthly Tasks**
1. **Security Review**: Audit RLS policies and user access
2. **Performance Review**: Analyze query patterns and optimize
3. **Capacity Review**: Check growth trends and scaling needs
4. **Backup Testing**: Verify backup integrity and restore procedures

### **Quarterly Tasks**
1. **Schema Review**: Document any schema changes
2. **Disaster Recovery Testing**: Full backup/restore drill
3. **Security Updates**: Review and apply security patches
4. **Documentation Updates**: Update this runbook and procedures

---

## 📞 **ESCALATION PROCEDURES**

### **Severity Levels**

#### **SEV 1 - Critical (Database Down)**
- **Response Time**: Immediate
- **Actions**: Emergency restore, escalate to senior DBA
- **Communication**: Notify all stakeholders immediately

#### **SEV 2 - Major (Performance Degraded)**
- **Response Time**: 1 hour
- **Actions**: Performance optimization, query tuning
- **Communication**: Notify development team

#### **SEV 3 - Minor (Non-critical Issues)**
- **Response Time**: 4 hours
- **Actions**: Schedule maintenance, documentation updates
- **Communication**: Log in ticketing system

### **Contact Information**
- **Primary DBA**: [Contact Info]
- **Supabase Support**: [Support Channel]
- **Development Team Lead**: [Contact Info]
- **On-Call Rotation**: [Schedule/System]

---

## 📚 **REFERENCE DOCUMENTATION**

### **Key Files**
- `SCHEMA_README.md` - Complete schema documentation
- `supabase_verify_schema_results.sql` - Health check script
- `performance_recommendations.md` - Performance optimization guide
- `user_management/USER_MANAGEMENT_GUIDE.md` - User management procedures

### **External Resources**
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**⚠️ Important**: Always test procedures in a development environment before applying to production. Keep this runbook updated with any changes to procedures or contact information.