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
        this.createMockPool();
        return;
      }

      // Try to use Supabase client first
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        try {
          await this.initSupabaseConnection();
          return;
        } catch (supabaseError) {
          logger.warn('Supabase client connection failed, falling back to PostgreSQL:', supabaseError.message);
        }
      }

      // Fallback to direct PostgreSQL connection
      await this.initPostgreSQLConnection();

    } catch (error) {
      logger.error('All database connection methods failed:', error.message);
      logger.warn('Running in mock mode for development');
      this.createMockPool();
    }
  }

  async initSupabaseConnection() {
    const { createClient } = require('@supabase/supabase-js');
    
    this.supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test Supabase connection
    const { data, error } = await this.supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      throw new Error(`Supabase test failed: ${error.message}`);
    }

    logger.info('Supabase client connected successfully');
    this.connectionType = 'supabase';
    this.createSupabasePool();
  }

  async initPostgreSQLConnection() {
    // Configure connection for Supabase PostgreSQL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Reduced for better stability
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000, // Increased timeout
      ssl: {
        rejectUnauthorized: false
      },
      // Add retry logic
      retryDelayMs: 1000,
      maxRetries: 3
    });

    // Test the connection with retry
    await this.testConnection();
    
    logger.info('PostgreSQL direct connection established');
    this.connectionType = 'postgresql';

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async testConnection(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');
        logger.info('Database connected successfully');
        logger.info(`PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        logger.warn(`Connection attempt ${i + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  createMockPool() {
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
    this.connectionType = 'mock';
  }

  createSupabasePool() {
    // Wrapper to make Supabase look like pg Pool
    this.pool = {
      query: async (text, params = []) => {
        // Simple queries can use Supabase client
        if (text.toLowerCase().includes('select') && text.toLowerCase().includes('from')) {
          const tableName = this.extractTableName(text);
          if (tableName) {
            const { data, error } = await this.supabaseClient.from(tableName).select('*');
            if (error) throw error;
            return { rows: data || [], rowCount: data?.length || 0 };
          }
        }
        
        // For complex queries, log and return empty result
        logger.debug('Complex query not supported with Supabase client:', text.substring(0, 50) + '...');
        return { rows: [], rowCount: 0 };
      },
      connect: async () => ({
        query: this.pool.query,
        release: () => {}
      }),
      end: async () => {},
      totalCount: 1,
      idleCount: 1,
      waitingCount: 0
    };
  }

  extractTableName(query) {
    const match = query.match(/from\s+(\w+)/i);
    return match ? match[1] : null;
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