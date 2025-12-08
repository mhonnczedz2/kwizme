# Database Discovery Results - KwizMe

**Date**: December 9, 2025
**Purpose**: Document current live database schema state for comparison with existing documentation
**Databases**: PostgreSQL (Supabase) + SQLite (Browser Local Storage)

---

## 📊 PHASE 1: DISCOVERY QUERY RESULTS

### Instructions for Data Collection
1. **PostgreSQL**: Run queries in Supabase SQL Editor and paste results below
2. **SQLite**: Run queries in browser console or development tools
3. **Format**: Paste raw query results - I'll analyze and format them later

---

## 🐘 POSTGRESQL (SUPABASE) RESULTS

### 1.1 Schema Structure Analysis

#### Query 1A: Basic Table Information
```sql
SELECT
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**📋 PASTE RESULTS HERE:**
```
| schemaname | tablename       | tableowner | tablespace | hasindexes | hasrules | hastriggers |
| ---------- | --------------- | ---------- | ---------- | ---------- | -------- | ----------- |
| public     | answer_records  | postgres   | null       | true       | false    | true        |
| public     | daily_usage     | postgres   | null       | true       | false    | true        |
| public     | profiles        | postgres   | null       | true       | false    | true        |
| public     | questions       | postgres   | null       | true       | false    | true        |
| public     | quiz_usage      | postgres   | null       | true       | false    | true        |
| public     | quizzes         | postgres   | null       | true       | false    | true        |
| public     | review_sessions | postgres   | null       | true       | false    | true        |
| public     | user_limits     | postgres   | null       | true       | false    | true        |
```

---

#### Query 1B: Detailed Table Information
```sql
SELECT
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**📋 PASTE RESULTS HERE:**
```
| table_name      | table_type | is_insertable_into | is_typed |
| --------------- | ---------- | ------------------ | -------- |
| answer_records  | BASE TABLE | YES                | NO       |
| daily_usage     | BASE TABLE | YES                | NO       |
| profiles        | BASE TABLE | YES                | NO       |
| questions       | BASE TABLE | YES                | NO       |
| quiz_usage      | BASE TABLE | YES                | NO       |
| quizzes         | BASE TABLE | YES                | NO       |
| review_sessions | BASE TABLE | YES                | NO       |
| user_limits     | BASE TABLE | YES                | NO       |
```

---

### 1.2 Column Analysis

