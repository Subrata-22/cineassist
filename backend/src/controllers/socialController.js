import { query } from '../config/database.js';
import { createNotification } from '../utils/notification.js';

// ── Comments ──────────────────────────────────────────
export const getComments = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const result = await query(
      `SELECT c.id, c.content, c.parent_id, c.created_at,
              u.id AS user_id, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.analysis_id = $1
       ORDER BY c.created_at ASC`,
      [analysisId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const addComment = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { content, parent_id } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment content required' });

    // Verify analysis exists and is accessible
    const analysis = await query(
      'SELECT id, user_id FROM analyses WHERE id = $1 AND (is_public = true OR user_id = $2)',
      [analysisId, req.user.id]
    );
    if (!analysis.rows[0]) return res.status(404).json({ error: 'Analysis not found' });

    const result = await query(
      `INSERT INTO comments (analysis_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, parent_id, created_at`,
      [analysisId, req.user.id, content.trim(), parent_id || null]
    );

    if (parent_id) {
  const parentComment = await query(
    `
    SELECT user_id
    FROM comments
    WHERE id = $1
    `,
    [parent_id]
  );

  if (
    parentComment.rows[0] &&
    parentComment.rows[0].user_id !== req.user.id
  ) {
    await createNotification({
      userId:
        parentComment.rows[0].user_id,
      actorId: req.user.id,
      analysisId,
      type: 'reply',
      message:
        `${req.user.username} replied to your comment`
    });
  }
}

    // Create notification for analysis owner
if (analysis.rows[0].user_id !== req.user.id) {
  await createNotification({
    userId: analysis.rows[0].user_id,
    actorId: req.user.id,
    analysisId,
    type: 'comment',
    message: `${req.user.username} commented on your shot`
  });
}
    res.status(201).json({
      ...result.rows[0],
      user_id: req.user.id,
      username: req.user.username,
      avatar_url: req.user.avatar_url,
    });
  } catch (err) { next(err); }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const result = await query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Comment not found' });
    if (result.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
};

// ── Follows ───────────────────────────────────────────
export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const exists = await query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, userId]
    );

    if (exists.rows.length > 0) {
      await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, userId]);
      res.json({ following: false });
   } else {
  await query(
    'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
    [req.user.id, userId]
  );

  console.log('CREATING NOTIFICATION');

await createNotification({
  userId: userId,
  actorId: req.user.id,
  type: 'follow',
  message: `${req.user.username} followed you`
});

console.log('NOTIFICATION CREATED');

  res.json({ following: true });
}
  } catch (err) { next(err); }
};

export const searchUsers = async (
  req,
  res,
  next
) => {
  try {
    const { q = '' } = req.query;

    const result = await query(
      `
      SELECT
        id,
        username,
        avatar_url
      FROM users
      WHERE
        username ILIKE $1
        AND is_active = true
      ORDER BY username
      LIMIT 20
      `,
      [`%${q}%`]
    );

    res.json(result.rows);

  } catch (err) {
    next(err);
  }
};

// ── User profile ──────────────────────────────────────
export const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const result = await query(
      `SELECT u.id, u.username, u.avatar_url, u.bio, u.created_at,
         COUNT(DISTINCT a.id) AS analysis_count,
         COALESCE(AVG(a.overall_score), 0)::INTEGER AS avg_score,
         COUNT(DISTINCT f1.following_id) AS following_count,
         COUNT(DISTINCT f2.follower_id) AS follower_count,
         EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) AS is_following
       FROM users u
       LEFT JOIN analyses a ON a.user_id = u.id AND a.is_public = true
       LEFT JOIN follows f1 ON f1.follower_id = u.id
       LEFT JOIN follows f2 ON f2.following_id = u.id
       WHERE u.username = $1 AND u.is_active = true
       GROUP BY u.id`,
      [username.toLowerCase(), req.user?.id || null]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getUserAnalyses = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const user = await query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });

    const isOwner = req.user?.id === user.rows[0].id;
    const visibilityClause = isOwner ? '' : 'AND a.is_public = true';

    const result = await query(
      `SELECT a.id, a.title, a.image_url, a.overall_score, a.verdict, a.genre, a.mood,
              a.view_count, a.created_at,
              COUNT(DISTINCT l.user_id) AS like_count
       FROM analyses a
       LEFT JOIN likes l ON l.analysis_id = a.id
       WHERE a.user_id = $1 ${visibilityClause}
       GROUP BY a.id
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.rows[0].id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ── Leaderboard ───────────────────────────────────────
export const getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'top_score', period = 'all' } = req.query;
    let dateClause = '';
    if (period === 'week') dateClause = "AND a.created_at > NOW() - INTERVAL '7 days'";
    else if (period === 'month') dateClause = "AND a.created_at > NOW() - INTERVAL '30 days'";

    let orderBy;
    switch (type) {
      case 'top_score': orderBy = 'MAX(a.overall_score) DESC'; break;
      case 'avg_score': orderBy = 'AVG(a.overall_score) DESC'; break;
      case 'most_analyses': orderBy = 'COUNT(a.id) DESC'; break;
      default: orderBy = 'MAX(a.overall_score) DESC';
    }

    const result = await query(
      `SELECT u.id, u.username, u.avatar_url,
         COUNT(a.id) AS analysis_count,
         MAX(a.overall_score) AS best_score,
         ROUND(AVG(a.overall_score)) AS avg_score,
         COUNT(DISTINCT l.user_id) AS total_likes
       FROM users u
       JOIN analyses a ON a.user_id = u.id AND a.is_public = true ${dateClause}
       LEFT JOIN likes l ON l.analysis_id = a.id
       GROUP BY u.id
       ORDER BY ${orderBy}
       LIMIT 20`,
      []
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ── Feed from followed users ──────────────────────────
export const getFollowingFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT a.id, a.title, a.image_url, a.overall_score, a.verdict, a.genre,
              a.created_at, u.username, u.avatar_url,
              COUNT(DISTINCT l.user_id) AS like_count,
              COUNT(DISTINCT c.id) AS comment_count,
              EXISTS(SELECT 1 FROM likes WHERE analysis_id = a.id AND user_id = $1) AS is_liked
       FROM analyses a
       JOIN users u ON u.id = a.user_id
       JOIN follows f ON f.following_id = a.user_id AND f.follower_id = $1
       LEFT JOIN likes l ON l.analysis_id = a.id
       LEFT JOIN comments c ON c.analysis_id = a.id
       WHERE a.is_public = true
       GROUP BY a.id, u.username, u.avatar_url
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};
export const getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      `
      SELECT
        n.*,
        u.username,
        u.avatar_url
      FROM notifications n
      LEFT JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};
export const markNotificationsRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `
      SELECT
        u.id,
        u.username,
        u.avatar_url
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = $1
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `
      SELECT
        u.id,
        u.username,
        u.avatar_url
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = $1
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};