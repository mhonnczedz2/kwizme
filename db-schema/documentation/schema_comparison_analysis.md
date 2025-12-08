# Schema Comparison Analysis - Live vs Documented

**Date**: December 9, 2025
**Purpose**: Compare live database schema with existing documentation
**Status**: ⚠️ **SCHEMA DRIFT DETECTED** - Live database differs from documented schema

---

## 🎯 **EXECUTIVE SUMMARY**

### ✅ **What's Working Well**
- **Core 5 tables** match documentation perfectly
- **RLS policies** are comprehensive and well-implemented
- **Indexes** are performing well with good usage patterns
- **Functions and triggers** are working as designed

### ⚠️ **Critical Issues Identified**

1. **🔢 Table Count Mismatch**
   - **Documented**: 5 tables (README states "5 tables")
   - **Live Database**: 8 tables (3 additional tables not in main docs)

2. **📚 Incomplete Documentation**
   - Rate limiting schemas exist but not integrated into main documentation
   - Multiple rate limiting systems suggest schema evolution
   - Some indexes and functions are undocumented

3. **🏗️ Schema Evolution Signs**
   - Two different rate limiting approaches (migration in progress?)
   - New functions added but not documented in main schema
   - IP-based rate limiting added for anonymous users

---

## 📊 **DETAILED COMPARISON**

### **1. TABLE ANALYSIS**

#### ✅ **Core Tables (5/5 Match)**

| Table | Live DB | Documented | Status | Notes |
|-------|---------|------------|--------|-------|
| **profiles** | ✅ Present | ✅ Complete | 🟢 **MATCH** | Exact match with institution/program columns |
| **quizzes** | ✅ Present | ✅ Complete | 🟢 **MATCH** | All columns, constraints, and RLS match |
| **questions** | ✅ Present | ✅ Complete | 🟢 **MATCH** | JSONB options, difficulty checks work correctly |
| **review_sessions** | ✅ Present | ✅ Complete | 🟢 **MATCH** | All 16 columns including session config fields |
| **answer_records** | ✅ Present | ✅ Complete | 🟢 **MATCH** | Foreign keys and RLS policies correct |

#### ⚠️ **Additional Tables (3 Found, Partially Documented)**

| Table | Live DB | Documented | Status | Documentation Location |
|-------|---------|------------|--------|------------------------|
| **daily_usage** | ✅ Present | ✅ Partial | 🟡 **DRIFT** | `rate_limiting_schema.sql` (not in main) |
| **user_limits** | ✅ Present | ✅ Partial | 🟡 **DRIFT** | `rate_limiting_schema.sql` (not in main) |
| **quiz_usage** | ✅ Present | ✅ Partial | 🟡 **DRIFT** | `quiz_usage_schema.sql` (separate system) |

---

### **2. SCHEMA EVOLUTION ANALYSIS**

#### 🔄 **Rate Limiting System Evolution**

**System 1**: `daily_usage` + `user_limits` (Original)
- Date-based tracking (CURRENT_DATE)
- User overrides with expiration
- Functions: `increment_quiz_count()`, `get_user_daily_limit()`, `can_generate_quiz()`
- **Status**: ✅ Active (based on index usage stats)

**System 2**: `quiz_usage` (Newer/Alternative)
- Timestamp-based tracking (created_at)
- Simpler logging approach
- IP-based anonymous user support
- **Status**: ✅ Active (data present, recent usage)

**⚠️ Issue**: Two systems coexist - unclear which is primary or if migration is complete.

---

### **3. FUNCTION & TRIGGER ANALYSIS**

#### ✅ **Core Functions (Match Documentation)**

| Function | Live DB | Documented | Status |
|----------|---------|------------|--------|
| `handle_new_user` | ✅ Present | ✅ Complete | 🟢 **MATCH** |
| `update_updated_at_column` | ✅ Present | ✅ Complete | 🟢 **MATCH** |

#### ⚠️ **Additional Functions (Undocumented in Main Schema)**

| Function | Live DB | Documentation | Purpose |
|----------|---------|---------------|---------|
| `can_generate_quiz` | ✅ Present | Rate limiting only | Rate limit checking |
| `get_user_daily_limit` | ✅ Present | Rate limiting only | User limit retrieval |
| `increment_quiz_count` | ✅ Present | Rate limiting only | Usage increment (users) |
| `increment_quiz_count_ip` | ✅ Present | ❌ **Missing** | Usage increment (IP-based) |
| `handle_updated_at` | ✅ Present | ❌ **Missing** | Duplicate of update_updated_at_column? |

#### 🔧 **Triggers Analysis**

**Expected** (from main schema):
- `on_auth_user_created` → `handle_new_user()` ❌ **Not visible in results**
- `update_profiles_updated_at` → `update_updated_at_column()` ✅ **Present**
- `update_quizzes_updated_at` → `update_updated_at_column()` ✅ **Present**

**Additional Found**:
- `set_updated_at` → `handle_updated_at()` ⚠️ **Undocumented**

---

### **4. ROW LEVEL SECURITY ANALYSIS**

#### ✅ **Core RLS (Excellent Coverage)**
- All 8 tables have RLS enabled ✅
- User data isolation working correctly ✅
- Proper inheritance (questions→quizzes, answer_records→sessions) ✅

#### 🆕 **Additional RLS Features (Not in Main Docs)**
- **Anonymous user policies** for IP-based rate limiting
- **Service role policies** for admin operations
- **Mixed user/IP policies** for quiz_usage table

#### 🔧 **Policy Naming Patterns**
- Consistent "Users can [action] own [resource]" pattern ✅
- Service role policies clearly identified ✅
- Anonymous policies clearly separated ✅

