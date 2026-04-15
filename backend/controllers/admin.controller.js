/**
 * Admin Controller
 * Handles admin dashboard, student registry, teacher invites, and analytics
 */

const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { parse } = require('csv-parse/sync');

const db = require('../config/database');
const config = require('../config');
const User = require('../models/User');
const StudentMaster = require('../models/StudentMaster');
const TeacherInvitation = require('../models/TeacherInvitation');
const { sendSuccess, HttpStatus } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { deleteFile } = require('../middleware/upload.middleware');
const { mailService } = require('../services');

const normalizeCsvRecord = (record) => {
  const normalized = {};

  for (const [key, value] of Object.entries(record)) {
    normalized[key.trim().toLowerCase()] = String(value || '').trim();
  }

  return {
    registration_number: (normalized.registration_number || '').toUpperCase(),
    name: normalized.name || '',
    branch: (normalized.branch || '').toUpperCase(),
    department: normalized.department || '',
  };
};

const getDashboardStats = catchAsync(async (req, res) => {
  const [studentCountResult, teacherCountResult, examCountResult, publishedExamResult] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS count FROM students_master'),
    db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'TEACHER' AND is_active = true"),
    db.query('SELECT COUNT(*)::int AS count FROM exams'),
    db.query("SELECT COUNT(*)::int AS count FROM exams WHERE status = 'PUBLISHED'"),
  ]);

  sendSuccess(res, HttpStatus.OK, 'Dashboard stats retrieved', {
    totalStudents: studentCountResult.rows[0].count,
    totalTeachers: teacherCountResult.rows[0].count,
    totalExams: examCountResult.rows[0].count,
    totalPublishedExams: publishedExamResult.rows[0].count,
  });
});

const getStudents = catchAsync(async (req, res) => {
  const search = (req.query.search || '').toString().trim();
  const students = await StudentMaster.findAll(search);

  sendSuccess(res, HttpStatus.OK, 'Students retrieved successfully', {
    students,
    total: students.length,
  });
});

const uploadStudentsCsv = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('CSV file is required');
  }

  try {
    const csvContent = fs.readFileSync(req.file.path, 'utf8');

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(records) || records.length === 0) {
      throw ApiError.badRequest('CSV file is empty');
    }

    const uniqueRows = new Map();

    records.forEach((record, index) => {
      const row = normalizeCsvRecord(record);
      const lineNo = index + 2;

      if (!row.registration_number || !row.name || !row.branch || !row.department) {
        throw ApiError.badRequest(
          `Invalid CSV format at line ${lineNo}. Required columns: registration_number, name, branch, department`
        );
      }

      uniqueRows.set(row.registration_number, row);
    });

    const result = await StudentMaster.upsertMany(Array.from(uniqueRows.values()));

    logger.info('Student CSV processed', {
      adminId: req.user.id,
      totalProcessed: result.totalProcessed,
      insertedCount: result.insertedCount,
      updatedCount: result.updatedCount,
    });

    sendSuccess(res, HttpStatus.OK, 'Student CSV uploaded successfully', result);
  } finally {
    deleteFile(req.file.path);
  }
});

const updateStudent = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const existingStudent = await StudentMaster.findById(studentId);
  if (!existingStudent) {
    throw ApiError.notFound('Student record not found');
  }

  const updateData = {
    registrationNumber: req.body.registrationNumber,
    name: req.body.name,
    branch: req.body.branch,
    department: req.body.department,
  };

  const updatedStudent = await StudentMaster.updateById(studentId, updateData);

  if (!updatedStudent) {
    throw ApiError.internal('Failed to update student record');
  }

  sendSuccess(res, HttpStatus.OK, 'Student updated successfully', { student: updatedStudent });
});

const deleteStudent = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const deleted = await StudentMaster.deleteById(studentId);
  if (!deleted) {
    throw ApiError.notFound('Student record not found');
  }

  sendSuccess(res, HttpStatus.OK, 'Student deleted successfully');
});

const inviteTeacher = catchAsync(async (req, res) => {
  const { name, email } = req.body;

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresInDays = config?.invites?.teacherInviteExpiresDays || 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invitation = await TeacherInvitation.createOrUpdatePending({
    name,
    email,
    token,
    expiresAt,
    invitedBy: req.user.id,
  });

  const inviteLink = `${config.frontendUrl}/teacher/setup-password?token=${token}`;
  const { delivered } = await mailService.sendTeacherInvite({
    to: email,
    name,
    inviteLink,
    expiresAt,
  });

  logger.info('Teacher invited', {
    adminId: req.user.id,
    teacherEmail: email,
    delivered,
  });

  sendSuccess(res, HttpStatus.CREATED, 'Teacher invitation sent successfully', {
    invitation: {
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    },
    inviteLink,
    emailDelivered: delivered,
  });
});

