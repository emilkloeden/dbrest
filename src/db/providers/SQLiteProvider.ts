import Database from 'better-sqlite3';
import { DatabaseProvider } from './DatabaseProvider';

export class SQLiteProvider implements DatabaseProvider {
  private db: Database.Database;

  constructor(private connectionString: string) {
    this.db = new Database(connectionString);
  }

  async connect(): Promise<void> {
    // Connection is established in constructor for SQLite
  }

  async disconnect(): Promise<void> {
    this.db.close();
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }
}