---

### **5. INDEX PERFORMANCE ANALYSIS**

#### 🏆 **Top Performing Indexes (Usage Stats)**

| Index | Reads | Fetches | Purpose | Performance |
|-------|-------|---------|---------|-------------|
| `idx_questions_quiz_id` | 6,605 | 3,436 | Question lookups | 🟢 **High Usage** |
| `idx_quizzes_user_id` | 2,906 | 2,900 | User's quizzes | 🟢 **High Usage** |
| `quizzes_pkey` | 1,488 | 1,478 | Quiz lookups | 🟢 **Good Usage** |

#### ⚠️ **Unused/Low Usage Indexes**

| Index | Reads | Status | Action Needed |
|-------|-------|--------|---------------|
| `idx_quizzes_institution` | 0 | 🔴 **Unused** | Consider removal or review usage patterns |
| `idx_quizzes_course_code` | 0 | 🔴 **Unused** | Consider removal or review usage patterns |
| `idx_user_limits_expires` | 0 | 🔴 **Unused** | May be needed for future expiration logic |

#### ✅ **Well-Optimized Areas**
- Quiz browsing (user_id indexes heavily used)
- Question retrieval (quiz_id index performing well)
- Session management (session_id lookups efficient)

---

### **6. DATA VOLUME & USAGE PATTERNS**

#### 📊 **Table Activity (Insights from Live Data)**

| Table | Live Rows | Total Operations | Activity Level | Insights |
|-------|-----------|------------------|----------------|-----------|
| **questions** | 394 | 5,761 ops | 🔥 **Very High** | Heavy question management (inserts/deletes) |
| **quizzes** | 16 | 634 ops | 🔥 **High** | Active quiz creation/editing |
| **quiz_usage** | 15 | 15 ops | 🟡 **Medium** | Rate limiting in use |
| **answer_records** | 13 | 134 ops | 🟡 **Medium** | Quiz taking activity |
| **review_sessions** | 13 | 48 ops | 🟡 **Medium** | Session management |
| **daily_usage** | 3 | 16 ops | 🟢 **Low** | GMT+8 reset rate limiting |
| **profiles** | 2 | 35 ops | 🟢 **Low** | User management |
| **user_limits** | 0 | 14 ops | 🟢 **Very Low** | Admin override system |

#### 🎯 **Usage Pattern Analysis**
- **Development Environment**: Low user count (2 profiles) suggests dev/testing
- **Active Development**: High question/quiz operations indicate ongoing content work
- **Rate Limiting**: Both systems show usage, suggesting transition/testing
- **Performance**: Small data volume (< 1MB total) - no performance concerns yet

---

## 🚨 **CRITICAL ISSUES REQUIRING ATTENTION**

### **1. Documentation Gaps** 🔴 **HIGH PRIORITY**

**Issue**: Main `SCHEMA_README.md` states "5 tables" but live database has 8 tables.

**Impact**:
- New developers will have incomplete understanding
- Schema verification scripts may miss issues
- Backup/restore procedures may be incomplete

**Required Action**: Update main documentation to include all 8 tables.

---

### **2. Dual Rate Limiting Systems** 🟡 **MEDIUM PRIORITY**

**Issue**: Two rate limiting approaches coexist with unclear primary system.

**Systems Found**:
- **System A**: `daily_usage` + `user_limits` (date-based, user overrides)
- **System B**: `quiz_usage` (timestamp-based, simpler logging)

**Impact**:
- Potential data inconsistency
- Unclear which system to maintain/develop
- Confusing for developers

**Required Action**: Clarify which system is primary or document migration plan.

---

### **3. Missing Trigger Documentation** 🟡 **MEDIUM PRIORITY**

**Issue**: `on_auth_user_created` trigger not visible in query results.

**Possible Causes**:
- Trigger exists on `auth.users` (different schema)
- Trigger was not created or was dropped
- Query limitation (can't see cross-schema triggers)

**Required Action**: Verify auth trigger exists and document properly.

---

### **4. Unused Indexes** 🟢 **LOW PRIORITY**

**Issue**: Several indexes show zero usage.

**Affected Indexes**:
- `idx_quizzes_institution` (0 reads)
- `idx_quizzes_course_code` (0 reads)
- Multiple rate limiting indexes (0 reads)

**Impact**: Minor performance overhead, storage waste

**Required Action**: Review if indexes are needed for future features or remove.

---

## 📋 **NEXT STEPS FOR PHASE 3**

### **Immediate Actions** (Phase 3)
1. ✅ Update `SCHEMA_README.md` to reflect all 8 tables
2. ✅ Document rate limiting system architecture
3. ✅ Clarify which rate limiting system is primary
4. ✅ Add performance optimization notes
5. ✅ Document IP-based anonymous user features

### **Investigation Needed**
1. 🔍 Verify `on_auth_user_created` trigger status
2. 🔍 Determine rate limiting system migration status
3. 🔍 Review unused indexes for future removal
4. 🔍 Audit function duplication (`handle_updated_at` vs `update_updated_at_column`)

### **Documentation Updates**
1. 📝 Comprehensive table list (8 tables)
2. 📝 Rate limiting architecture overview
3. 📝 Anonymous user feature documentation
4. 📝 Performance optimization recommendations
5. 📝 Migration/cleanup procedures

---

## ✅ **CONCLUSION**

The KwizMe database schema is **fundamentally solid** with excellent security practices and good performance optimization. However, **documentation drift** has occurred due to schema evolution, particularly around rate limiting features.

**Priority**: Update documentation to match live schema and clarify system architecture for future development.

**Risk Level**: 🟡 **Medium** - No data integrity issues, but development efficiency impact from incomplete docs.