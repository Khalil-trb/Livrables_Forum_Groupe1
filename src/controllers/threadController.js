const db = require('../config/db');

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
  '-' + Date.now();

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

const normalizeState = (state) => {
  const allowed = ['open', 'closed', 'archived'];
  const normalized = (state || 'open').toLowerCase();
  return allowed.includes(normalized) ? normalized : null;
};

// GET /threads?category=&tag=&page=&limit=
const getThreads = async (req, res) => {
  const { category, tag, page = 1, limit = 10, search } = req.query;
  const pageNum = Number(page) || 1;
  const rawLimit = String(limit).toLowerCase();
  const allowedLimits = ['10', '20', '30', 'all'];
  const safeLimit = allowedLimits.includes(rawLimit) ? rawLimit : '10';
  const isAll = safeLimit === 'all';
  const limitNum = isAll ? null : Number(safeLimit);
  const offset = isAll ? 0 : (pageNum - 1) * limitNum;
  try {
    const canSeeArchivedClause = req.user
      ? '(t.is_deleted = FALSE OR t.author_id = ? OR ? = \'admin\')'
      : 't.is_deleted = FALSE';
    let query = `
      SELECT t.*, u.username AS author_name, c.name AS category_name,
        CASE
          WHEN t.is_deleted = TRUE THEN 'archived'
          WHEN t.is_locked = TRUE THEN 'closed'
          ELSE 'open'
        END AS state,
        COALESCE(vs.vote_score, 0) AS vote_score,
        COALESCE(cs.comment_count, 0) AS comment_count
      FROM threads t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN (
        SELECT target_id, SUM(value) AS vote_score
        FROM votes
        WHERE target_type = 'thread'
        GROUP BY target_id
      ) vs ON vs.target_id = t.id
      LEFT JOIN (
        SELECT thread_id, COUNT(*) AS comment_count
        FROM comments
        WHERE is_deleted = FALSE
        GROUP BY thread_id
      ) cs ON cs.thread_id = t.id
      WHERE ${canSeeArchivedClause}
    `;
    const params = [];
    if (req.user) params.push(req.user.id, req.user.role);
    if (category) { query += ' AND c.slug = ?'; params.push(category); }
    if (search) { query += ' AND (t.title LIKE ? OR t.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (tag) {
      query += ` AND t.id IN (SELECT tt.thread_id FROM thread_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tg.slug = ?)`;
      params.push(tag);
    }
    query += ' ORDER BY vote_score DESC, t.created_at DESC';
    if (!isAll) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limitNum, Number(offset));
    }

    const [threads] = await db.query(query, params);
    res.json({ threads, page: pageNum, limit: isAll ? 'all' : limitNum });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch threads', details: err.message });
  }
};

// GET /threads/:slug
const getThread = async (req, res) => {
  try {
    const canSeeArchivedClause = req.user
      ? '(t.is_deleted = FALSE OR t.author_id = ? OR ? = \'admin\')'
      : 't.is_deleted = FALSE';
    const [rows] = await db.query(`
      SELECT t.*, u.username AS author_name, c.name AS category_name,
        CASE
          WHEN t.is_deleted = TRUE THEN 'archived'
          WHEN t.is_locked = TRUE THEN 'closed'
          ELSE 'open'
        END AS state,
        COALESCE(SUM(v.value), 0) AS vote_score
      FROM threads t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN votes v ON v.target_type = 'thread' AND v.target_id = t.id
      WHERE t.slug = ? AND ${canSeeArchivedClause}
      GROUP BY t.id
    `, req.user ? [req.params.slug, req.user.id, req.user.role] : [req.params.slug]);

    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });

    await db.query('UPDATE threads SET view_count = view_count + 1 WHERE id = ?', [rows[0].id]);

    const [tags] = await db.query(`
      SELECT tg.id, tg.name, tg.slug FROM tags tg
      JOIN thread_tags tt ON tg.id = tt.tag_id
      WHERE tt.thread_id = ?`, [rows[0].id]);

    res.json({ thread: { ...rows[0], tags } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch thread', details: err.message });
  }
};

