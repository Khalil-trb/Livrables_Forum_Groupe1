const db = require('../config/db');

// GET /threads/:threadId/comments
const getComments = async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT c.*, u.username AS author_name,
        COALESCE(SUM(v.value), 0) AS vote_score
      FROM comments c
      JOIN users u ON c.author_id = u.id
      LEFT JOIN votes v ON v.target_type = 'comment' AND v.target_id = c.id
      WHERE c.thread_id = ? AND c.is_deleted = FALSE
      GROUP BY c.id
      ORDER BY c.parent_id ASC, c.created_at ASC
    `, [req.params.threadId]);

    // Nest replies under their parent
    const map = {};
    const roots = [];
    comments.forEach(c => { c.replies = []; map[c.id] = c; });
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(c);
      else roots.push(c);
    });

    res.json({ comments: roots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments', details: err.message });
  }
};

// POST /threads/:threadId/comments
const createComment = async (req, res) => {
  const { content, parent_id } = req.body;
  try {
    const [thread] = await db.query('SELECT id, is_locked FROM threads WHERE id = ? AND is_deleted = FALSE', [req.params.threadId]);
    if (!thread.length) return res.status(404).json({ error: 'Thread not found' });
    if (thread[0].is_locked && !['admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ error: 'Thread is locked' });

    const [result] = await db.query(
      'INSERT INTO comments (content, author_id, thread_id, parent_id) VALUES (?, ?, ?, ?)',
      [content, req.user.id, req.params.threadId, parent_id || null]
    );
    res.status(201).json({ message: 'Comment created', commentId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment', details: err.message });
  }
};

// PUT /comments/:id
const updateComment = async (req, res) => {
  const { content } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].author_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ error: 'Not allowed' });

    await db.query('UPDATE comments SET content = ? WHERE id = ?', [content, req.params.id]);
    res.json({ message: 'Comment updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update comment', details: err.message });
  }
};

// DELETE /comments/:id
const deleteComment = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].author_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ error: 'Not allowed' });

    await db.query('UPDATE comments SET is_deleted = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment', details: err.message });
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };
