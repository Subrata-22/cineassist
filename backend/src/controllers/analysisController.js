import { query } from '../config/database.js';
import { uploadImage, deleteImage } from '../config/cloudinary.js';
import {
   getAIFeedback,
  getRecompositionSuggestion,
  compareShots,
} from '../services/aiService.js';
import sharp from 'sharp';
import { createNotification } from '../utils/notification.js';

// Save a completed analysis (with image upload to Cloudinary)
export const createAnalysis = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });
    const image = sharp(req.file.buffer);

    console.log('VALIDATION RUNNING');

const metadata = await image.metadata();
const stats = await image.stats();

// Resolution check
if (metadata.width < 300 || metadata.height < 300) {
  return res.status(400).json({
    error: 'Image resolution is too low'
  });
}

// Average brightness
const brightness =
  (stats.channels[0].mean +
   stats.channels[1].mean +
   stats.channels[2].mean) / 3;

// Too dark
if (brightness < 20) {
  return res.status(400).json({
    error: 'Image is too dark for analysis'
  });
}

// Too bright / white
if (brightness > 235) {
  return res.status(400).json({
    error: 'Image is too bright or appears blank'
  });
}

// Low detail / solid color image
const detail =
  stats.channels[0].stdev +
  stats.channels[1].stdev +
  stats.channels[2].stdev;

console.log('BRIGHTNESS =', brightness);
console.log('DETAIL =', detail);

if (detail < 35) {
  return res.status(400).json({
    error: 'This does not appear to be a valid photograph'
  });
}

    const {
      title = 'Untitled Shot',
      overall_score,
      verdict,
      modules,
      is_public = true,
      image_width,
      image_height,
    } = req.body;

    if (!overall_score || !modules) {
      return res.status(400).json({ error: 'overall_score and modules are required' });
    }

    const parsedModules = typeof modules === 'string' ? JSON.parse(modules) : modules;

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(req.file.buffer, {
      public_id: `cineassist/${req.user.id}/${Date.now()}`,
    });


// Get AI feedback (non-blocking — if it fails, we still save)

    // Get AI feedback (non-blocking — if it fails, we still save)
    let aiFeedback = null;
    let genre = null;
    let mood = null;
    let aiSuggestions = [];
    let crop = null;

    try {
      if (image_width && image_height) {
        crop = await getRecompositionSuggestion(
          uploadResult.secure_url,
          parseInt(image_width),
          parseInt(image_height)
        );
      }
    } catch (cropErr) {
      console.warn('Recomposition failed (non-fatal):', cropErr.message);
    }

  
    // Save to database
    const result = await query(
      `INSERT INTO analyses
         (user_id, title, image_url, image_public_id, overall_score, verdict, genre, mood,
          modules, ai_feedback, ai_suggestions, recomposition_crop, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id, title, uploadResult.secure_url, uploadResult.public_id,
        parseInt(overall_score), verdict, genre, mood,
        JSON.stringify(parsedModules), aiFeedback,
        aiSuggestions, crop ? JSON.stringify(crop) : null,
        is_public === 'true' || is_public === true,
      ]
    );

    // Record score history
    await query(
      `INSERT INTO score_history (user_id, analysis_id, overall_score, modules)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, result.rows[0].id, parseInt(overall_score), JSON.stringify(parsedModules)]
    );

    res.status(201).json({
  ...result.rows[0],
});
  } catch (err) {
    next(err);
  }
};

