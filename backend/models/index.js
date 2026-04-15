/**
 * Models Index
 * Export all models from a single entry point
 */

const User = require('./User');
const Exam = require('./Exam');
const Question = require('./Question');
const Attempt = require('./Attempt');
const Answer = require('./Answer');
const StudentMaster = require('./StudentMaster');
const TeacherInvitation = require('./TeacherInvitation');

module.exports = {
  User,
  Exam,
  Question,
  Attempt,
  Answer,
  StudentMaster,
  TeacherInvitation,
};