#### Query 2A: All Columns with Data Types
```sql
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**📋 PASTE RESULTS HERE:**
```
| table_name      | column_name            | data_type                | character_maximum_length | is_nullable | column_default                                    | ordinal_position |
| --------------- | ---------------------- | ------------------------ | ------------------------ | ----------- | ------------------------------------------------- | ---------------- |
| answer_records  | record_id              | bigint                   | null                     | NO          | nextval('answer_records_record_id_seq'::regclass) | 1                |
| answer_records  | session_id             | uuid                     | null                     | NO          | null                                              | 2                |
| answer_records  | question_id            | bigint                   | null                     | NO          | null                                              | 3                |
| answer_records  | selected_answer_index  | integer                  | null                     | NO          | null                                              | 4                |
| answer_records  | is_correct             | boolean                  | null                     | NO          | null                                              | 5                |
| answer_records  | time_spent_seconds     | integer                  | null                     | YES         | null                                              | 6                |
| answer_records  | answered_at            | timestamp with time zone | null                     | YES         | now()                                             | 7                |
| daily_usage     | id                     | bigint                   | null                     | NO          | nextval('daily_usage_id_seq'::regclass)           | 1                |
| daily_usage     | user_id                | uuid                     | null                     | YES         | null                                              | 2                |
| daily_usage     | ip_address             | inet                     | null                     | YES         | null                                              | 3                |
| daily_usage     | generated_date         | date                     | null                     | NO          | CURRENT_DATE                                      | 4                |
| daily_usage     | quiz_count             | integer                  | null                     | NO          | 1                                                 | 5                |
| daily_usage     | created_at             | timestamp with time zone | null                     | YES         | now()                                             | 6                |
| daily_usage     | updated_at             | timestamp with time zone | null                     | YES         | now()                                             | 7                |
| profiles        | id                     | uuid                     | null                     | NO          | null                                              | 1                |
| profiles        | email                  | text                     | null                     | YES         | null                                              | 2                |
| profiles        | full_name              | text                     | null                     | YES         | null                                              | 3                |
| profiles        | avatar_url             | text                     | null                     | YES         | null                                              | 4                |
| profiles        | created_at             | timestamp with time zone | null                     | YES         | now()                                             | 5                |
| profiles        | updated_at             | timestamp with time zone | null                     | YES         | now()                                             | 6                |
| profiles        | institution            | text                     | null                     | YES         | null                                              | 7                |
| profiles        | program                | text                     | null                     | YES         | null                                              | 8                |
| questions       | id                     | bigint                   | null                     | NO          | nextval('questions_id_seq'::regclass)             | 1                |
| questions       | quiz_id                | text                     | null                     | NO          | null                                              | 2                |
| questions       | question_text          | text                     | null                     | NO          | null                                              | 3                |
| questions       | options                | jsonb                    | null                     | NO          | null                                              | 4                |
| questions       | correct_answer         | text                     | null                     | NO          | null                                              | 5                |
| questions       | correct_answer_index   | integer                  | null                     | YES         | null                                              | 6                |
| questions       | explanation            | text                     | null                     | YES         | null                                              | 7                |
| questions       | citation               | text                     | null                     | YES         | null                                              | 8                |
| questions       | hint                   | text                     | null                     | YES         | null                                              | 9                |
| questions       | difficulty             | text                     | null                     | YES         | null                                              | 10               |
| questions       | created_at             | timestamp with time zone | null                     | YES         | now()                                             | 11               |
| quiz_usage      | id                     | bigint                   | null                     | NO          | nextval('quiz_usage_id_seq'::regclass)            | 1                |
| quiz_usage      | user_id                | uuid                     | null                     | YES         | null                                              | 2                |
| quiz_usage      | ip_address             | inet                     | null                     | YES         | null                                              | 3                |
| quiz_usage      | created_at             | timestamp with time zone | null                     | YES         | now()                                             | 4                |
| quizzes         | quiz_id                | text                     | null                     | NO          | null                                              | 1                |
| quizzes         | user_id                | uuid                     | null                     | NO          | null                                              | 2                |
| quizzes         | quiz_title             | text                     | null                     | NO          | null                                              | 3                |
| quizzes         | file_name              | text                     | null                     | NO          | null                                              | 4                |
| quizzes         | description            | text                     | null                     | YES         | null                                              | 5                |
| quizzes         | institution            | text                     | null                     | YES         | null                                              | 6                |
| quizzes         | program                | text                     | null                     | YES         | null                                              | 7                |
| quizzes         | course                 | text                     | null                     | YES         | null                                              | 8                |
| quizzes         | course_code            | text                     | null                     | YES         | null                                              | 9                |
| quizzes         | topic                  | text                     | null                     | YES         | null                                              | 10               |
| quizzes         | difficulty_level       | text                     | null                     | YES         | null                                              | 11               |
| quizzes         | created_at             | timestamp with time zone | null                     | YES         | now()                                             | 12               |
| quizzes         | updated_at             | timestamp with time zone | null                     | YES         | now()                                             | 13               |
| review_sessions | session_id             | uuid                     | null                     | NO          | uuid_generate_v4()                                | 1                |
| review_sessions | user_id                | uuid                     | null                     | NO          | null                                              | 2                |
| review_sessions | quiz_id                | text                     | null                     | NO          | null                                              | 3                |
| review_sessions | started_at             | timestamp with time zone | null                     | YES         | now()                                             | 4                |
| review_sessions | completed_at           | timestamp with time zone | null                     | YES         | null                                              | 5                |
| review_sessions | total_questions        | integer                  | null                     | NO          | null                                              | 6                |
| review_sessions | correct_answers        | integer                  | null                     | YES         | null                                              | 7                |
| review_sessions | score_percentage       | real                     | null                     | YES         | null                                              | 8                |
| review_sessions | time_spent_seconds     | integer                  | null                     | YES         | null                                              | 9                |
| review_sessions | quick_submit           | boolean                  | null                     | YES         | false                                             | 10               |
| review_sessions | show_explanation       | boolean                  | null                     | YES         | true                                              | 11               |
| review_sessions | time_limit_seconds     | integer                  | null                     | YES         | null                                              | 12               |
| review_sessions | randomize_options      | boolean                  | null                     | YES         | false                                             | 13               |
| review_sessions | randomize_questions    | boolean                  | null                     | YES         | false                                             | 14               |
| review_sessions | num_questions_selected | integer                  | null                     | NO          | null                                              | 15               |
| review_sessions | preset_name            | text                     | null                     | YES         | null                                              | 16               |
| user_limits     | id                     | bigint                   | null                     | NO          | nextval('user_limits_id_seq'::regclass)           | 1                |
| user_limits     | user_id                | uuid                     | null                     | YES         | null                                              | 2                |
| user_limits     | daily_limit            | integer                  | null                     | NO          | 5                                                 | 3                |
| user_limits     | is_unlimited           | boolean                  | null                     | YES         | false                                             | 4                |
| user_limits     | reason                 | text                     | null                     | YES         | null                                              | 5                |
| user_limits     | granted_by             | uuid                     | null                     | YES         | null                                              | 6                |
| user_limits     | granted_at             | timestamp with time zone | null                     | YES         | now()                                             | 7                |
| user_limits     | expires_at             | timestamp with time zone | null                     | YES         | null                                              | 8                |
| user_limits     | created_at             | timestamp with time zone | null                     | YES         | now()                                             | 9                |
```

---

#### Query 2B: Constraints and Foreign Keys
```sql
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;
```

**📋 PASTE RESULTS HERE:**
```
| table_name      | constraint_name                        | constraint_type | column_name    | foreign_table_name | foreign_column_name |
| --------------- | -------------------------------------- | --------------- | -------------- | ------------------ | ------------------- |
| answer_records  | 2200_17929_2_not_null                  | CHECK           | null           | null               | null                |
| answer_records  | 2200_17929_1_not_null                  | CHECK           | null           | null               | null                |
| answer_records  | 2200_17929_5_not_null                  | CHECK           | null           | null               | null                |
| answer_records  | 2200_17929_4_not_null                  | CHECK           | null           | null               | null                |
| answer_records  | 2200_17929_3_not_null                  | CHECK           | null           | null               | null                |
| answer_records  | answer_records_session_id_fkey         | FOREIGN KEY     | session_id     | review_sessions    | session_id          |
| answer_records  | answer_records_question_id_fkey        | FOREIGN KEY     | question_id    | questions          | id                  |
| answer_records  | answer_records_pkey                    | PRIMARY KEY     | record_id      | answer_records     | record_id           |
| daily_usage     | 2200_26266_4_not_null                  | CHECK           | null           | null               | null                |
| daily_usage     | 2200_26266_1_not_null                  | CHECK           | null           | null               | null                |
| daily_usage     | 2200_26266_5_not_null                  | CHECK           | null           | null               | null                |
| daily_usage     | daily_usage_user_id_fkey               | FOREIGN KEY     | user_id        | profiles           | id                  |
| daily_usage     | daily_usage_pkey                       | PRIMARY KEY     | id             | daily_usage        | id                  |
| daily_usage     | daily_usage_user_id_generated_date_key | UNIQUE          | user_id        | daily_usage        | user_id             |
| daily_usage     | daily_usage_user_id_generated_date_key | UNIQUE          | generated_date | daily_usage        | generated_date      |
| daily_usage     | daily_usage_user_id_generated_date_key | UNIQUE          | generated_date | daily_usage        | user_id             |
| daily_usage     | daily_usage_ip_date_unique             | UNIQUE          | generated_date | daily_usage        | generated_date      |
| daily_usage     | daily_usage_ip_date_unique             | UNIQUE          | ip_address     | daily_usage        | ip_address          |
| daily_usage     | daily_usage_ip_date_unique             | UNIQUE          | ip_address     | daily_usage        | generated_date      |
| daily_usage     | daily_usage_ip_date_unique             | UNIQUE          | generated_date | daily_usage        | ip_address          |
| daily_usage     | daily_usage_user_id_generated_date_key | UNIQUE          | user_id        | daily_usage        | generated_date      |
| profiles        | 2200_17503_1_not_null                  | CHECK           | null           | null               | null                |
| profiles        | profiles_id_fkey                       | FOREIGN KEY     | id             | null               | null                |
| profiles        | profiles_pkey                          | PRIMARY KEY     | id             | profiles           | id                  |
| questions       | 2200_17882_4_not_null                  | CHECK           | null           | null               | null                |
| questions       | questions_difficulty_check             | CHECK           | null           | questions          | difficulty          |
| questions       | 2200_17882_1_not_null                  | CHECK           | null           | null               | null                |
| questions       | 2200_17882_2_not_null                  | CHECK           | null           | null               | null                |
| questions       | 2200_17882_3_not_null                  | CHECK           | null           | null               | null                |
| questions       | 2200_17882_5_not_null                  | CHECK           | null           | null               | null                |
| questions       | questions_quiz_id_fkey                 | FOREIGN KEY     | quiz_id        | quizzes            | quiz_id             |
| questions       | questions_pkey                         | PRIMARY KEY     | id             | questions          | id                  |
| quiz_usage      | 2200_28565_1_not_null                  | CHECK           | null           | null               | null                |
| quiz_usage      | user_or_ip                             | CHECK           | null           | quiz_usage         | ip_address          |
| quiz_usage      | user_or_ip                             | CHECK           | null           | quiz_usage         | user_id             |
| quiz_usage      | quiz_usage_user_id_fkey                | FOREIGN KEY     | user_id        | profiles           | id                  |
| quiz_usage      | quiz_usage_pkey                        | PRIMARY KEY     | id             | quiz_usage         | id                  |
| quizzes         | 2200_17862_1_not_null                  | CHECK           | null           | null               | null                |
| quizzes         | 2200_17862_3_not_null                  | CHECK           | null           | null               | null                |
| quizzes         | 2200_17862_4_not_null                  | CHECK           | null           | null               | null                |
| quizzes         | quizzes_difficulty_level_check         | CHECK           | null           | quizzes            | difficulty_level    |
| quizzes         | 2200_17862_2_not_null                  | CHECK           | null           | null               | null                |
| quizzes         | quizzes_user_id_fkey                   | FOREIGN KEY     | user_id        | null               | null                |
| quizzes         | quizzes_pkey                           | PRIMARY KEY     | quiz_id        | quizzes            | quiz_id             |
| review_sessions | 2200_17901_6_not_null                  | CHECK           | null           | null               | null                |
| review_sessions | 2200_17901_1_not_null                  | CHECK           | null           | null               | null                |
| review_sessions | 2200_17901_2_not_null                  | CHECK           | null           | null               | null                |
| review_sessions | 2200_17901_3_not_null                  | CHECK           | null           | null               | null                |
| review_sessions | 2200_17901_15_not_null                 | CHECK           | null           | null               | null                |
| review_sessions | review_sessions_user_id_fkey           | FOREIGN KEY     | user_id        | null               | null                |
| review_sessions | review_sessions_quiz_id_fkey           | FOREIGN KEY     | quiz_id        | quizzes            | quiz_id             |
| review_sessions | review_sessions_pkey                   | PRIMARY KEY     | session_id     | review_sessions    | session_id          |
| user_limits     | 2200_26286_3_not_null                  | CHECK           | null           | null               | null                |
| user_limits     | user_limits_check                      | CHECK           | null           | user_limits        | daily_limit         |
| user_limits     | user_limits_check                      | CHECK           | null           | user_limits        | is_unlimited        |
| user_limits     | user_limits_reason_check               | CHECK           | null           | user_limits        | reason              |
| user_limits     | 2200_26286_1_not_null                  | CHECK           | null           | null               | null                |
| user_limits     | user_limits_user_id_fkey               | FOREIGN KEY     | user_id        | profiles           | id                  |
| user_limits     | user_limits_granted_by_fkey            | FOREIGN KEY     | granted_by     | profiles           | id                  |
| user_limits     | user_limits_pkey                       | PRIMARY KEY     | id             | user_limits        | id                  |
| user_limits     | user_limits_user_id_key                | UNIQUE          | user_id        | user_limits        | user_id             |
```

---

### 1.3 Index Analysis

#### Query 3A: All Indexes
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**📋 PASTE RESULTS HERE:**
```
| schemaname | tablename       | indexname                              | indexdef                                                                                                               |
| ---------- | --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| public     | answer_records  | answer_records_pkey                    | CREATE UNIQUE INDEX answer_records_pkey ON public.answer_records USING btree (record_id)                               |
| public     | answer_records  | idx_answer_records_question_id         | CREATE INDEX idx_answer_records_question_id ON public.answer_records USING btree (question_id)                         |
| public     | answer_records  | idx_answer_records_session_id          | CREATE INDEX idx_answer_records_session_id ON public.answer_records USING btree (session_id)                           |
| public     | daily_usage     | daily_usage_ip_date_unique             | CREATE UNIQUE INDEX daily_usage_ip_date_unique ON public.daily_usage USING btree (ip_address, generated_date)          |
| public     | daily_usage     | daily_usage_pkey                       | CREATE UNIQUE INDEX daily_usage_pkey ON public.daily_usage USING btree (id)                                            |
| public     | daily_usage     | daily_usage_user_id_generated_date_key | CREATE UNIQUE INDEX daily_usage_user_id_generated_date_key ON public.daily_usage USING btree (user_id, generated_date) |
| public     | daily_usage     | idx_daily_usage_ip_date                | CREATE INDEX idx_daily_usage_ip_date ON public.daily_usage USING btree (ip_address, generated_date)                    |
| public     | daily_usage     | idx_daily_usage_user_date              | CREATE INDEX idx_daily_usage_user_date ON public.daily_usage USING btree (user_id, generated_date)                     |
| public     | profiles        | profiles_pkey                          | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)                                                  |
| public     | questions       | idx_questions_quiz_id                  | CREATE INDEX idx_questions_quiz_id ON public.questions USING btree (quiz_id)                                           |
| public     | questions       | questions_pkey                         | CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id)                                                |
| public     | quiz_usage      | idx_quiz_usage_created                 | CREATE INDEX idx_quiz_usage_created ON public.quiz_usage USING btree (created_at DESC)                                 |
| public     | quiz_usage      | idx_quiz_usage_ip_created              | CREATE INDEX idx_quiz_usage_ip_created ON public.quiz_usage USING btree (ip_address, created_at DESC)                  |
| public     | quiz_usage      | idx_quiz_usage_user_created            | CREATE INDEX idx_quiz_usage_user_created ON public.quiz_usage USING btree (user_id, created_at DESC)                   |
| public     | quiz_usage      | quiz_usage_pkey                        | CREATE UNIQUE INDEX quiz_usage_pkey ON public.quiz_usage USING btree (id)                                              |
| public     | quizzes         | idx_quizzes_course_code                | CREATE INDEX idx_quizzes_course_code ON public.quizzes USING btree (course_code)                                       |
| public     | quizzes         | idx_quizzes_created_at                 | CREATE INDEX idx_quizzes_created_at ON public.quizzes USING btree (created_at DESC)                                    |
| public     | quizzes         | idx_quizzes_institution                | CREATE INDEX idx_quizzes_institution ON public.quizzes USING btree (institution)                                       |
| public     | quizzes         | idx_quizzes_user_id                    | CREATE INDEX idx_quizzes_user_id ON public.quizzes USING btree (user_id)                                               |
| public     | quizzes         | quizzes_pkey                           | CREATE UNIQUE INDEX quizzes_pkey ON public.quizzes USING btree (quiz_id)                                               |
| public     | review_sessions | idx_review_sessions_completed_at       | CREATE INDEX idx_review_sessions_completed_at ON public.review_sessions USING btree (completed_at)                     |
| public     | review_sessions | idx_review_sessions_quiz_id            | CREATE INDEX idx_review_sessions_quiz_id ON public.review_sessions USING btree (quiz_id)                               |
| public     | review_sessions | idx_review_sessions_user_id            | CREATE INDEX idx_review_sessions_user_id ON public.review_sessions USING btree (user_id)                               |
| public     | review_sessions | review_sessions_pkey                   | CREATE UNIQUE INDEX review_sessions_pkey ON public.review_sessions USING btree (session_id)                            |
| public     | user_limits     | idx_user_limits_expires                | CREATE INDEX idx_user_limits_expires ON public.user_limits USING btree (expires_at) WHERE (expires_at IS NOT NULL)     |
| public     | user_limits     | idx_user_limits_user_id                | CREATE INDEX idx_user_limits_user_id ON public.user_limits USING btree (user_id)                                       |
| public     | user_limits     | user_limits_pkey                       | CREATE UNIQUE INDEX user_limits_pkey ON public.user_limits USING btree (id)                                            |
| public     | user_limits     | user_limits_user_id_key                | CREATE UNIQUE INDEX user_limits_user_id_key ON public.user_limits USING btree (user_id)                                |
```

---

#### Query 3B: Index Usage Statistics
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
```

