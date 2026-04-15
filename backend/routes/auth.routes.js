/**
 * Auth Routes
 * Handles authentication endpoints
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const {
  authenticate,
  handleValidation,
  registerRules,
  loginRules,
  completeProfileRules,
} = require('../middleware');

// Public routes (no rate limiting so login has no time lockout)
router.post('/register', registerRules, handleValidation, authController.register);
router.post('/login', loginRules, handleValidation, authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.put('/complete-profile', completeProfileRules, handleValidation, authController.completeProfile);
router.post('/logout', authController.logout);

module.exports = router;
