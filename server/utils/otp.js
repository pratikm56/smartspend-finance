const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configured nodemailer transporter (SMTP / Gmail / Brevo / SendGrid / Resend)
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE; // e.g. 'gmail'

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass }
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return null;
}

// Dispatch real-time HTML email with the OTP code
async function sendOTPEmail(email, otp, purpose) {
  const transporter = getMailTransporter();
  const purposeTitle = purpose === 'RESET_PASSWORD' ? 'Password Reset Verification' : 'Verify Your Email Address';
  const fromName = process.env.SMTP_FROM || '"SmartSpend AI" <no-reply@smartspend.io>';

  if (!transporter) {
    console.log(`\n[Realtime OTP Notice] No SMTP configured in .env. Falling back to local console.`);
    console.log(`To enable realtime email delivery, set SMTP_USER and SMTP_PASS (e.g. Gmail App Password) in .env.`);
    return { sent: false, reason: 'NO_SMTP_CONFIG' };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 480px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 20px; font-weight: bold; color: #818cf8; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px; }
        .otp-box { background: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #a5b4fc; }
        .expiry { font-size: 12px; color: #6b7280; text-align: center; margin-top: 8px; }
        .footer { font-size: 11px; color: #4b5563; text-align: center; border-top: 1px solid #1f2937; padding-top: 18px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">✨ SmartSpend AI</div>
        <div class="title">${purposeTitle}</div>
        <p class="text">
          Use the secure 6-digit code below to complete your ${purpose === 'RESET_PASSWORD' ? 'password reset' : 'account verification'}.
        </p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">This code will expire in 10 minutes.</div>
        </div>
        <p class="text" style="font-size: 12px;">
          If you did not request this verification code, you can safely ignore this email. No changes have been made to your account.
        </p>
        <div class="footer">
          SmartSpend Personal Finance & Spending Analytics • Automated Security Notification
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const emailSubject = purpose === 'RESET_PASSWORD'
      ? `[SmartSpend] ${otp} is your password reset code`
      : `[SmartSpend] ${otp} is your verification code`;

    const info = await transporter.sendMail({
      from: fromName,
      to: email,
      subject: emailSubject,
      html: htmlContent
    });
    console.log(`[SmartSpend Realtime Email] Dispatched OTP ${otp} to ${email} (MessageID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (mailErr) {
    console.error(`[SmartSpend Realtime Email Error] Failed to send email to ${email}:`, mailErr.message);
    return { sent: false, error: mailErr.message };
  }
}

function saveOTP(email, purpose, validityMinutes = 10) {
  // Remove existing OTPs for same email & purpose
  db.prepare('DELETE FROM otps WHERE email = ? AND purpose = ?').run(email, purpose);

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO otps (email, otp, purpose, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(email, otp, purpose, expiresAt);

  console.log(`\n========================================`);
  console.log(`[SmartSpend OTP Dispatch]`);
  console.log(`Recipient: ${email}`);
  console.log(`Purpose:   ${purpose}`);
  console.log(`OTP Code:  ${otp}`);
  console.log(`Expires:   ${expiresAt}`);
  console.log(`========================================\n`);

  return { otp, expiresAt };
}

function verifyOTP(email, otp, purpose) {
  const record = db.prepare(`
    SELECT * FROM otps 
    WHERE email = ? AND otp = ? AND purpose = ?
    ORDER BY id DESC LIMIT 1
  `).get(email, otp.trim(), purpose);

  if (!record) {
    return { valid: false, error: 'Invalid OTP code. Please check and try again.' };
  }

  const now = new Date();
  const expiry = new Date(record.expires_at);

  if (now > expiry) {
    db.prepare('DELETE FROM otps WHERE id = ?').run(record.id);
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Delete used OTP
  db.prepare('DELETE FROM otps WHERE id = ?').run(record.id);
  return { valid: true };
}

module.exports = {
  generateOTP,
  saveOTP,
  sendOTPEmail,
  verifyOTP
};
