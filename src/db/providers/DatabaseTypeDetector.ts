import { DatabaseProvider } from './DatabaseProvider';

export function detectDatabaseType(connectionString: string): string {
  if (connectionString.endsWith('.db') || connectionString.startsWith('file:')) {
    return 'sqlite';
  }
  if (connectionString.includes('sqlserver') || 
      connectionString.includes('mssql') || 
      connectionString.includes('tcp:')) {
    return 'mssql';
  }
  throw new Error('Unsupported database type in connection string');
}

export function createDatabaseProvider(connectionString: string): DatabaseProvider {
  const type = detectDatabaseType(connectionString);
  switch(type) {
    case 'mssql': 
      const { MSSQLProvider } = require('./MSSQLProvider');
      return new MSSQLProvider(connectionString);
    case 'sqlite': 
      const { SQLiteProvider } = require('./SQLiteProvider');
      return new SQLiteProvider(connectionString);
    default: 
      throw new Error('Unsupported database type');
  }
}