**📋 PASTE RESULTS HERE:**
```
This query had an error:
Error: Failed to run sql query: ERROR: 42703: column "tablename" does not exist LINE 3: tablename, ^

Note: A limit of 100 was applied to your query. If this was the cause of a syntax error, try selecting "No limit" instead and re-run the query.

I modified the query with:
SELECT
  n.nspname AS schemaname,
  c.relname AS tablename,
  i.relname AS indexname,
  s.idx_tup_read,
  s.idx_tup_fetch
FROM pg_stat_user_indexes s
JOIN pg_index pi ON s.indexrelid = pi.indexrelid
JOIN pg_class i ON s.indexrelid = i.oid
JOIN pg_class c ON s.relid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY s.idx_tup_read DESC;

I got this result:
| schemaname | tablename       | indexname                              | idx_tup_read | idx_tup_fetch |
| ---------- | --------------- | -------------------------------------- | ------------ | ------------- |
| public     | questions       | idx_questions_quiz_id                  | 6605         | 3436          |
| public     | quizzes         | idx_quizzes_user_id                    | 2906         | 2900          |
| public     | quizzes         | quizzes_pkey                           | 1488         | 1478          |
| public     | review_sessions | idx_review_sessions_quiz_id            | 196          | 0             |
| public     | review_sessions | review_sessions_pkey                   | 175          | 173           |
| public     | answer_records  | idx_answer_records_session_id          | 145          | 20            |
| public     | quiz_usage      | idx_quiz_usage_user_created            | 123          | 96            |
| public     | user_limits     | idx_user_limits_user_id                | 107          | 105           |
| public     | review_sessions | idx_review_sessions_user_id            | 104          | 0             |
| public     | quiz_usage      | idx_quiz_usage_created                 | 96           | 96            |
| public     | profiles        | profiles_pkey                          | 79           | 42            |
| public     | quiz_usage      | idx_quiz_usage_ip_created              | 62           | 62            |
| public     | questions       | questions_pkey                         | 53           | 52            |
| public     | quizzes         | idx_quizzes_created_at                 | 36           | 27            |
| public     | daily_usage     | idx_daily_usage_user_date              | 18           | 18            |
| public     | answer_records  | idx_answer_records_question_id         | 18           | 3             |
| public     | daily_usage     | daily_usage_user_id_generated_date_key | 10           | 10            |
| public     | user_limits     | user_limits_user_id_key                | 10           | 10            |
| public     | quiz_usage      | quiz_usage_pkey                        | 0            | 0             |
| public     | answer_records  | answer_records_pkey                    | 0            | 0             |
| public     | daily_usage     | daily_usage_pkey                       | 0            | 0             |
| public     | user_limits     | idx_user_limits_expires                | 0            | 0             |
| public     | user_limits     | user_limits_pkey                       | 0            | 0             |
| public     | review_sessions | idx_review_sessions_completed_at       | 0            | 0             |
| public     | daily_usage     | daily_usage_ip_date_unique             | 0            | 0             |
| public     | daily_usage     | idx_daily_usage_ip_date                | 0            | 0             |
| public     | quizzes         | idx_quizzes_institution                | 0            | 0             |
| public     | quizzes         | idx_quizzes_course_code                | 0            | 0             |
```