const getTeacherInvitations = catchAsync(async (req, res) => {
  await TeacherInvitation.expireOldInvitations();
  const invitations = await TeacherInvitation.listAll();

  sendSuccess(res, HttpStatus.OK, 'Teacher invitations retrieved successfully', {
    invitations,
  });
});

const getTeacherInviteDetails = catchAsync(async (req, res) => {
  const token = (req.query.token || '').toString().trim();

  if (!token) {
    throw ApiError.badRequest('Invitation token is required');
  }

  await TeacherInvitation.expireOldInvitations();

  const invitation = await TeacherInvitation.findByToken(token);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  if (invitation.status !== 'PENDING') {
    throw ApiError.badRequest(`Invitation is ${invitation.status.toLowerCase()}`);
  }

  sendSuccess(res, HttpStatus.OK, 'Invitation details retrieved', {
    name: invitation.name,
    email: invitation.email,
    expiresAt: invitation.expires_at,
  });
});

const completeTeacherInvite = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  await TeacherInvitation.expireOldInvitations();

  const invitation = await TeacherInvitation.findByToken(token);

  if (!invitation) {
    throw ApiError.badRequest('Invalid invitation token');
  }

  if (invitation.status !== 'PENDING') {
    throw ApiError.badRequest(`Invitation is ${invitation.status.toLowerCase()}`);
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    throw ApiError.badRequest('Invitation has expired');
  }

  const existingUser = await User.findByEmail(invitation.email);
  if (existingUser) {
    throw ApiError.conflict('Teacher account is already created for this email');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const teacher = await User.create({
    name: invitation.name,
    email: invitation.email,
    password: hashedPassword,
    role: 'TEACHER',
  });

  await TeacherInvitation.markAccepted(invitation.id, teacher.id);

  logger.info('Teacher invitation completed', {
    invitationId: invitation.id,
    teacherId: teacher.id,
  });

  sendSuccess(res, HttpStatus.CREATED, 'Teacher account created successfully', {
    user: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
    },
  });
});

const getAnalytics = catchAsync(async (req, res) => {
  const [
    studentCountResult,
    teacherCountResult,
    examCountResult,
    attemptSummaryResult,
    examsPerBranchResult,
    studentsPerDepartmentResult,
    passFailResult,
  ] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS total_students FROM students_master'),
    db.query("SELECT COUNT(*)::int AS total_teachers FROM users WHERE role = 'TEACHER' AND is_active = true"),
    db.query('SELECT COUNT(*)::int AS total_exams FROM exams'),
    db.query(
      `SELECT COUNT(*)::int AS total_attempts,
              COALESCE(AVG(percentage), 0)::numeric(10,2) AS average_score
       FROM attempts
       WHERE status = 'SUBMITTED'`
    ),
    db.query(
      `SELECT branch, COUNT(*)::int AS count
       FROM exams
       GROUP BY branch
       ORDER BY branch ASC`
    ),
    db.query(
      `SELECT department, COUNT(*)::int AS count
       FROM students_master
       GROUP BY department
       ORDER BY department ASC`
    ),
    db.query(
      `SELECT
          COALESCE(SUM(CASE WHEN a.percentage >= e.pass_percentage THEN 1 ELSE 0 END), 0)::int AS pass_count,
          COALESCE(SUM(CASE WHEN a.percentage < e.pass_percentage THEN 1 ELSE 0 END), 0)::int AS fail_count
       FROM attempts a
       JOIN exams e ON e.id = a.exam_id
       WHERE a.status = 'SUBMITTED'`
    ),
  ]);

  sendSuccess(res, HttpStatus.OK, 'Platform analytics retrieved successfully', {
    totalRegisteredStudents: studentCountResult.rows[0].total_students,
    totalTeachers: teacherCountResult.rows[0].total_teachers,
    totalExamsCreated: examCountResult.rows[0].total_exams,
    totalAttempts: attemptSummaryResult.rows[0].total_attempts,
    averageScore: Number(attemptSummaryResult.rows[0].average_score),
    examsPerBranch: examsPerBranchResult.rows,
    studentsPerDepartment: studentsPerDepartmentResult.rows,
    passFailRatio: {
      pass: passFailResult.rows[0].pass_count,
      fail: passFailResult.rows[0].fail_count,
    },
  });
});

module.exports = {
  getDashboardStats,
  getStudents,
  uploadStudentsCsv,
  updateStudent,
  deleteStudent,
  inviteTeacher,
  getTeacherInvitations,
  getTeacherInviteDetails,
  completeTeacherInvite,
  getAnalytics,
};
