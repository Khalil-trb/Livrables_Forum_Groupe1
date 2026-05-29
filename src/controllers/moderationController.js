const db = require('../config/db');

// Ban / Unban a user (admin only)
const banUser = async (req, res) => {
  const { ban } = req.body; // true or false
  const shouldBan = Boolean(ban);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }
    if (rows[0].role === 'admin') {
      await connection.rollback();
      return res.status(403).json({ error: 'Cannot ban an admin' });
    }

    await connection.query('UPDATE users SET is_banned = ? WHERE id = ?', [shouldBan, req.params.id]);
    if (shouldBan) {
      await connection.query('UPDATE threads SET is_deleted = TRUE WHERE author_id = ?', [req.params.id]);
      await connection.query('UPDATE comments SET is_deleted = TRUE WHERE author_id = ?', [req.params.id]);
    }

    await connection.commit();
    res.json({
      message: shouldBan
        ? 'User banned and content archived'
        : 'User unbanned'
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to update ban status', details: err.message });
  } finally {
    connection.release();
  }
};

// Change user role (admin only)
const changeRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'moderator', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role', details: err.message });
  }
};

// Pin / Unpin a thread (moderator+)
const pinThread = async (req, res) => {
  const { pin } = req.body;
  try {
    await db.query('UPDATE threads SET is_pinned = ? WHERE id = ?', [pin, req.params.id]);
    res.json({ message: pin ? 'Thread pinned' : 'Thread unpinned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pin/unpin thread', details: err.message });
  }
};

// Lock / Unlock a thread (moderator+)
const lockThread = async (req, res) => {
  const { lock } = req.body;
  try {
    await db.query('UPDATE threads SET is_locked = ? WHERE id = ?', [lock, req.params.id]);
    res.json({ message: lock ? 'Thread locked' : 'Thread unlocked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to lock/unlock thread', details: err.message });
  }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = 'SELECT id, username, email, role, is_banned, created_at FROM users';
    const params = [];
    if (search) { query += ' WHERE username LIKE ? OR email LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [users] = await db.query(query, params);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
};

// Get threads for admin dashboard
const getThreads = async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = `
      SELECT t.id, t.title, t.slug, t.is_deleted, t.is_locked, t.created_at, u.username AS author_name
      FROM threads t
      JOIN users u ON u.id = t.author_id
    `;
    const params = [];
    if (search) {
      query += ' WHERE t.title LIKE ? OR u.username LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [threads] = await db.query(query, params);
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch threads', details: err.message });
  }
};

// Get comments for admin dashboard
const getComments = async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = `
      SELECT c.id, c.content, c.thread_id, c.created_at, c.is_deleted,
             u.username AS author_name, t.title AS thread_title
      FROM comments c
      JOIN users u ON u.id = c.author_id
      JOIN threads t ON t.id = c.thread_id
      WHERE c.is_deleted = FALSE
    `;
    const params = [];
    if (search) {
      query += ' AND (c.content LIKE ? OR u.username LIKE ? OR t.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [comments] = await db.query(query, params);
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments', details: err.message });
  }
};

module.exports = { banUser, changeRole, pinThread, lockThread, getUsers, getThreads, getComments };