---

### 1.4 Row Level Security Analysis

#### Query 4A: RLS Policies
```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**📋 PASTE RESULTS HERE:**
```
| schemaname | tablename       | policyname                                  | permissive | roles    | cmd    | qual                                                                                                                                                       | with_check                                                                                                                                                 |
| ---------- | --------------- | ------------------------------------------- | ---------- | -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | answer_records  | Users can delete own answer records         | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
   FROM review_sessions
  WHERE ((review_sessions.session_id = answer_records.session_id) AND (review_sessions.user_id = auth.uid())))) | null                                                                                                                                                       |
| public     | answer_records  | Users can insert own answer records         | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | (EXISTS ( SELECT 1
   FROM review_sessions
  WHERE ((review_sessions.session_id = answer_records.session_id) AND (review_sessions.user_id = auth.uid())))) |
| public     | answer_records  | Users can update own answer records         | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM review_sessions
  WHERE ((review_sessions.session_id = answer_records.session_id) AND (review_sessions.user_id = auth.uid())))) | null                                                                                                                                                       |
| public     | answer_records  | Users can view own answer records           | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM review_sessions
  WHERE ((review_sessions.session_id = answer_records.session_id) AND (review_sessions.user_id = auth.uid())))) | null                                                                                                                                                       |
| public     | daily_usage     | Anonymous users can insert IP usage         | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | ((ip_address IS NOT NULL) AND (user_id IS NULL))                                                                                                           |
| public     | daily_usage     | Anonymous users can update IP usage         | PERMISSIVE | {public} | UPDATE | ((ip_address IS NOT NULL) AND (user_id IS NULL))                                                                                                           | null                                                                                                                                                       |
| public     | daily_usage     | Anonymous users can view IP usage           | PERMISSIVE | {public} | SELECT | ((ip_address IS NOT NULL) AND (user_id IS NULL))                                                                                                           | null                                                                                                                                                       |
| public     | daily_usage     | Users can insert own usage                  | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | (user_id = auth.uid())                                                                                                                                     |
| public     | daily_usage     | Users can update own usage                  | PERMISSIVE | {public} | UPDATE | (user_id = auth.uid())                                                                                                                                     | null                                                                                                                                                       |
| public     | daily_usage     | Users can view own usage                    | PERMISSIVE | {public} | SELECT | (user_id = auth.uid())                                                                                                                                     | null                                                                                                                                                       |
| public     | profiles        | Users can insert own profile                | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | (auth.uid() = id)                                                                                                                                          |
| public     | profiles        | Users can update own profile                | PERMISSIVE | {public} | UPDATE | (auth.uid() = id)                                                                                                                                          | null                                                                                                                                                       |
| public     | profiles        | Users can view own profile                  | PERMISSIVE | {public} | SELECT | (auth.uid() = id)                                                                                                                                          | null                                                                                                                                                       |
| public     | questions       | Users can delete questions from own quizzes | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
   FROM quizzes
  WHERE ((quizzes.quiz_id = questions.quiz_id) AND (quizzes.user_id = auth.uid()))))                                    | null                                                                                                                                                       |
