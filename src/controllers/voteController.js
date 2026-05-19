const db = require('../config/db');

// POST /vote
const vote = async (req, res) => {
  const { target_type, target_id, value } = req.body;
  if (!['thread', 'comment'].includes(target_type) || ![1, -1].includes(Number(value)))
    return res.status(400).json({ error: 'Invalid vote data' });

  try {
    // Check if target exists
    const table = target_type === 'thread' ? 'threads' : 'comments';
    const [target] = await db.query(`SELECT id FROM ${table} WHERE id = ? AND is_deleted = FALSE`, [target_id]);
    if (!target.length) return res.status(404).json({ error: `${target_type} not found` });

    const [existing] = await db.query(
      'SELECT * FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [req.user.id, target_type, target_id]
    );

    if (existing.length) {
      if (existing[0].value === Number(value)) {
        // Remove vote (toggle off)
        await db.query('DELETE FROM votes WHERE id = ?', [existing[0].id]);
        return res.json({ message: 'Vote removed', action: 'removed', delta: -Number(value), current_vote: 0 });
      } else {
        // Update vote
        await db.query('UPDATE votes SET value = ? WHERE id = ?', [value, existing[0].id]);
        return res.json({
          message: 'Vote updated',
          action: 'updated',
          delta: Number(value) - Number(existing[0].value),
          current_vote: Number(value)
        });
      }
    }

    await db.query(
      'INSERT INTO votes (user_id, target_type, target_id, value) VALUES (?, ?, ?, ?)',
      [req.user.id, target_type, target_id, value]
    );
    res.status(201).json({ message: 'Vote recorded', action: 'added', delta: Number(value), current_vote: Number(value) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record vote', details: err.message });
  }
};

module.exports = { vote };
