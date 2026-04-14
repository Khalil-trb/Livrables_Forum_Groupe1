const db = require('../config/db');

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
  '-' + Date.now();

// GET /threads?category=&tag=&page=&limit=
const getThreads = async (req, res) => {
  const { category, tag, page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `
      SELECT t.*, u.username AS author_name, c.name AS category_name,
        COALESCE(SUM(v.value), 0) AS vote_score,
        COUNT(DISTINCT cm.id) AS comment_count
      FROM threads t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN votes v ON v.target_type = 'thread' AND v.target_id = t.id
      LEFT JOIN comments cm ON cm.thread_id = t.id AND cm.is_deleted = FALSE
      WHERE t.is_deleted = FALSE
    `;
    const params = [];
    if (category) { query += ' AND c.slug = ?'; params.push(category); }
    if (search) { query += ' AND (t.title LIKE ? OR t.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (tag) {
      query += ` AND t.id IN (SELECT tt.thread_id FROM thread_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tg.slug = ?)`;
      params.push(tag);
    }
    query += ' GROUP BY t.id ORDER BY t.is_pinned DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [threads] = await db.query(query, params);
    res.json({ threads, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch threads', details: err.message });
  }
};

// GET /threads/:slug
const getThread = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, u.username AS author_name, c.name AS category_name,
        COALESCE(SUM(v.value), 0) AS vote_score
      FROM threads t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN votes v ON v.target_type = 'thread' AND v.target_id = t.id
      WHERE t.slug = ? AND t.is_deleted = FALSE
      GROUP BY t.id
    `, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });

    await db.query('UPDATE threads SET view_count = view_count + 1 WHERE id = ?', [rows[0].id]);

    const [tags] = await db.query(`
      SELECT tg.name, tg.slug FROM tags tg
      JOIN thread_tags tt ON tg.id = tt.tag_id
      WHERE tt.thread_id = ?`, [rows[0].id]);

    res.json({ thread: { ...rows[0], tags } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch thread', details: err.message });
  }
};

// POST /threads
const createThread = async (req, res) => {
  const { title, content, category_id, tags } = req.body;
  try {
    const slug = slugify(title);
    const [result] = await db.query(
      'INSERT INTO threads (title, slug, content, author_id, category_id) VALUES (?, ?, ?, ?, ?)',
      [title, slug, content, req.user.id, category_id]
    );
    if (tags?.length) {
      for (const tagId of tags) {
        await db.query('INSERT IGNORE INTO thread_tags (thread_id, tag_id) VALUES (?, ?)', [result.insertId, tagId]);
      }
    }
    res.status(201).json({ message: 'Thread created', threadId: result.insertId, slug });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create thread', details: err.message });
  }
};

// PUT /threads/:id
const updateThread = async (req, res) => {
  const { title, content, category_id } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });
    const thread = rows[0];
    if (thread.author_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ error: 'Not allowed' });

    await db.query(
      'UPDATE threads SET title = ?, content = ?, category_id = ? WHERE id = ?',
      [title || thread.title, content || thread.content, category_id || thread.category_id, req.params.id]
    );
    res.json({ message: 'Thread updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update thread', details: err.message });
  }
};

// DELETE /threads/:id
const deleteThread = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });
    if (rows[0].author_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ error: 'Not allowed' });

    await db.query('UPDATE threads SET is_deleted = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete thread', details: err.message });
  }
};

module.exports = { getThreads, getThread, createThread, updateThread, deleteThread };
