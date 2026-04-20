-- ================================================================
-- Student and Teacher Password Reset OTP Migration
-- Adds password reset OTP verification tables for both roles
-- ================================================================

-- 1. Create student password reset OTP table
CREATE TABLE IF NOT EXISTS student_password_reset_otp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create teacher password reset OTP table
CREATE TABLE IF NOT EXISTS teacher_password_reset_otp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for faster lookups on student table
CREATE INDEX IF NOT EXISTS idx_student_password_reset_otp_email ON student_password_reset_otp(email);
CREATE INDEX IF NOT EXISTS idx_student_password_reset_otp_verified ON student_password_reset_otp(verified);
CREATE INDEX IF NOT EXISTS idx_student_password_reset_otp_expires_at ON student_password_reset_otp(expires_at);

-- 4. Create indexes for faster lookups on teacher table
CREATE INDEX IF NOT EXISTS idx_teacher_password_reset_otp_email ON teacher_password_reset_otp(email);
CREATE INDEX IF NOT EXISTS idx_teacher_password_reset_otp_verified ON teacher_password_reset_otp(verified);
CREATE INDEX IF NOT EXISTS idx_teacher_password_reset_otp_expires_at ON teacher_password_reset_otp(expires_at);

-- 5. Add comments describing the tables
COMMENT ON TABLE student_password_reset_otp IS 'Stores OTP data for student password reset flow';
COMMENT ON COLUMN student_password_reset_otp.email IS 'Student email address';
COMMENT ON COLUMN student_password_reset_otp.otp IS '6-digit OTP sent via SMTP';
COMMENT ON COLUMN student_password_reset_otp.attempts IS 'Number of OTP verification attempts';
COMMENT ON COLUMN student_password_reset_otp.max_attempts IS 'Maximum allowed OTP verification attempts (5)';
COMMENT ON COLUMN student_password_reset_otp.expires_at IS 'OTP expiration timestamp (10 minutes from creation)';
COMMENT ON COLUMN student_password_reset_otp.verified IS 'Flag indicating whether OTP was successfully verified';

COMMENT ON TABLE teacher_password_reset_otp IS 'Stores OTP data for teacher password reset flow';
COMMENT ON COLUMN teacher_password_reset_otp.email IS 'Teacher email address';
COMMENT ON COLUMN teacher_password_reset_otp.otp IS '6-digit OTP sent via SMTP';
COMMENT ON COLUMN teacher_password_reset_otp.attempts IS 'Number of OTP verification attempts';
COMMENT ON COLUMN teacher_password_reset_otp.max_attempts IS 'Maximum allowed OTP verification attempts (5)';
COMMENT ON COLUMN teacher_password_reset_otp.expires_at IS 'OTP expiration timestamp (10 minutes from creation)';
COMMENT ON COLUMN teacher_password_reset_otp.verified IS 'Flag indicating whether OTP was successfully verified';
