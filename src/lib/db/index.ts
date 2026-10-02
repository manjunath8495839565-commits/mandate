import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  if (dbUrl.startsWith('file:')) {
    return path.resolve(process.cwd(), dbUrl.replace(/^file:/, ''));
  }
  return path.resolve(process.cwd(), dbUrl);
}

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Initialize schema
  const schemaPath = path.resolve(process.cwd(), 'src/lib/db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    dbInstance.exec(schemaSql);
  }

  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
