/**
 * Teacher Authentication Service
 * Handles teacher forgot password with OTP verification
 */

import api from './api';

interface ForgotPasswordSendOTPResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expiresIn: number;
  };
}

interface ForgotPasswordVerifyResponse {
  success: boolean;
  message: string;
  data?: Record<string, never>;
}

const teacherAuthService = {
  /**
   * Send OTP for teacher forgot password
   * Checks if teacher account exists before sending OTP
   */
  async sendForgotPasswordOTP(email: string): Promise<ForgotPasswordSendOTPResponse> {
    try {
      const response = await api.post('/auth/teacher/forgot-password/send-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    }
  },

  /**
   * Verify OTP and reset teacher password
   */
  async verifyForgotPasswordOTPAndReset(
    email: string,
    otp: string,
    password: string,
    confirmPassword: string,
  ): Promise<ForgotPasswordVerifyResponse> {
    try {
      const response = await api.post('/auth/teacher/forgot-password/verify-otp-and-reset', {
        email,
        otp,
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    }
  },

  /**
   * Resend forgot-password OTP for teacher
   */
  async resendForgotPasswordOTP(email: string): Promise<ForgotPasswordSendOTPResponse> {
    try {
      const response = await api.post('/auth/teacher/forgot-password/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    }
  },
};

export default teacherAuthService;
