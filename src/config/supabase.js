const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseClient {
  constructor() {
    this.client = null;
    this.pgClient = null;
    this.init();
  }

  async init() {
    try {
      // Check if Supabase is configured
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        logger.warn('Supabase not configured. Please update your .env file.');
        this.createMockClient();
        return;
      }

      // Create Supabase client
      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Test the connection
      const { data, error } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        throw error;
      }

      logger.info('Supabase client connected successfully');
      logger.info(`Connected to: ${process.env.SUPABASE_URL}`);

    } catch (error) {
      logger.error('Supabase connection failed:', error.message);
      logger.error('Please check your Supabase configuration in .env file');
      this.createMockClient();
    }
  }

  createMockClient() {
    logger.warn('Creating mock Supabase client for development');
    this.client = {
      from: (table) => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
        delete: () => ({ data: [], error: null }),
        upsert: () => ({ data: [], error: null })
      }),
      rpc: () => ({ data: null, error: null }),
      auth: {
        signUp: () => ({ data: null, error: null }),
        signIn: () => ({ data: null, error: null }),
        signOut: () => ({ error: null })
      }
    };
  }

  // Direct SQL query using Supabase RPC
  async query(sql, params = []) {
    try {
      if (!this.client || !this.client.rpc) {
        logger.debug('Mock query (Supabase not configured):', sql.substring(0, 50) + '...');
        return { data: [], error: null };
      }

      // For complex queries, we'll use Supabase RPC or direct SQL
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        params: params
      });

      if (error) {
        throw error;
      }

      return { rows: data || [], rowCount: data?.length || 0 };
    } catch (error) {
      logger.error('Supabase query error:', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        error: error.message,
        params: params
      });
      throw error;
    }
  }

  // Table operations using Supabase client
  table(tableName) {
    return this.client.from(tableName);
  }

  // Get Supabase client instance
  getClient() {
    return this.client;
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        throw error;
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connection: 'supabase'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        connection: 'supabase'
      };
    }
  }
}

// Create singleton instance
const supabaseClient = new SupabaseClient();

module.exports = supabaseClient;