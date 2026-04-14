const db = require('../config/db');

// Ban / Unban a user (admin only)
const banUser = async (req, res) => {
  const { ban } = req.body; // true or false
  try {
    const [rows] = await db.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot ban an admin' });

    await db.query('UPDATE users SET is_banned = ? WHERE id = ?', [ban, req.params.id]);
    res.json({ message: ban ? 'User banned' : 'User unbanned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ban status', details: err.message });
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

module.exports = { banUser, changeRole, pinThread, lockThread, getUsers };
