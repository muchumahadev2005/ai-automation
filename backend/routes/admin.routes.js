/**
 * Admin Routes
 * Handles admin dashboard, student/teacher management, and analytics
 */

const express = require('express');
const router = express.Router();
const { adminController } = require('../controllers');
const {
  authenticate,
  adminOnly,
  handleValidation,
  uuidParam,
  uploadCsv,
  adminUpdateStudentRules,
  teacherInviteRules,
  teacherInviteCompleteRules,
} = require('../middleware');

// Public teacher onboarding route (invite token)
router.get('/teachers/invite-details', adminController.getTeacherInviteDetails);
router.post(
  '/teachers/complete-invite',
  teacherInviteCompleteRules,
  handleValidation,
  adminController.completeTeacherInvite
);

// All routes below require admin auth
router.use(authenticate);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Student management
router.get('/students', adminController.getStudents);
router.post('/students/upload', uploadCsv, adminController.uploadStudentsCsv);
router.put(
  '/students/:studentId',
  uuidParam('studentId'),
  adminUpdateStudentRules,
  handleValidation,
  adminController.updateStudent
);
router.delete(
  '/students/:studentId',
  uuidParam('studentId'),
  handleValidation,
  adminController.deleteStudent
);

// Teacher management
router.get('/teachers', adminController.getTeacherInvitations);
router.post('/teachers/invite', teacherInviteRules, handleValidation, adminController.inviteTeacher);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
