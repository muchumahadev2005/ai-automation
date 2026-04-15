/**
 * Teacher Routes
 * Handles teacher-specific result endpoints
 */

const express = require('express');
const router = express.Router();
const { resultController } = require('../controllers');
const {
  authenticate,
  teacherOnly,
  handleValidation,
  uuidParam,
} = require('../middleware');

// All routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

// Results
router.get('/results', resultController.getTeacherAllResults);
router.get('/exams/:examId/results', uuidParam('examId'), handleValidation, resultController.getExamResults);
router.get('/results/:attemptId', uuidParam('attemptId'), handleValidation, resultController.getResultDetails);

module.exports = router;
