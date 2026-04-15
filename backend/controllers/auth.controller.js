/**
 * Auth Controller
 * Handles user authentication and registration
 */

const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateTokens, refreshAccessToken } = require('../middleware/auth.middleware');
const { sendSuccess, sendError, HttpStatus } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password, role, branch, year, registerNumber, employeeId } = req.body;

  // Default role to STUDENT for public registration while
  // still allowing explicit TEACHER creation via internal tools.
  const userRole = role || 'STUDENT';

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email and password are required');
  }

  // Check if email exists
  if (await User.emailExists(email)) {
    throw ApiError.conflict('Email already registered');
  }

  // Check register number for students
  if (userRole === 'STUDENT' && registerNumber) {
    if (await User.registerNumberExists(registerNumber)) {
      throw ApiError.conflict('Register number already exists');
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user (students will have branch/register_number, teachers may not)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: userRole,
    branch: userRole === 'STUDENT' ? branch : null,
    year: userRole === 'STUDENT' ? year : null,
    registerNumber: userRole === 'STUDENT' ? registerNumber : null,
    employeeId: userRole === 'TEACHER' ? employeeId : null,
  });

  // Generate tokens
  const tokens = generateTokens(user);

  logger.info('New user registered', { email, role });

  sendSuccess(res, HttpStatus.CREATED, 'Registration successful', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      year: user.year,
      profileCompleted: user.profile_completed || (!!user.branch && !!user.year),
    },
    ...tokens,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // If a role is provided (e.g. from separate student/teacher forms),
  // ensure that the account's role matches what the client expects.
  // This prevents logging in a TEACHER account via the student form
  // (or vice versa) and keeps the UX consistent.
  if (role && user.role !== role) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw ApiError.unauthorized('Account is deactivated');
  }

  // Check password
  if (!user.password) {
    throw ApiError.unauthorized('Please login with Google');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens(user);

  logger.info('User logged in', { email, role: user.role });

  sendSuccess(res, HttpStatus.OK, 'Login successful', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      year: user.year,
      profileCompleted: user.profile_completed || (!!user.branch && !!user.year),
    },
    ...tokens,
  });
});

/**
 * Google OAuth login/register
 * POST /api/auth/google
 */
const googleAuth = catchAsync(async (req, res) => {
  const { googleId, email, name } = req.body;

  if (!googleId || !email) {
    throw ApiError.badRequest('Google ID and email are required');
  }

  // Check if user exists with Google ID
  let user = await User.findByGoogleId(googleId);

  if (!user) {
    // Check if email exists
    user = await User.findByEmail(email);

    if (user) {
      // Link Google ID to existing account
      await User.update(user.id, { googleId });
    } else {
      // Create new student account
      user = await User.create({
        name,
        email,
        googleId,
        role: 'STUDENT',
      });

      logger.info('New student registered via Google', { email });
    }
  }

  if (!user.is_active) {
    throw ApiError.unauthorized('Account is deactivated');
  }

  // Generate tokens
  const tokens = generateTokens(user);

  sendSuccess(res, HttpStatus.OK, 'Login successful', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      year: user.year,
      profileCompleted: user.profile_completed || (!!user.branch && !!user.year),
    },
    ...tokens,
  });
});

/**
 * Complete student profile
 * PUT /api/auth/complete-profile
 */
const completeProfile = catchAsync(async (req, res) => {
  const { name, branch, year, registerNumber } = req.body;

  // Check register number
  const currentUser = await User.findById(req.user.id);
  
  if (registerNumber !== currentUser.register_number) {
    if (await User.registerNumberExists(registerNumber)) {
      throw ApiError.conflict('Register number already exists');
    }
  }

  // Update profile
  const user = await User.completeProfile(req.user.id, {
    name,
    branch,
    year,
    registerNumber,
  });

  logger.info('Student profile completed', { userId: req.user.id });

  sendSuccess(res, HttpStatus.OK, 'Profile completed successfully', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      year: user.year,
      registerNumber: user.register_number,
      profileCompleted: user.profile_completed || (!!user.branch && !!user.year),
    },
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw ApiError.badRequest('Refresh token is required');
  }

  const { accessToken } = await refreshAccessToken(token);

  sendSuccess(res, HttpStatus.OK, 'Token refreshed', { accessToken });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  sendSuccess(res, HttpStatus.OK, 'Profile retrieved', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      year: user.year,
      registerNumber: user.register_number,
      employeeId: user.employee_id,
      profileCompleted: user.profile_completed || (!!user.branch && !!user.year),
      createdAt: user.created_at,
    },
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  // In a real implementation, you might blacklist the token
  // For now, just return success (client should delete token)
  sendSuccess(res, HttpStatus.OK, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  googleAuth,
  completeProfile,
  refreshToken,
  getMe,
  logout,
};
