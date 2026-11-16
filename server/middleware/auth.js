const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smartspend_secret_jwt_key_2026_super_secure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    try {
      const user = db.prepare('SELECT id, name, email, is_verified, currency, monthly_savings_target_pct, gemini_api_key, created_at FROM users WHERE id = ?').get(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists.' });
      }
      req.user = user;
      req.userId = user.id;
      next();
    } catch (dbErr) {
      console.error('Auth DB error:', dbErr);
      return res.status(500).json({ error: 'Internal server error verifying authentication.' });
    }
  });
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
