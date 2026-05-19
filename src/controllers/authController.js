const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const getJwtConfig = () => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!secret) {
    throw new Error('Server misconfiguration: JWT_SECRET is missing');
  }
  return { secret, expiresIn };
};

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const cleanUsername = (username || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const userRegex = /^[A-Za-z0-9]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasMinLen = (password || '').length >= 8;
  const hasUpper = /[A-Z]/.test(password || '');
  const hasSpecial = /[^A-Za-z0-9]/.test(password || '');

  if (!cleanUsername || !cleanEmail || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  if (!userRegex.test(cleanUsername)) {
    return res.status(400).json({ error: 'Username must contain only letters and numbers' });
  }
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!hasMinLen || !hasUpper || !hasSpecial) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and include one uppercase letter and one special character'
    });
  }

  try {
    const jwtConfig = getJwtConfig();
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?', [cleanEmail, cleanUsername]
    );
    if (existing.length) return res.status(409).json({ error: 'Username or email already taken' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [cleanUsername, cleanEmail, hash]
    );
    const token = jwt.sign({ id: result.insertId }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    res.status(201).json({ token, user: { id: result.insertId, username: cleanUsername, email: cleanEmail, role: 'user' } });
  } catch (err) {
    if (err.message.includes('JWT_SECRET is missing')) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
};

const login = async (req, res) => {
  const { identifier, email, password } = req.body;
  const cleanIdentifier = (identifier || email || '').trim();
  try {
    const jwtConfig = getJwtConfig();
    if (!cleanIdentifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [cleanIdentifier.toLowerCase(), cleanIdentifier]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'Account is banned' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    if (err.message.includes('JWT_SECRET is missing')) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
