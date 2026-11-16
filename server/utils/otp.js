const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configured nodemailer transporter (SMTP / Gmail / Brevo / SendGrid / Resend)
// Configured nodemailer transporter (SMTP / Gmail / Brevo / SendGrid / Resend)
function getMailTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  // Clean app password by removing any spaces (Google shows app passwords as 'xxxx xxxx xxxx xxxx')
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null;
  const service = process.env.SMTP_SERVICE ? process.env.SMTP_SERVICE.trim() : null;

  if (!user || !pass) {
    return null;
  }

  const timeoutOptions = {
    connectionTimeout: 5000, // 5s timeout to prevent hanging on cloud firewalls
    greetingTimeout: 5000,
    socketTimeout: 5000
  };

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
      ...timeoutOptions
    });
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      ...timeoutOptions
    });
  }

  // Default to Gmail if email address ends in @gmail.com or no host was provided
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    ...timeoutOptions
  });
}

// Dispatch via Brevo HTTP API (Port 443 HTTPS - bypasses cloud SMTP port blocking)
async function sendViaBrevo(apiKey, fromEmail, toEmail, subject, htmlContent) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'SmartSpend AI', email: fromEmail },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: htmlContent
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API Error (${res.status}): ${errText}`);
  }
  return await res.json();
}

// Dispatch via Resend HTTP API (Port 443 HTTPS - bypasses cloud SMTP port blocking)
async function sendViaResend(apiKey, fromEmail, toEmail, subject, htmlContent) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail || 'SmartSpend <onboarding@resend.dev>',
      to: [toEmail],
      subject: subject,
      html: htmlContent
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API Error (${res.status}): ${errText}`);
  }
  return await res.json();
}

// Dispatch real-time HTML email with the OTP code
async function sendOTPEmail(email, otp, purpose) {
  const purposeTitle = purpose === 'RESET_PASSWORD' ? 'Password Reset Verification' : 'Verify Your Email Address';
  const defaultFrom = process.env.SMTP_USER ? `"SmartSpend AI" <${process.env.SMTP_USER}>` : '"SmartSpend AI" <no-reply@smartspend.io>';
  const fromName = process.env.SMTP_FROM || defaultFrom;
  const emailSubject = purpose === 'RESET_PASSWORD'
    ? `[SmartSpend] ${otp} is your password reset code`
    : `[SmartSpend] ${otp} is your verification code`;

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

  // 1. Try Brevo HTTP API (Port 443 - zero block on Render)
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER || process.env.SMTP_USER || 'tagsounds@gmail.com';
      await sendViaBrevo(process.env.BREVO_API_KEY, senderEmail, email, emailSubject, htmlContent);
      console.log(`[SmartSpend Realtime Email (Brevo HTTP)] Dispatched OTP ${otp} to ${email}`);
      return { sent: true, provider: 'brevo' };
    } catch (brevoErr) {
      console.error(`[Brevo API Error]:`, brevoErr.message);
    }
  }

  // 2. Try Resend HTTP API (Port 443 - zero block on Render)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(process.env.RESEND_API_KEY, process.env.RESEND_FROM, email, emailSubject, htmlContent);
      console.log(`[SmartSpend Realtime Email (Resend HTTP)] Dispatched OTP ${otp} to ${email}`);
      return { sent: true, provider: 'resend' };
    } catch (resendErr) {
      console.error(`[Resend API Error]:`, resendErr.message);
    }
  }

  // 3. Try Nodemailer SMTP (will timeout quickly on Render free tier due to port 465/587 blocks)
  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromName,
        to: email,
        subject: emailSubject,
        html: htmlContent
      });
      console.log(`[SmartSpend Realtime Email (SMTP)] Dispatched OTP ${otp} to ${email} (MessageID: ${info.messageId})`);
      return { sent: true, messageId: info.messageId, provider: 'smtp' };
    } catch (mailErr) {
      console.error(`[SmartSpend Realtime Email Error] SMTP delivery failed to ${email}:`, mailErr.message);
      if (mailErr.message && mailErr.message.includes('timeout')) {
        console.warn(`[Hosting Note] Cloud hosting providers (e.g. Render Free Tier) firewall outbound SMTP ports (465/587). The OTP is logged above or available via /api/auth/latest-otp.`);
      }
      return { sent: false, error: mailErr.message };
    }
  }

  console.log(`\n[Realtime OTP Notice] No active email provider configured. Falling back to server logs.`);
  return { sent: false, reason: 'NO_EMAIL_CONFIG' };
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
  verifyOTP,
  getMailTransporter
};
