import initSqlJs, { Database } from 'sql.js';
import { SCHEMA_SQL } from './schema';

const DB_NAME = 'quizme-db';

let dbInstance: Database | null = null;

/**
 * Initialize SQL.js and create/load database
 */
export async function initDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Initialize SQL.js
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem(DB_NAME);

    if (savedDb) {
      // Load existing database
      const uint8Array = new Uint8Array(
        JSON.parse(savedDb)
      );
      dbInstance = new SQL.Database(uint8Array);
      console.log('📁 Loaded existing database from localStorage');
    } else {
      // Create new database
      dbInstance = new SQL.Database();
      console.log('✨ Created new database');
    }

    // Run schema (CREATE TABLE IF NOT EXISTS ensures idempotency)
    dbInstance.run(SCHEMA_SQL);
    console.log('✅ Database schema initialized');

    // Save to localStorage
    saveDatabase(dbInstance);

    return dbInstance;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save database to localStorage
 */
export function saveDatabase(db: Database): void {
  try {
    const data = db.export();
    const buffer = JSON.stringify(Array.from(data));
    localStorage.setItem(DB_NAME, buffer);
    console.log('💾 Database saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save database:', error);
  }
}

/**
 * Get current database instance
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Execute a query and return results
 */
export function executeQuery<T = any>(
  db: Database,
  sql: string,
  params: any[] = []
): T[] {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as T);
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export function executeUpdate(
  db: Database,
  sql: string,
  params: any[] = []
): void {
  try {
    db.run(sql, params);
    saveDatabase(db);
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
}

/**
 * Clear all data (for testing/reset)
 */
export function clearDatabase(): void {
  localStorage.removeItem(DB_NAME);
  dbInstance = null;
  console.log('🗑️  Database cleared');
}
