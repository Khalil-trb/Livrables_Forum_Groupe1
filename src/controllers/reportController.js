const db = require('../config/db');

let reportsTableReady = false;

const ensureReportsTable = async () => {
  if (reportsTableReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporter_id INT NOT NULL,
      target_type ENUM('thread', 'comment', 'user') NOT NULL,
      target_id INT NOT NULL,
      reason VARCHAR(500) NOT NULL,
      status ENUM('open', 'reviewed', 'dismissed') NOT NULL DEFAULT 'open',
      reviewed_by INT DEFAULT NULL,
      reviewed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reports_status_created (status, created_at),
      INDEX idx_reports_target (target_type, target_id),
      INDEX idx_reports_reporter (reporter_id),
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  reportsTableReady = true;
};

const verifyTarget = async (targetType, targetId, reporterId) => {
  if (targetType === 'thread') {
    const [rows] = await db.query('SELECT id, title, author_id FROM threads WHERE id = ?', [targetId]);
    if (!rows.length) return { error: 'Sujet introuvable', status: 404 };
    if (rows[0].author_id === reporterId) return { error: 'Vous ne pouvez pas signaler votre propre sujet', status: 400 };
    return { target: rows[0] };
  }
  if (targetType === 'comment') {
    const [rows] = await db.query('SELECT id, content, author_id FROM comments WHERE id = ?', [targetId]);
    if (!rows.length) return { error: 'Commentaire introuvable', status: 404 };
    if (rows[0].author_id === reporterId) return { error: 'Vous ne pouvez pas signaler votre propre commentaire', status: 400 };
    return { target: rows[0] };
  }
  if (targetType === 'user') {
    const [rows] = await db.query('SELECT id, username FROM users WHERE id = ? AND is_banned = FALSE', [targetId]);
    if (!rows.length) return { error: 'Utilisateur introuvable', status: 404 };
    if (rows[0].id === reporterId) return { error: 'Vous ne pouvez pas vous signaler vous-meme', status: 400 };
    return { target: rows[0] };
  }
  return { error: 'Type de signalement invalide', status: 400 };
};

const createReport = async (req, res) => {
  const targetType = String(req.body.target_type || '').toLowerCase();
  const targetId = Number(req.body.target_id);
  const reason = String(req.body.reason || '').trim();

  if (!['thread', 'comment', 'user'].includes(targetType)) {
    return res.status(400).json({ error: 'Type de signalement invalide' });
  }
  if (!targetId) return res.status(400).json({ error: 'Cible du signalement requise' });
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Les administrateurs gerent les signalements depuis le tableau admin' });
  }
  if (reason.length < 5 || reason.length > 500) {
    return res.status(400).json({ error: 'La raison doit contenir entre 5 et 500 caracteres' });
  }

  try {
    await ensureReportsTable();
    const target = await verifyTarget(targetType, targetId, req.user.id);
    if (target.error) return res.status(target.status).json({ error: target.error });

    const [existing] = await db.query(
      `SELECT id FROM reports
       WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'open'
       LIMIT 1`,
      [req.user.id, targetType, targetId]
    );
    if (existing.length) return res.status(409).json({ error: 'Vous avez deja signale cet element' });

    const [result] = await db.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, targetType, targetId, reason]
    );
    res.status(201).json({ message: 'Signalement envoye', report_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create report', details: err.message });
  }
};

const getReports = async (req, res) => {
  const status = String(req.query.status || 'open').toLowerCase();
  const safeStatus = ['open', 'reviewed', 'dismissed', 'all'].includes(status) ? status : 'open';

  try {
    await ensureReportsTable();
    let query = `
      SELECT r.*,
        reporter.username AS reporter_name,
        reviewer.username AS reviewer_name,
        tu.username AS target_user_name,
        tt.title AS target_thread_title,
        tc.content AS target_comment_content
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
      LEFT JOIN users tu ON r.target_type = 'user' AND tu.id = r.target_id
      LEFT JOIN threads tt ON r.target_type = 'thread' AND tt.id = r.target_id
      LEFT JOIN comments tc ON r.target_type = 'comment' AND tc.id = r.target_id
    `;
    const params = [];
    if (safeStatus !== 'all') {
      query += ' WHERE r.status = ?';
      params.push(safeStatus);
    }
    query += ' ORDER BY r.created_at DESC LIMIT 100';
    const [reports] = await db.query(query, params);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports', details: err.message });
  }
};

const updateReportStatus = async (req, res) => {
  const status = String(req.body.status || '').toLowerCase();
  if (!['reviewed', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  try {
    await ensureReportsTable();
    const [result] = await db.query(
      `UPDATE reports
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, req.user.id, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Signalement introuvable' });
    res.json({ message: 'Signalement mis a jour' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report', details: err.message });
  }
};

module.exports = { createReport, getReports, updateReportStatus };