| public     | questions       | Users can insert questions to own quizzes   | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | (EXISTS ( SELECT 1
   FROM quizzes
  WHERE ((quizzes.quiz_id = questions.quiz_id) AND (quizzes.user_id = auth.uid()))))                                    |
| public     | questions       | Users can update questions in own quizzes   | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM quizzes
  WHERE ((quizzes.quiz_id = questions.quiz_id) AND (quizzes.user_id = auth.uid()))))                                    | null                                                                                                                                                       |
| public     | questions       | Users can view questions from own quizzes   | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM quizzes
  WHERE ((quizzes.quiz_id = questions.quiz_id) AND (quizzes.user_id = auth.uid()))))                                    | null                                                                                                                                                       |
| public     | quiz_usage      | Anonymous can insert IP usage               | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | ((ip_address IS NOT NULL) AND (user_id IS NULL))                                                                                                           |
| public     | quiz_usage      | Anonymous can view IP usage                 | PERMISSIVE | {public} | SELECT | ((ip_address IS NOT NULL) AND (user_id IS NULL))                                                                                                           | null                                                                                                                                                       |
| public     | quiz_usage      | Service role full access                    | PERMISSIVE | {public} | ALL    | (auth.role() = 'service_role'::text)                                                                                                                       | null                                                                                                                                                       |
| public     | quiz_usage      | Users can insert own usage                  | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | ((user_id = auth.uid()) OR (user_id IS NULL))                                                                                                              |
| public     | quiz_usage      | Users can view own usage                    | PERMISSIVE | {public} | SELECT | (user_id = auth.uid())                                                                                                                                     | null                                                                                                                                                       |
| public     | quizzes         | Users can delete own quizzes                | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                                                                                                                                     | null                                                                                                                                                       |
| public     | quizzes         | Users can insert own quizzes                | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | (auth.uid() = user_id)                                                                                                                                     |
| public     | quizzes         | Users can update own quizzes                | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                                                                                                                                     | null                                                                                                                                                       |
| public     | quizzes         | Users can view own quizzes                  | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                                                                                                                                     | null                                                                                                                                                       |
| public     | review_sessions | Users can delete own review sessions        | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                                                                                                                                     | null                                                                                                                                                       |
| public     | review_sessions | Users can insert own review sessions        | PERMISSIVE | {public} | INSERT | null                                                                                                                                                       | (auth.uid() = user_id)                                                                                                                                     |
| public     | review_sessions | Users can update own review sessions        | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id)                                                                                                                                     | null                                                                                                                                                       |
| public     | review_sessions | Users can view own review sessions          | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                                                                                                                                     | null                                                                                                                                                       |
| public     | user_limits     | Service role can manage limits              | PERMISSIVE | {public} | ALL    | (auth.role() = 'service_role'::text)                                                                                                                       | null                                                                                                                                                       |
| public     | user_limits     | Users can view own limits                   | PERMISSIVE | {public} | SELECT | (user_id = auth.uid())                                                                                                                                     | null                                                                                                                                                       |
```

---

#### Query 4B: RLS Enabled Status
```sql
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**📋 PASTE RESULTS HERE:**
```
| schemaname | tablename       | rowsecurity |
| ---------- | --------------- | ----------- |
| public     | answer_records  | true        |
| public     | daily_usage     | true        |
| public     | profiles        | true        |
| public     | questions       | true        |
| public     | quiz_usage      | true        |
| public     | quizzes         | true        |
| public     | review_sessions | true        |
| public     | user_limits     | true        |
```