// Get paginated analyses for current user
export const getMyAnalyses = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;
    const orderBy = sort === 'score' ? 'overall_score DESC' : 'created_at DESC';

    const [rows, count] = await Promise.all([
      query(
        `SELECT id, title, image_url, overall_score, verdict, genre, mood, is_public, view_count, created_at
         FROM analyses WHERE user_id = $1
         ORDER BY ${orderBy} LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query('SELECT COUNT(*) FROM analyses WHERE user_id = $1', [req.user.id]),
    ]);

    res.json({
      analyses: rows.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(count.rows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
};

// Get single analysis by ID
export const getAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT a.*, u.username, u.avatar_url,
         COUNT(DISTINCT l.user_id) AS like_count,
         COUNT(DISTINCT c.id) AS comment_count,
         EXISTS(SELECT 1 FROM likes WHERE analysis_id = a.id AND user_id = $2) AS is_liked
       FROM analyses a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN likes l ON l.analysis_id = a.id
       LEFT JOIN comments c ON c.analysis_id = a.id
       WHERE a.id = $1 AND (a.is_public = true OR a.user_id = $2)
       GROUP BY a.id, u.username, u.avatar_url`,
      [id, req.user?.id || null]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Analysis not found' });

    // Increment view count if not the owner
    if (req.user && result.rows[0].user_id !== req.user.id) {

      console.log('VIEW ATTEMPT:', req.user?.id, id);
  
      const viewResult = await query(
    `
    INSERT INTO analysis_views (user_id, analysis_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
    `,
    [req.user.id, id]
  );

  if (viewResult.rows.length > 0) {
    await query(
      'UPDATE analyses SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete analysis
export const deleteAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT image_public_id, user_id FROM analyses WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (result.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (result.rows[0].image_public_id) {
      await deleteImage(result.rows[0].image_public_id).catch(() => {});
    }
    await query('DELETE FROM analyses WHERE id = $1', [id]);
    res.json({ message: 'Analysis deleted' });
  } catch (err) {
    next(err);
  }
};

// Toggle like
export const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND analysis_id = $2',
      [req.user.id, id]
    );
    if (existing.rows.length > 0) {
      await query('DELETE FROM likes WHERE user_id = $1 AND analysis_id = $2', [req.user.id, id]);
      res.json({ liked: false });
    } else {
      await query(
  'INSERT INTO likes (user_id, analysis_id) VALUES ($1, $2)',
  [req.user.id, id]
);

// Get analysis owner
const analysis = await query(
  'SELECT user_id FROM analyses WHERE id = $1',
  [id]
);

// Don't notify yourself
if (
  analysis.rows.length > 0 &&
  analysis.rows[0].user_id !== req.user.id
) {
  await createNotification({
    userId: analysis.rows[0].user_id,
    actorId: req.user.id,
    analysisId: id,
    type: 'like',
    message: `${req.user.username} liked your shot`
  });
}

res.json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
};

// Public feed / explore
export const getPublicFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sort = 'newest', genre } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.is_public = true';
    const params = [limit, offset];
    if (genre && genre !== 'undefined') {
      whereClause += ` AND a.genre ILIKE $3`;
      params.push(`%${genre}%`);
    }

    const orderMap = {
      newest: 'a.created_at DESC',
      top: 'a.overall_score DESC',
      popular: 'like_count DESC',
    };
    const orderBy = orderMap[sort] || orderMap.newest;

    const result = await query(
      `SELECT a.id, a.title, a.image_url, a.overall_score, a.verdict, a.genre, a.mood,
              a.view_count, a.created_at,
              u.username, u.avatar_url,
              COUNT(DISTINCT l.user_id) AS like_count,
              COUNT(DISTINCT c.id) AS comment_count
       FROM analyses a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN likes l ON l.analysis_id = a.id
       LEFT JOIN comments c ON c.analysis_id = a.id
       ${whereClause}
       GROUP BY a.id, u.username, u.avatar_url
       ORDER BY ${orderBy}
       LIMIT $1 OFFSET $2`,
      params
    );

    res.json({ analyses: result.rows, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

// Compare two shots using AI
export const compareTwoShots = async (req, res, next) => {
  try {
    const { idA, idB } = req.body;
    if (!idA || !idB) return res.status(400).json({ error: 'Two analysis IDs required' });

    const [a, b] = await Promise.all([
      query('SELECT * FROM analyses WHERE id = $1 AND (is_public = true OR user_id = $2)', [idA, req.user.id]),
      query('SELECT * FROM analyses WHERE id = $1 AND (is_public = true OR user_id = $2)', [idB, req.user.id]),
    ]);
    if (!a.rows[0] || !b.rows[0]) return res.status(404).json({ error: 'One or both analyses not found' });

const comparison = await compareShots(
  a.rows[0].image_url,
  b.rows[0].image_url
);

const winner =
  a.rows[0].overall_score >= b.rows[0].overall_score
    ? 'A'
    : 'B';

res.json({
  comparison,
  winner,
  analysisA: a.rows[0],
  analysisB: b.rows[0]
});
  } catch (err) {
  console.error(err);

  if (err.message === 'SERVICE_BUSY') {
  return res.status(503).json({
    error: 'AI comparison service is currently busy. Please try again in a minute.'
  });
}

if (err.message === 'QUOTA_EXCEEDED') {
  return res.status(429).json({
    error: 'AI comparison quota exceeded. Please try again later.'
  });
}

  return res.status(500).json({
    error: 'Failed to compare shots.'
  });
}
};

// Get score history for trend charts
export const getScoreHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const result = await query(
      `SELECT sh.overall_score, sh.recorded_at, a.title, a.image_url
       FROM score_history sh
       JOIN analyses a ON a.id = sh.analysis_id
       WHERE sh.user_id = $1
         AND sh.recorded_at > NOW() - INTERVAL '${parseInt(days)} days'
       ORDER BY sh.recorded_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};
export const toggleVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_public } = req.body;

    const result = await query(
      `UPDATE analyses
       SET is_public = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [is_public, id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const renameAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await query(
      `UPDATE analyses
       SET title = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [title.trim(), id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
  next(err);
}
};
  export const generateAIReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM analyses WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    const analysis = result.rows[0];

    const aiResult = await getAIFeedback(
  analysis.image_url,
  Array.isArray(analysis.modules)
    ? analysis.modules
    : JSON.parse(analysis.modules || '[]')
);
    await query(
      `UPDATE analyses
       SET ai_feedback = $1,
           genre = $2,
           mood = $3,
           ai_suggestions = $4
       WHERE id = $5`,
      [
        aiResult.overall_assessment,
        aiResult.genre,
        aiResult.mood,
        aiResult.suggestions,
        id
      ]
    );

    res.json(aiResult);

 } catch (err) {
  console.error(err);
  console.log('ERROR MESSAGE:', err.message);

  if (err.message === 'QUOTA_EXCEEDED') {
  return res.status(429).json({
    error: 'AI review quota exceeded. Please try again later.'
  });
}

 if (err.message === 'SERVICE_BUSY') {
  return res.status(503).json({
    error: 'AI review service is currently busy. Please try again in a minute.'
  });
}

  return res.status(500).json({
    error: 'Failed to generate AI review.'
  });
}
};