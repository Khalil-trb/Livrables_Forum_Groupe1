const jwt = require('jsonwebtoken');
const db = require('../config/db');

const resolveUserFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const [rows] = await db.query('SELECT id, username, email, role, is_banned FROM users WHERE id = ?', [decoded.id]);
  if (!rows.length) return { error: 'User not found' };
  if (rows[0].is_banned) return { error: 'Account is banned', status: 403 };
  return { user: rows[0] };
};

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const resolved = await resolveUserFromToken(token);
    if (resolved.error) return res.status(resolved.status || 401).json({ error: resolved.error });
    req.user = resolved.user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuthenticate = async (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    const resolved = await resolveUserFromToken(token);
    if (!resolved.error) req.user = resolved.user;
  } catch {
    // Ignore invalid token in optional mode; proceed as guest
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

module.exports = { authenticate, optionalAuthenticate, authorize };