---

### 1.5 Functions and Triggers Analysis

#### Query 5A: Functions/Procedures
```sql
SELECT
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**📋 PASTE RESULTS HERE:**
```
| routine_name             | routine_type | data_type | routine_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| can_generate_quiz        | FUNCTION     | record    | 
DECLARE
  v_usage INTEGER := 0;
  v_limit INTEGER := 5;
  v_unlimited BOOLEAN := FALSE;
BEGIN
  -- Get user's limit
  SELECT ul.daily_limit, ul.is_unlimited
  INTO v_limit, v_unlimited
  FROM user_limits ul
  WHERE ul.user_id = p_user_id
    AND (ul.expires_at IS NULL OR ul.expires_at > NOW());

  -- If no custom limit found, use default
  v_limit := COALESCE(v_limit, 5);
  v_unlimited := COALESCE(v_unlimited, FALSE);

  -- Get today's usage
  SELECT COALESCE(du.quiz_count, 0)
  INTO v_usage
  FROM daily_usage du
  WHERE du.user_id = p_user_id
    AND du.generated_date = CURRENT_DATE;

  v_usage := COALESCE(v_usage, 0);

  -- Return results
  RETURN QUERY
  SELECT
    v_unlimited OR v_usage < v_limit as allowed,
    v_usage as current_usage,
    v_limit as daily_limit,
    v_unlimited as is_unlimited,
    CASE
      WHEN v_unlimited THEN -1
      ELSE GREATEST(0, v_limit - v_usage)
    END as remaining_quizzes;
