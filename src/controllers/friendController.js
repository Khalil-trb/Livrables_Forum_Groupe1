const db = require('../config/db');

const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/11789/11789135.png';
let friendshipTableReady = false;

const ensureFriendshipsTable = async () => {
  if (friendshipTableReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_id INT NOT NULL,
      addressee_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      accepted_at TIMESTAMP NULL DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_friendship_direction (requester_id, addressee_id),
      INDEX idx_friendships_requester_status (requester_id, status),
      INDEX idx_friendships_addressee_status (addressee_id, status),
      CHECK (requester_id <> addressee_id),
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  friendshipTableReady = true;
};

const userSelect = `
  u.id,
  u.username,
  u.role,
  COALESCE(NULLIF(u.avatar_url, ''), ?) AS avatar_url,
  u.bio
`;

const findRelationship = async (userId, otherUserId) => {
  const [rows] = await db.query(
    `SELECT *
     FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?)
        OR (requester_id = ? AND addressee_id = ?)
     LIMIT 1`,
    [userId, otherUserId, otherUserId, userId]
  );
  return rows[0] || null;
};

const searchUsers = async (req, res) => {
  const search = String(req.query.search || '').trim();
  if (search.length < 2) {
    return res.status(400).json({ error: 'Search must be at least 2 characters' });
  }

  try {
    await ensureFriendshipsTable();
    const [users] = await db.query(
      `SELECT ${userSelect},
        f.id AS friendship_id,
        f.status AS friendship_status,
        f.requester_id,
        f.addressee_id
       FROM users u
       LEFT JOIN friendships f
         ON ((f.requester_id = ? AND f.addressee_id = u.id)
          OR (f.requester_id = u.id AND f.addressee_id = ?))
        AND f.status IN ('pending', 'accepted')
       WHERE u.id <> ?
         AND u.is_banned = FALSE
         AND u.username LIKE ?
       ORDER BY u.username ASC
       LIMIT 20`,
      [DEFAULT_AVATAR_URL, req.user.id, req.user.id, req.user.id, `%${search}%`]
    );

    res.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        avatar_url: user.avatar_url,
        bio: user.bio,
        friendship: user.friendship_status
          ? {
              id: user.friendship_id,
              status: user.friendship_status,
              direction: user.requester_id === req.user.id ? 'outgoing' : 'incoming',
            }
          : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search users', details: err.message });
  }
};

const getFriends = async (req, res) => {
  try {
    await ensureFriendshipsTable();
    const [friends] = await db.query(
      `SELECT f.id AS friendship_id, f.accepted_at, ${userSelect}
       FROM friendships f
       JOIN users u
         ON u.id = CASE
           WHEN f.requester_id = ? THEN f.addressee_id
           ELSE f.requester_id
         END
       WHERE (f.requester_id = ? OR f.addressee_id = ?)
         AND f.status = 'accepted'
       ORDER BY f.accepted_at DESC, u.username ASC`,
      [DEFAULT_AVATAR_URL, req.user.id, req.user.id, req.user.id]
    );

    res.json({ friends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends', details: err.message });
  }
};

const getRequests = async (req, res) => {
  try {
    await ensureFriendshipsTable();
    const [incoming] = await db.query(
      `SELECT f.id AS request_id, f.created_at, ${userSelect}
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [DEFAULT_AVATAR_URL, req.user.id]
    );
    const [outgoing] = await db.query(
      `SELECT f.id AS request_id, f.created_at, ${userSelect}
       FROM friendships f
       JOIN users u ON u.id = f.addressee_id
       WHERE f.requester_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [DEFAULT_AVATAR_URL, req.user.id]
    );

    res.json({ incoming, outgoing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friend requests', details: err.message });
  }
};

const sendRequest = async (req, res) => {
  const addresseeId = Number(req.body.user_id);
  if (!addresseeId) return res.status(400).json({ error: 'User id is required' });
  if (addresseeId === req.user.id) {
    return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
  }

  try {
    await ensureFriendshipsTable();
    const [targets] = await db.query(
      'SELECT id FROM users WHERE id = ? AND is_banned = FALSE',
      [addresseeId]
    );
    if (!targets.length) return res.status(404).json({ error: 'User not found' });

    const existing = await findRelationship(req.user.id, addresseeId);
    if (existing?.status === 'accepted') {
      return res.status(409).json({ error: 'You are already friends' });
    }
    if (existing?.status === 'pending') {
      return res.status(409).json({ error: 'A friend request already exists' });
    }

    if (existing) {
      await db.query(
        `UPDATE friendships
         SET requester_id = ?, addressee_id = ?, status = 'pending', accepted_at = NULL
         WHERE id = ?`,
        [req.user.id, addresseeId, existing.id]
      );
      return res.status(201).json({ message: 'Friend request sent', request_id: existing.id });
    }

    const [result] = await db.query(
      'INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, ?)',
      [req.user.id, addresseeId, 'pending']
    );
    res.status(201).json({ message: 'Friend request sent', request_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send friend request', details: err.message });
  }
};

const respondToRequest = async (req, res) => {
  const action = String(req.body.action || '').toLowerCase();
  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accept or decline' });
  }

  try {
    await ensureFriendshipsTable();
    const [rows] = await db.query(
      `SELECT id
       FROM friendships
       WHERE id = ? AND addressee_id = ? AND status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Friend request not found' });

    if (action === 'accept') {
      await db.query(
        `UPDATE friendships
         SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [req.params.id]
      );
      return res.json({ message: 'Friend request accepted' });
    }

    await db.query(
      `UPDATE friendships
       SET status = 'declined', accepted_at = NULL
       WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: 'Friend request declined' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update friend request', details: err.message });
  }
};

const cancelRequest = async (req, res) => {
  try {
    await ensureFriendshipsTable();
    const [result] = await db.query(
      `DELETE FROM friendships
       WHERE id = ? AND requester_id = ? AND status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Friend request not found' });
    res.json({ message: 'Friend request cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel friend request', details: err.message });
  }
};

const removeFriend = async (req, res) => {
  const friendId = Number(req.params.userId);
  if (!friendId) return res.status(400).json({ error: 'User id is required' });

  try {
    await ensureFriendshipsTable();
    const [result] = await db.query(
      `DELETE FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = ? AND addressee_id = ?)
          OR (requester_id = ? AND addressee_id = ?))`,
      [req.user.id, friendId, friendId, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Friend not found' });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove friend', details: err.message });
  }
};

const getPublicProfile = async (req, res) => {
  const profileId = Number(req.params.id);
  if (!profileId) return res.status(400).json({ error: 'User id is required' });

  try {
    await ensureFriendshipsTable();
    const [rows] = await db.query(
      `SELECT id, username, role, COALESCE(NULLIF(avatar_url, ''), ?) AS avatar_url, bio, created_at
       FROM users
       WHERE id = ? AND is_banned = FALSE`,
      [DEFAULT_AVATAR_URL, profileId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const [[threadCount], [commentCount], [friends]] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM threads WHERE author_id = ? AND is_deleted = FALSE', [profileId]),
      db.query('SELECT COUNT(*) AS total FROM comments WHERE author_id = ? AND is_deleted = FALSE', [profileId]),
      db.query(
        `SELECT f.id AS friendship_id, f.accepted_at, ${userSelect}
         FROM friendships f
         JOIN users u
           ON u.id = CASE
             WHEN f.requester_id = ? THEN f.addressee_id
             ELSE f.requester_id
           END
         WHERE (f.requester_id = ? OR f.addressee_id = ?)
           AND f.status = 'accepted'
           AND u.is_banned = FALSE
         ORDER BY f.accepted_at DESC, u.username ASC`,
        [DEFAULT_AVATAR_URL, profileId, profileId, profileId]
      ),
    ]);

    let friendship = null;
    if (req.user && req.user.id !== profileId) {
      const existing = await findRelationship(req.user.id, profileId);
      if (existing && ['pending', 'accepted'].includes(existing.status)) {
        friendship = {
          id: existing.id,
          status: existing.status,
          direction: existing.requester_id === req.user.id ? 'outgoing' : 'incoming',
        };
      }
    }

    res.json({
      profile: {
        ...rows[0],
        stats: {
          topics_created: threadCount[0].total,
          messages_sent: commentCount[0].total,
          friends: friends.length,
        },
      },
      friends,
      friendship,
      is_self: !!req.user && req.user.id === profileId,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
};

module.exports = {
  getPublicProfile,
  searchUsers,
  getFriends,
  getRequests,
  sendRequest,
  respondToRequest,
  cancelRequest,
  removeFriend,
};
