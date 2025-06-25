const { Pool } = require('pg');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.init();
  }

  async init() {
    try {
      // Check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[YOUR-')) {
        logger.warn('Database not configured. Please set up Supabase and update your .env file.');
        logger.warn('See supabase-setup.md for detailed instructions.');
        
        // Create a mock pool for development without throwing errors
        this.pool = {
          query: async (text, params) => {
            logger.debug('Mock query (DB not configured):', text.substring(0, 50) + '...');
            return { rows: [], rowCount: 0 };
          },
          connect: async () => ({
            query: async () => ({ rows: [], rowCount: 0 }),
            release: () => {}
          }),
          end: async () => {},
          totalCount: 0,
          idleCount: 0,
          waitingCount: 0
        };
        return;
      }

      // Configure connection for Supabase
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20, // Maximum number of clients in pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
        connectionTimeoutMillis: 10000, // How long to wait for a connection (increased for remote DB)
        ssl: {
          rejectUnauthorized: false // Required for Supabase
        }
      });

      // Test the connection
      const result = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');
      logger.info('Supabase database connected successfully');
      logger.info(`PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err);
      });

    } catch (error) {
      logger.error('Database connection failed:', error);
      logger.error('Please check your Supabase configuration in .env file');
      logger.error('See supabase-setup.md for setup instructions');
      throw error;
    }
  }

  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('Database query error:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        params: params
      });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }

  // Helper method to check if a table exists
  async tableExists(tableName) {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    const result = await this.query(query, [tableName]);
    return result.rows[0].exists;
  }

  // Helper method to get table info
  async getTableInfo(tableName) {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    const result = await this.query(query, [tableName]);
    return result.rows;
  }

  // Health check method
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as healthy');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;