const db = require('../config/db');
const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/11789/11789135.png';

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

const getMyProfile = async (req, res) => {
  try {
    let user;
    try {
      const [rows] = await db.query(
        `SELECT id, username, email, role, COALESCE(avatar_url, ?) AS avatar_url, bio, created_at, last_login_at
         FROM users
         WHERE id = ?`,
        [DEFAULT_AVATAR_URL, req.user.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      user = rows[0];
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' && String(err.message).includes('last_login_at')) {
        const [rows] = await db.query(
          `SELECT id, username, email, role, COALESCE(avatar_url, ?) AS avatar_url, bio, created_at
           FROM users
           WHERE id = ?`,
          [DEFAULT_AVATAR_URL, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        user = { ...rows[0], last_login_at: null };
      } else {
        throw err;
      }
    }

    const [[threadCount], [commentCount]] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM threads WHERE author_id = ? AND is_deleted = FALSE', [req.user.id]),
      db.query('SELECT COUNT(*) AS total FROM comments WHERE author_id = ? AND is_deleted = FALSE', [req.user.id]),
    ]);

    return res.json({
      profile: {
        ...user,
        stats: {
          topics_created: threadCount[0].total,
          messages_sent: commentCount[0].total,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
};

const updateMyProfile = async (req, res) => {
  const { username, avatar_url, bio } = req.body;
  const cleanUsername = String(username || '').trim();
  const cleanBio = bio === undefined || bio === null ? '' : String(bio).trim();
  const parsedAvatar = normalizeAvatarUrl(avatar_url);
  const usernameRegex = /^[A-Za-z0-9]+$/;

  if (!cleanUsername) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({ error: 'Username must contain only letters and numbers' });
  }
  if (cleanBio.length > 500) {
    return res.status(400).json({ error: 'Bio must be 500 characters max' });
  }
  if (avatar_url && !parsedAvatar) {
    return res.status(400).json({ error: 'Invalid avatar URL. Use a valid http(s) URL' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id <> ?',
      [cleanUsername, req.user.id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    await db.query(
      'UPDATE users SET username = ?, avatar_url = ?, bio = ? WHERE id = ?',
      [cleanUsername, parsedAvatar || DEFAULT_AVATAR_URL, cleanBio || null, req.user.id]
    );

    const [rows] = await db.query(
      'SELECT id, username, email, role, COALESCE(avatar_url, ?) AS avatar_url, bio FROM users WHERE id = ?',
      [DEFAULT_AVATAR_URL, req.user.id]
    );

    return res.json({ message: 'Profile updated', user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
};

module.exports = { getMyProfile, updateMyProfile };
