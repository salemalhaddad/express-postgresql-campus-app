#!/usr/bin/env node

require('dotenv').config();

const database = require('../config/database');
const logger = require('../utils/logger');

async function testDatabase() {
  try {
    console.log('Testing Supabase database connection...\n');
    
    // Test basic connection
    const timeResult = await database.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    
    if (timeResult.rows && timeResult.rows.length > 0 && timeResult.rows[0].current_time) {
      console.log(`   Current time: ${timeResult.rows[0].current_time}`);
    } else {
      console.log('   ⚠️  Time query returned empty result (using mock database)');
    }
    
    // Test database version
    const versionResult = await database.query('SELECT version() as pg_version');
    if (versionResult.rows && versionResult.rows.length > 0 && versionResult.rows[0].pg_version) {
      console.log(`   PostgreSQL version: ${versionResult.rows[0].pg_version.split(' ')[0]}`);
    } else {
      console.log('   ⚠️  Version query returned empty result (using mock database)');
    }
    
    // Test if our tables exist
    const tablesResult = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found. You may need to run the database schema.');
      console.log('   👉 See supabase-setup.md for instructions.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Test a simple query on users table if it exists
    try {
      const userCount = await database.query('SELECT COUNT(*) as count FROM users');
      if (userCount.rows && userCount.rows.length > 0 && userCount.rows[0].count !== undefined) {
        console.log(`\n👥 Users in database: ${userCount.rows[0].count}`);
      } else {
        console.log('\n⚠️  Users table query returned empty result (using mock database)');
      }
    } catch (error) {
      console.log('\n⚠️  Users table not accessible (this is normal if schema not yet created)');
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('connection')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Check your DATABASE_URL in .env file');
      console.log('   2. Verify your Supabase project is running');
      console.log('   3. Confirm your database password is correct');
      console.log('   4. See supabase-setup.md for detailed setup instructions');
    }
    
    process.exit(1);
  } finally {
    await database.close();
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled rejection:', error.message);
  process.exit(1);
});

// Run the test
testDatabase();