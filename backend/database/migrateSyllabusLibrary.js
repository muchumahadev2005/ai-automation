/**
 * Non-destructive migration for syllabus library support.
 * Creates enum, table, indexes, and update trigger if missing.
 */

const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'exam_automation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

async function migrateSyllabusLibrary() {
  console.log('🔧 Starting syllabus library migration...');

  const pool = new Pool(config);

  try {
    await pool.query('BEGIN');

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'syllabus_upload_status') THEN
          CREATE TYPE syllabus_upload_status AS ENUM ('UPLOADED', 'PROCESSING', 'READY');
        END IF;
      END
      $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS syllabus_library (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subject VARCHAR(255) NOT NULL,
        branch VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL CHECK (year >= 1 AND year <= 8),
        file_path VARCHAR(500) NOT NULL,
        original_file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
        status syllabus_upload_status NOT NULL DEFAULT 'UPLOADED',
        uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_syllabus_branch ON syllabus_library(branch)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_syllabus_department ON syllabus_library(department)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_syllabus_year ON syllabus_library(year)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_syllabus_status ON syllabus_library(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_syllabus_uploaded_by ON syllabus_library(uploaded_by)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_syllabus_created_at ON syllabus_library(created_at DESC)');

    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_syllabus_library_updated_at'
        ) THEN
          CREATE TRIGGER update_syllabus_library_updated_at
          BEFORE UPDATE ON syllabus_library
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);

    await pool.query('COMMIT');

    console.log('✅ Syllabus library migration completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Syllabus library migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrateSyllabusLibrary();
