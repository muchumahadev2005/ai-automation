/**
 * Password Reset OTP Migration Script
 * Adds student and teacher password reset OTP tables
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'exam_automation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

async function runMigration() {
  console.log('🔄 Running Password Reset OTP Migration...');
  console.log(`📦 Connecting to database: ${config.database}@${config.host}:${config.port}`);

  const pool = new Pool(config);

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'migratePasswordResetOTP.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');

    // Execute migration
    await pool.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Created/Updated:');
    console.log('   - student_password_reset_otp table');
    console.log('   - teacher_password_reset_otp table');
    console.log('   - Indexes for email, verified, and expires_at columns');
    console.log('');
    console.log('🎉 Password Reset OTP migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