END;
 |
| get_user_daily_limit     | FUNCTION     | record    | 
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ul.daily_limit, 5) as daily_limit,
    COALESCE(ul.is_unlimited, FALSE) as is_unlimited,
    COALESCE(ul.reason, 'default') as limit_type
  FROM profiles p
  LEFT JOIN user_limits ul ON ul.user_id = p.id
    AND (ul.expires_at IS NULL OR ul.expires_at > NOW())
  WHERE p.id = p_user_id;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| handle_new_user          | FUNCTION     | trigger   | 
BEGIN
    INSERT INTO public.profiles (id, email, full_name, institution, program)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'institution',
        NEW.raw_user_meta_data->>'program'
    );
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| handle_updated_at        | FUNCTION     | trigger   | 
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| increment_quiz_count     | FUNCTION     | void      | 
BEGIN
  -- Single upsert operation to avoid race conditions
  INSERT INTO daily_usage (user_id, generated_date, quiz_count, created_at, updated_at)
  VALUES (p_user_id, p_date, 1, NOW(), NOW())
  ON CONFLICT (user_id, generated_date)
  DO UPDATE SET
    quiz_count = daily_usage.quiz_count + 1,
    updated_at = NOW();
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| increment_quiz_count_ip  | FUNCTION     | void      | 
BEGIN
  -- Insert or update usage record for IP address
  INSERT INTO daily_usage (ip_address, generated_date, quiz_count, created_at, updated_at)
  VALUES (p_ip_address, p_date, 1, NOW(), NOW())
  ON CONFLICT (ip_address, generated_date)
  DO UPDATE SET
    quiz_count = daily_usage.quiz_count + 1,
    updated_at = NOW();
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| update_updated_at_column | FUNCTION     | trigger   | 
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
```

---

#### Query 5B: Triggers
```sql
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**📋 PASTE RESULTS HERE:**
```
| trigger_name               | event_manipulation | event_object_table | action_timing | action_statement                            |
| -------------------------- | ------------------ | ------------------ | ------------- | ------------------------------------------- |
| set_updated_at             | UPDATE             | profiles           | BEFORE        | EXECUTE FUNCTION handle_updated_at()        |
| update_profiles_updated_at | UPDATE             | profiles           | BEFORE        | EXECUTE FUNCTION update_updated_at_column() |
| update_quizzes_updated_at  | UPDATE             | quizzes            | BEFORE        | EXECUTE FUNCTION update_updated_at_column() |
```

---

### 1.6 Data Statistics

#### Query 6A: Table Activity Statistics
```sql
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

**📋 PASTE RESULTS HERE:**
```
I had an error with this query:
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

Error:
Error: Failed to run sql query: ERROR: 42703: column "tablename" does not exist LINE 3: tablename, ^

Note: A limit of 100 was applied to your query. If this was the cause of a syntax error, try selecting "No limit" instead and re-run the query.

I modified the query with:
SELECT
  schemaname,
  relname AS tablename,
  n_tup_ins  AS inserts,
  n_tup_upd  AS updates,
  n_tup_del  AS deletes,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

