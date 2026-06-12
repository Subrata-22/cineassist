import { query } from '../config/database.js';
import { uploadImage } from '../config/cloudinary.js';

export const getChallenges = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
         COUNT(DISTINCT cs.id) AS submission_count,
         EXISTS(SELECT 1 FROM challenge_submissions WHERE challenge_id = c.id AND user_id = $1) AS has_submitted
       FROM challenges c
       LEFT JOIN challenge_submissions cs ON cs.challenge_id = c.id
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.end_date ASC`,
      [req.user?.id || null]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getAllChallengesAdmin = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        c.*,
        COUNT(cs.id) AS submission_count
      FROM challenges c
      LEFT JOIN challenge_submissions cs
        ON cs.challenge_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const getChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const [challenge, submissions] = await Promise.all([
      query(
        `SELECT c.*, COUNT(DISTINCT cs.id) AS submission_count
         FROM challenges c
         LEFT JOIN challenge_submissions cs ON cs.challenge_id = c.id
         WHERE c.id = $1 GROUP BY c.id`,
        [id]
      ),
      query(
        `SELECT cs.id, cs.note, cs.vote_count, cs.created_at,
                a.id AS analysis_id, a.image_url, a.overall_score, a.title,
                u.username, u.avatar_url,
                EXISTS(SELECT 1 FROM submission_votes WHERE submission_id = cs.id AND user_id = $2) AS has_voted
         FROM challenge_submissions cs
         JOIN analyses a ON a.id = cs.analysis_id
         JOIN users u ON u.id = cs.user_id
         WHERE cs.challenge_id = $1
         ORDER BY cs.vote_count DESC
         LIMIT $3 OFFSET $4`,
        [id, req.user?.id || null, limit, offset]
      ),
    ]);

    if (!challenge.rows[0]) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ challenge: challenge.rows[0], submissions: submissions.rows });
  } catch (err) { next(err); }
};

export const submitToChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { analysis_id, note = '' } = req.body;
    if (!analysis_id) return res.status(400).json({ error: 'analysis_id required' });

    // Verify challenge is active
    const challenge = await query(
      'SELECT id, end_date FROM challenges WHERE id = $1 AND is_active = true',
      [id]
    );
    if (!challenge.rows[0]) return res.status(404).json({ error: 'Challenge not found or inactive' });
    if (new Date(challenge.rows[0].end_date) < new Date()) {
      return res.status(400).json({ error: 'Challenge has ended' });
    }

    // Verify user owns the analysis
    const analysis = await query('SELECT id FROM analyses WHERE id = $1 AND user_id = $2', [analysis_id, req.user.id]);
    if (!analysis.rows[0]) return res.status(403).json({ error: 'Analysis not found or not yours' });

    const result = await query(
      `INSERT INTO challenge_submissions (challenge_id, user_id, analysis_id, note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.user.id, analysis_id, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already submitted to this challenge' });
    next(err);
  }
};

export const voteSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const submission = await query(
  'SELECT user_id FROM challenge_submissions WHERE id = $1',
  [submissionId]
);

if (!submission.rows[0]) {
  return res.status(404).json({ error: 'Submission not found' });
}

if (submission.rows[0].user_id === req.user.id) {
  return res.status(400).json({
    error: 'You cannot vote for your own submission'
  });
}
    const exists = await query(
      'SELECT 1 FROM submission_votes WHERE submission_id = $1 AND user_id = $2',
      [submissionId, req.user.id]
    );

    if (exists.rows.length > 0) {
      await query('DELETE FROM submission_votes WHERE submission_id = $1 AND user_id = $2', [submissionId, req.user.id]);
      await query('UPDATE challenge_submissions SET vote_count = vote_count - 1 WHERE id = $1', [submissionId]);
      res.json({ voted: false });
    } else {
      await query('INSERT INTO submission_votes (submission_id, user_id) VALUES ($1, $2)', [submissionId, req.user.id]);
      await query('UPDATE challenge_submissions SET vote_count = vote_count + 1 WHERE id = $1', [submissionId]);
      res.json({ voted: true });
    }
  } catch (err) { next(err); }
};

// Admin: create challenge
export const createChallenge = async (req, res, next) => {
  try {
    const {
  title,
  description,
  theme,
  focus_module,
  banner_url,
  start_date,
  end_date
} = req.body;
    if (!title || !description || !start_date || !end_date) {
      return res.status(400).json({ error: 'title, description, start_date, end_date required' });
    }
   const result = await query(
  `
  INSERT INTO challenges (
    title,
    description,
    theme,
    focus_module,
    banner_url,
    start_date,
    end_date,
    created_by
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
  )
  RETURNING *
  `,
  [
    title,
    description,
    theme,
    focus_module,
    banner_url,
    start_date,
    end_date,
    req.user.id
  ]
);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};
export const uploadChallengeBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image uploaded'
      });
    }

    const result = await uploadImage(
      req.file.buffer,
      {
        folder: 'cineassist/challenge-banners'
      }
    );

    res.json({
      banner_url: result.secure_url
    });
  } catch (err) {
    next(err);
  }
};
export const deleteChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;

    await query(
      'DELETE FROM challenges WHERE id = $1',
      [id]
    );

    res.json({
      success: true
    });
  } catch (err) {
    next(err);
  }
};