// POST /threads
const createThread = async (req, res) => {
  const { title, content, category_id, tags, state, image_url } = req.body;
  const normalizedState = normalizeState(state);
  const normalizedImageUrl = normalizeMediaUrl(image_url);
  if (!title || !content || !category_id) {
    return res.status(400).json({ error: 'Title, content and category are required' });
  }
  if (image_url && !normalizedImageUrl) {
    return res.status(400).json({ error: 'Invalid image URL. Use a valid http(s) URL' });
  }
  if (!normalizedState) {
    return res.status(400).json({ error: 'Invalid state. Use open, closed or archived' });
  }

  const isLocked = normalizedState === 'closed';
  const isArchived = normalizedState === 'archived';
  try {
    const slug = slugify(title);
    let result;
    try {
      const [insertResult] = await db.query(
        'INSERT INTO threads (title, slug, content, image_url, author_id, category_id, is_locked, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, content, normalizedImageUrl, req.user.id, category_id, isLocked, isArchived]
      );
      result = insertResult;
    } catch (insertErr) {
      // Backward compatibility when DB migration for image_url has not been applied yet.
      if (insertErr.code === 'ER_BAD_FIELD_ERROR' && String(insertErr.message).includes('image_url')) {
        const [insertFallback] = await db.query(
          'INSERT INTO threads (title, slug, content, author_id, category_id, is_locked, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [title, slug, content, req.user.id, category_id, isLocked, isArchived]
        );
        result = insertFallback;
      } else {
        throw insertErr;
      }
    }

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
  const { title, content, category_id, tags, state, image_url } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Thread not found' });
    const thread = rows[0];
    if (thread.author_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role))
      return res.status(403).json({ error: 'Not allowed' });

    const normalizedState = state ? normalizeState(state) : null;
    if (state && !normalizedState) {
      return res.status(400).json({ error: 'Invalid state. Use open, closed or archived' });
    }
    const normalizedImageUrl = image_url === undefined
      ? thread.image_url
      : normalizeMediaUrl(image_url);
    if (image_url !== undefined && image_url !== null && String(image_url).trim() !== '' && !normalizedImageUrl) {
      return res.status(400).json({ error: 'Invalid image URL. Use a valid http(s) URL' });
    }

    const nextState = normalizedState || (thread.is_deleted ? 'archived' : (thread.is_locked ? 'closed' : 'open'));
    const nextLocked = nextState === 'closed';
    const nextArchived = nextState === 'archived';

    try {
      await db.query(
        'UPDATE threads SET title = ?, content = ?, image_url = ?, category_id = ?, is_locked = ?, is_deleted = ? WHERE id = ?',
        [title || thread.title, content || thread.content, normalizedImageUrl, category_id || thread.category_id, nextLocked, nextArchived, req.params.id]
      );
    } catch (updateErr) {
      // Backward compatibility when DB migration for image_url has not been applied yet.
      if (updateErr.code === 'ER_BAD_FIELD_ERROR' && String(updateErr.message).includes('image_url')) {
        await db.query(
          'UPDATE threads SET title = ?, content = ?, category_id = ?, is_locked = ?, is_deleted = ? WHERE id = ?',
          [title || thread.title, content || thread.content, category_id || thread.category_id, nextLocked, nextArchived, req.params.id]
        );
      } else {
        throw updateErr;
      }
    }

    if (Array.isArray(tags)) {
      await db.query('DELETE FROM thread_tags WHERE thread_id = ?', [req.params.id]);
      for (const tagId of tags) {
        await db.query('INSERT IGNORE INTO thread_tags (thread_id, tag_id) VALUES (?, ?)', [req.params.id, Number(tagId)]);
      }
    }

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

    await db.query(
      `DELETE FROM votes
       WHERE (target_type = 'thread' AND target_id = ?)
          OR (target_type = 'comment' AND target_id IN (SELECT id FROM comments WHERE thread_id = ?))`,
      [req.params.id, req.params.id]
    );
    await db.query('DELETE FROM threads WHERE id = ?', [req.params.id]);
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete thread', details: err.message });
  }
};

module.exports = { getThreads, getThread, createThread, updateThread, deleteThread };