I had this result:
| schemaname | tablename       | inserts | updates | deletes | live_rows | dead_rows |
| ---------- | --------------- | ------- | ------- | ------- | --------- | --------- |
| public     | questions       | 3110    | 1       | 2650    | 394       | 77        |
| public     | quizzes         | 158     | 433     | 43      | 16        | 51        |
| public     | quiz_usage      | 15      | 0       | 0       | 15        | 0         |
| public     | answer_records  | 69      | 0       | 40      | 13        | 25        |
| public     | review_sessions | 28      | 7       | 4       | 13        | 9         |
| public     | daily_usage     | 3       | 13      | 0       | 3         | 13        |
| public     | profiles        | 17      | 0       | 18      | 2         | 9         |
| public     | user_limits     | 2       | 10      | 2       | 0         | 12        |
```

---

#### Query 6B: Table Size Information
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**📋 PASTE RESULTS HERE:**
```
| schemaname | tablename       | size   |
| ---------- | --------------- | ------ |
| public     | questions       | 360 kB |
| public     | quizzes         | 136 kB |
| public     | daily_usage     | 96 kB  |
| public     | review_sessions | 80 kB  |
| public     | quiz_usage      | 80 kB  |
| public     | user_limits     | 72 kB  |
| public     | answer_records  | 56 kB  |
| public     | profiles        | 32 kB  |
```

---

## 🗃️ SQLITE (BROWSER LOCAL STORAGE) RESULTS

### Instructions for SQLite Data Collection
Access browser console in your application and run these queries, or use the development tools to inspect the local SQLite database.

### SQLite Schema Queries

#### Query S1: List All Tables
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

**📋 PASTE RESULTS HERE:**
```
I had an error:
Uncaught SyntaxError: Unexpected identifier 'name'
```

---

#### Query S2: Table Schema Information
```sql
SELECT
    name,
    sql
FROM sqlite_master
WHERE type='table'
ORDER BY name;
```

**📋 PASTE RESULTS HERE:**
```
I had an error:
Uncaught SyntaxError: Unexpected identifier 'sqlite_master'
```

---

#### Query S3: Column Information for Each Table
For each table found, run:
```sql
PRAGMA table_info(table_name);
```

**📋 PASTE RESULTS HERE:**
```
I had an error:
Uncaught SyntaxError: Unexpected identifier 'table_info'

Table: quizzes
[PASTE PRAGMA table_info(quizzes) RESULTS HERE]

Table: questions
[PASTE PRAGMA table_info(questions) RESULTS HERE]

Table: review_sessions
[PASTE PRAGMA table_info(review_sessions) RESULTS HERE]

Table: answer_records
[PASTE PRAGMA table_info(answer_records) RESULTS HERE]

[ADD OTHER TABLES AS NEEDED]
```

---

#### Query S4: Index Information
```sql
SELECT
    name,
    sql
FROM sqlite_master
WHERE type='index'
ORDER BY name;
```

**📋 PASTE RESULTS HERE:**
```
I had an error:
Uncaught SyntaxError: Unexpected identifier 'sqlite_master'
```

---

#### Query S5: Row Counts
For each table:
```sql
SELECT COUNT(*) as row_count FROM table_name;
```

**📋 PASTE RESULTS HERE:**
```
quizzes: [PASTE COUNT HERE]
questions: [PASTE COUNT HERE]
review_sessions: [PASTE COUNT HERE]
answer_records: [PASTE COUNT HERE]
[ADD OTHER TABLES AS NEEDED]
```

---

## 🔍 ANALYSIS NOTES

### Observations During Data Collection
*Add any notes, errors, or observations here while collecting the data*

**PostgreSQL Notes:**
```
[ADD OBSERVATIONS HERE]
```

**SQLite Notes:**
```
[ADD OBSERVATIONS HERE]
```

---

### Issues Encountered
```
1. For SQLite, I had errors and did not understand what to do. Let's skip those for now and focus on main DB 
2. I had errors with some of the queries and modified accordingly.
```

---

### Questions for Analysis
```
- No questions
```

---

## ✅ COMPLETION CHECKLIST

**PostgreSQL Queries:**
- [x] Query 1A - Basic Table Information
- [x] Query 1B - Detailed Table Information
- [x] Query 2A - Column Data Types
- [x] Query 2B - Constraints and Foreign Keys
- [x] Query 3A - All Indexes
- [x] Query 3B - Index Usage Statistics
- [x] Query 4A - RLS Policies
- [x] Query 4B - RLS Enabled Status
- [x] Query 5A - Functions/Procedures
- [x] Query 5B - Triggers
- [x] Query 6A - Table Activity Statistics
- [x] Query 6B - Table Size Information

**SQLite Queries:**
- [ ] Query S1 - List All Tables
- [ ] Query S2 - Table Schema Information
- [ ] Query S3 - Column Information (all tables)
- [ ] Query S4 - Index Information
- [ ] Query S5 - Row Counts

---

**Ready for Phase 2**: Once all results are pasted above, I'll analyze the data and proceed to Phase 2 (Documentation Comparison).