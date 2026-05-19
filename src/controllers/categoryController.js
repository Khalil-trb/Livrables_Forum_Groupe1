const db = require('../config/db');

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// --- CATEGORIES ---
const getCategories = async (req, res) => {
  const [categories] = await db.query(`
    SELECT c.*, COUNT(DISTINCT t.id) AS thread_count
    FROM categories c
    LEFT JOIN threads t ON t.category_id = c.id AND t.is_deleted = FALSE
    GROUP BY c.id ORDER BY c.name
  `);
  res.json({ categories });
};

const createCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const slug = slugify(name);
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description, created_by) VALUES (?, ?, ?, ?)',
      [name, slug, description, req.user.id]
    );
    res.status(201).json({ message: 'Category created', categoryId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category', details: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category', details: err.message });
  }
};

// --- TAGS ---
const getTags = async (req, res) => {
  const [tags] = await db.query(`
    SELECT tg.*, COUNT(tt.thread_id) AS thread_count
    FROM tags tg
    LEFT JOIN thread_tags tt ON tg.id = tt.tag_id
    GROUP BY tg.id ORDER BY thread_count DESC
  `);
  res.json({ tags });
};

const createTag = async (req, res) => {
  const { name } = req.body;
  const cleanName = (name || '').trim();
  if (!cleanName) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  if (cleanName.length > 50) {
    return res.status(400).json({ error: 'Tag name is too long (max 50 chars)' });
  }
  try {
    const slug = slugify(cleanName);
    const [existing] = await db.query('SELECT id, name, slug FROM tags WHERE slug = ? OR name = ?', [slug, cleanName]);
    if (existing.length) {
      return res.status(200).json({
        message: 'Tag already exists',
        tagId: existing[0].id,
        tag: existing[0]
      });
    }

    const [result] = await db.query('INSERT INTO tags (name, slug) VALUES (?, ?)', [cleanName, slug]);
    res.status(201).json({ message: 'Tag created', tagId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tag', details: err.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory, getTags, createTag };
