/**
 * Mail Service
 * Sends outbound emails when SMTP is configured
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

const hasSmtpHost = Boolean(config.smtp.host);
const hasSmtpUser = Boolean(config.smtp.user);
const hasSmtpPass = Boolean(config.smtp.pass);
const smtpEnabled = Boolean(hasSmtpHost && hasSmtpUser && hasSmtpPass);

let transporter = null;
if (smtpEnabled) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  transporter
    .verify()
    .then(() => {
      logger.info('SMTP transporter verified');
    })
    .catch((error) => {
      logger.error('SMTP transporter verification failed', {
        message: error?.message,
      });
    });
} else {
  logger.info('SMTP not configured', {
    hasHost: hasSmtpHost,
    hasUser: hasSmtpUser,
    hasPass: hasSmtpPass,
  });
}

const sendTeacherInvite = async ({ to, name, inviteLink, expiresAt }) => {
  if (!smtpEnabled || !transporter) {
    logger.info('SMTP not configured, invite link generated only', { to, inviteLink });
    return { delivered: false };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Teacher Invitation</h2>
      <p>Hello ${name},</p>
      <p>You were invited to join the AI Exam Conducting Platform as a teacher.</p>
      <p>
        Click the link below to set your password and activate your account:
      </p>
      <p>
        <a href="${inviteLink}">${inviteLink}</a>
      </p>
      <p>This link expires on ${new Date(expiresAt).toLocaleString()}.</p>
      <p>If you did not expect this invitation, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: 'Teacher invitation - Set up your password',
      html,
    });
  } catch (error) {
    logger.error('Failed to send teacher invite email', {
      to,
      message: error?.message,
    });
    return { delivered: false };
  }

  return { delivered: true };
};

module.exports = {
  sendTeacherInvite,
};
