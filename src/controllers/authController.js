const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/11789/11789135.png';

const getJwtConfig = () => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!secret) {
    throw new Error('Configuration serveur invalide : JWT_SECRET est manquant');
  }
  return { secret, expiresIn };
};

const normalizeAvatarUrl = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return trimmed;
  } catch {
    return null;
  }
};

const register = async (req, res) => {
  const { username, email, password, avatar_url, bio } = req.body;
  const cleanUsername = (username || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanBio = bio === undefined || bio === null ? '' : String(bio).trim();
  const parsedAvatar = normalizeAvatarUrl(avatar_url);
  const userRegex = /^[A-Za-z0-9]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasMinLen = (password || '').length >= 8;
  const hasUpper = /[A-Z]/.test(password || '');
  const hasSpecial = /[^A-Za-z0-9]/.test(password || '');

  if (!cleanUsername || !cleanEmail || !password) {
    return res.status(400).json({ error: 'Nom d utilisateur, email et mot de passe requis' });
  }
  if (!userRegex.test(cleanUsername)) {
    return res.status(400).json({ error: 'Le nom d utilisateur doit contenir seulement des lettres et des chiffres' });
  }
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Format d email invalide' });
  }
  if (!hasMinLen || !hasUpper || !hasSpecial) {
    return res.status(400).json({
      error: 'Le mot de passe doit contenir au moins 8 caracteres, une majuscule et un caractere special'
    });
  }
  if (cleanBio.length > 500) {
    return res.status(400).json({ error: 'La biographie doit faire 500 caracteres maximum' });
  }
  if (avatar_url && !parsedAvatar) {
    return res.status(400).json({ error: 'URL d avatar invalide. Utilisez une URL http(s) valide' });
  }

  try {
    const jwtConfig = getJwtConfig();
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?', [cleanEmail, cleanUsername]
    );
    if (existing.length) return res.status(409).json({ error: 'Nom d utilisateur ou email deja utilise' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, avatar_url, bio) VALUES (?, ?, ?, ?, ?)',
      [cleanUsername, cleanEmail, hash, parsedAvatar || DEFAULT_AVATAR_URL, cleanBio || null]
    );
    const token = jwt.sign({ id: result.insertId }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    res.status(201).json({ token, user: { id: result.insertId, username: cleanUsername, email: cleanEmail, role: 'user' } });
  } catch (err) {
    if (err.message.includes('JWT_SECRET')) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).json({ error: 'Inscription impossible', details: err.message });
  }
};

const login = async (req, res) => {
  const { identifier, email, password } = req.body;
  const cleanIdentifier = (identifier || email || '').trim();
  try {
    const jwtConfig = getJwtConfig();
    if (!cleanIdentifier || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
    }
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [cleanIdentifier.toLowerCase(), cleanIdentifier]
    );
    if (!rows.length) return res.status(401).json({ error: 'Identifiants invalides' });

    const user = rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'Ce compte est banni' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    try {
      await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    } catch (updateErr) {
      if (!(updateErr.code === 'ER_BAD_FIELD_ERROR' && String(updateErr.message).includes('last_login_at'))) {
        throw updateErr;
      }
    }

    const token = jwt.sign({ id: user.id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    if (err.message.includes('JWT_SECRET')) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).json({ error: 'Connexion impossible', details: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
