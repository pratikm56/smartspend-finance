const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { saveOTP, verifyOTP, sendOTPEmail, getMailTransporter } = require('../utils/otp');

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 1. Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
      } else {
        // Update credentials for unverified user and re-send OTP
        db.prepare('UPDATE users SET name = ?, password = ? WHERE id = ?').run(name.trim(), hashedPassword, existingUser.id);
        const { otp } = saveOTP(trimmedEmail, 'VERIFY_EMAIL');
        await sendOTPEmail(trimmedEmail, otp, 'VERIFY_EMAIL');
        return res.json({
          message: 'Account updated. Verification OTP sent to your email.',
          email: trimmedEmail,
          requiresVerification: true
        });
      }
    }

    const result = db.prepare(`
      INSERT INTO users (name, email, password, is_verified)
      VALUES (?, ?, ?, 0)
    `).run(name.trim(), trimmedEmail, hashedPassword);

    const { otp } = saveOTP(trimmedEmail, 'VERIFY_EMAIL');
    await sendOTPEmail(trimmedEmail, otp, 'VERIFY_EMAIL');

    return res.status(201).json({
      message: 'Registration successful! Verification code sent to your email.',
      email: trimmedEmail,
      requiresVerification: true
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An error occurred during registration. Please try again.' });
  }
});

// 2. Verify Email OTP
router.post('/verify-email', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const verification = verifyOTP(trimmedEmail, otp, 'VERIFY_EMAIL');

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(trimmedEmail);
    const user = db.prepare('SELECT id, name, email, is_verified, currency, monthly_savings_target_pct, created_at FROM users WHERE email = ?').get(trimmedEmail);

    const token = generateToken(user);

    return res.json({
      message: 'Email verified successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// 3. Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose = 'VERIFY_EMAIL' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email.' });
    }

    const { otp } = saveOTP(trimmedEmail, purpose);
    await sendOTPEmail(trimmedEmail, otp, purpose);

    return res.json({
      message: 'A new 6-digit verification code has been dispatched to your email.',
      email: trimmedEmail
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend code.' });
  }
});

// 4. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      const { otp } = saveOTP(trimmedEmail, 'VERIFY_EMAIL');
      await sendOTPEmail(trimmedEmail, otp, 'VERIFY_EMAIL');
      return res.status(403).json({
        error: 'Your email is not verified yet. Please enter the OTP sent to your email.',
        requiresVerification: true,
        email: trimmedEmail
      });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      is_verified: user.is_verified,
      currency: user.currency || '₹',
      monthly_savings_target_pct: user.monthly_savings_target_pct || 20,
      hasCustomApiKey: Boolean(user.gemini_api_key),
      created_at: user.created_at
    };

    return res.json({
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// 5. Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    const { otp } = saveOTP(trimmedEmail, 'RESET_PASSWORD');
    await sendOTPEmail(trimmedEmail, otp, 'RESET_PASSWORD');

    return res.json({
      message: 'Password reset code has been sent to your email. Please check your inbox.',
      email: trimmedEmail
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// 6. Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const verification = verifyOTP(trimmedEmail, otp, 'RESET_PASSWORD');

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    db.prepare('UPDATE users SET password = ?, is_verified = 1 WHERE email = ?').run(hashedPassword, trimmedEmail);

    return res.json({
      message: 'Password has been reset successfully! You can now log in.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 7. Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    is_verified: user.is_verified,
    currency: user.currency || '₹',
    monthly_savings_target_pct: user.monthly_savings_target_pct || 20,
    hasCustomApiKey: Boolean(user.gemini_api_key),
    created_at: user.created_at
  });
});

// 8. Update Profile Settings
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, currency, monthly_savings_target_pct, gemini_api_key } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (currency !== undefined) {
      updates.push('currency = ?');
      params.push(currency);
    }

    if (monthly_savings_target_pct !== undefined) {
      const pct = parseFloat(monthly_savings_target_pct);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
        updates.push('monthly_savings_target_pct = ?');
        params.push(pct);
      }
    }

    if (gemini_api_key !== undefined) {
      updates.push('gemini_api_key = ?');
      params.push(gemini_api_key.trim() || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(req.userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare('SELECT id, name, email, is_verified, currency, monthly_savings_target_pct, gemini_api_key, created_at FROM users WHERE id = ?').get(req.userId);

    return res.json({
      message: 'Profile settings updated successfully!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        is_verified: updatedUser.is_verified,
        currency: updatedUser.currency || '₹',
        monthly_savings_target_pct: updatedUser.monthly_savings_target_pct || 20,
        hasCustomApiKey: Boolean(updatedUser.gemini_api_key),
        created_at: updatedUser.created_at
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// 9. Change Password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const userRecord = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, userRecord.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.userId);

    return res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 10. SMTP Diagnostic Check
router.get('/test-smtp', async (req, res) => {
  const hasUser = !!process.env.SMTP_USER;
  const hasPass = !!process.env.SMTP_PASS;

  if (!hasUser || !hasPass) {
    return res.status(400).json({
      configured: false,
      message: 'SMTP credentials missing. Please set SMTP_USER and SMTP_PASS in your hosting environment variables.',
      hasUser,
      hasPass
    });
  }

  const transporter = getMailTransporter();
  if (!transporter) {
    return res.status(400).json({
      configured: false,
      message: 'Failed to initialize email transporter.'
    });
  }

  try {
    await transporter.verify();
    return res.json({
      configured: true,
      status: 'success',
      message: 'SMTP connection verified successfully! Email delivery is ready.'
    });
  } catch (err) {
    console.error('[SMTP Verification Error]:', err.message);
    return res.status(500).json({
      configured: true,
      status: 'error',
      message: 'Failed to authenticate with SMTP provider.',
      error: err.message
    });
  }
});

// 11. OTP Fallback Retrieval (For cloud hosting platforms like Render free-tier that firewall SMTP ports 465/587)
router.get('/latest-otp', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  const trimmed = email.trim().toLowerCase();
  const record = db.prepare(`
    SELECT otp, purpose, expires_at 
    FROM otps 
    WHERE email = ? 
    ORDER BY id DESC LIMIT 1
  `).get(trimmed);

  if (!record) {
    return res.status(404).json({ error: 'No active OTP code found for this email.' });
  }

  const isExpired = new Date() > new Date(record.expires_at);

  return res.json({
    email: trimmed,
    otp: record.otp,
    purpose: record.purpose,
    expiresAt: record.expires_at,
    isExpired,
    notice: 'Code retrieved directly from server instance.'
  });
});

module.exports = router;
