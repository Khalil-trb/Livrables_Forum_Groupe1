const db = require('../config/db');

const normalizeMediaUrl = (value) => {
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

// GET /threads/:threadId/comments
const getComments = async (req, res) => {
  try {
    const sort = (req.query.sort || 'newest').toLowerCase();
    const allowedSort = ['newest', 'chronological', 'likes', 'dislikes'];
    const sortMode = allowedSort.includes(sort) ? sort : 'newest';

    const [threadRows] = await db.query(
      'SELECT author_id, is_deleted FROM threads WHERE id = ?',
      [req.params.threadId]
    );
    if (!threadRows.length) return res.status(404).json({ error: 'Thread not found' });
    const thread = threadRows[0];
    const canSeeArchived = req.user && (req.user.id === thread.author_id || req.user.role === 'admin');
    if (thread.is_deleted && !canSeeArchived) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const [comments] = await db.query(`
      SELECT c.*, u.username AS author_name,
        COALESCE(NULLIF(u.avatar_url, ''), 'https://cdn-icons-png.flaticon.com/512/11789/11789135.png') AS author_avatar_url,
        COALESCE(SUM(v.value), 0) AS vote_score
      FROM comments c
      JOIN users u ON c.author_id = u.id
      LEFT JOIN votes v ON v.target_type = 'comment' AND v.target_id = c.id
      WHERE c.thread_id = ? AND c.is_deleted = FALSE
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `, [req.params.threadId]);

    // Nest replies under their parent
    const map = {};
    const roots = [];
    comments.forEach(c => { c.replies = []; map[c.id] = c; });
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(c);
      else roots.push(c);
    });

    const sortComments = (arr) => {
      arr.sort((a, b) => {
        if (sortMode === 'likes') {
          if (b.vote_score !== a.vote_score) return b.vote_score - a.vote_score;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortMode === 'dislikes') {
          if (a.vote_score !== b.vote_score) return a.vote_score - b.vote_score;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortMode === 'chronological') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        // newest (default)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      arr.forEach(item => sortComments(item.replies));
    };
    sortComments(roots);

    res.json({ comments: roots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments', details: err.message });
  }
};

// POST /threads/:threadId/comments
const createComment = async (req, res) => {
  const { content, parent_id, image_url } = req.body;
  const normalizedImageUrl = normalizeMediaUrl(image_url);
  const cleanContent = content === undefined || content === null ? '' : String(content).trim();
  try {
    if (!cleanContent && !normalizedImageUrl) {
      return res.status(400).json({ error: 'Add text content or an image URL' });
    }
    if (image_url && !normalizedImageUrl) {
      return res.status(400).json({ error: 'Invalid image URL. Use a valid http(s) URL' });
    }
    const [threadRows] = await db.query('SELECT id, author_id, is_locked, is_deleted FROM threads WHERE id = ?', [req.params.threadId]);
    if (!threadRows.length) return res.status(404).json({ error: 'Thread not found' });
    const thread = threadRows[0];

    const isOwner = req.user.id === thread.author_id;
    const isAdmin = req.user.role === 'admin';

    if (thread.is_deleted && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    if (thread.is_locked && !isOwner && !isAdmin)
      return res.status(403).json({ error: 'Thread is locked' });

    const [result] = await db.query(
      'INSERT INTO comments (content, image_url, author_id, thread_id, parent_id) VALUES (?, ?, ?, ?, ?)',
      [cleanContent, normalizedImageUrl, req.user.id, req.params.threadId, parent_id || null]
    );
    res.status(201).json({ message: 'Comment created', commentId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment', details: err.message });
  }
};

// PUT /comments/:id
const updateComment = async (req, res) => {
  const { content, image_url } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'Not allowed' });

    const normalizedImageUrl = image_url === undefined
      ? rows[0].image_url
      : normalizeMediaUrl(image_url);
    if (image_url !== undefined && image_url !== null && String(image_url).trim() !== '' && !normalizedImageUrl) {
      return res.status(400).json({ error: 'Invalid image URL. Use a valid http(s) URL' });
    }
    const nextContent = content === undefined ? rows[0].content : String(content).trim();
    if (!nextContent && !normalizedImageUrl) {
      return res.status(400).json({ error: 'Add text content or an image URL' });
    }

    await db.query('UPDATE comments SET content = ?, image_url = ? WHERE id = ?', [nextContent, normalizedImageUrl, req.params.id]);
    res.json({ message: 'Comment updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update comment', details: err.message });
  }
};

// DELETE /comments/:id
const deleteComment = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, t.author_id AS thread_author_id
      FROM comments c
      JOIN threads t ON t.id = c.thread_id
      WHERE c.id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found' });

    const isCommentAuthor = rows[0].author_id === req.user.id;
    const isThreadOwner = rows[0].thread_author_id === req.user.id;
    const isStaff = ['admin', 'moderator'].includes(req.user.role);

    if (!isCommentAuthor && !isThreadOwner && !isStaff)
      return res.status(403).json({ error: 'Not allowed' });

    await db.query('UPDATE comments SET is_deleted = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment', details: err.message });
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };
