import { query } from '../config/database.js';

export const createSequence = async (req, res, next) => {
  try {
    const { title, description = '', analysis_ids = [], is_public = false } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const result = await query(
      `INSERT INTO sequences (user_id, title, description, analysis_ids, is_public)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, title, description, analysis_ids, is_public]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getMySequences = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM sequences WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getSequence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seq = await query(
      'SELECT * FROM sequences WHERE id = $1 AND (is_public = true OR user_id = $2)',
      [id, req.user?.id || null]
    );
    if (!seq.rows[0]) return res.status(404).json({ error: 'Sequence not found' });

    // Fetch analyses in order
    const analyses = seq.rows[0].analysis_ids.length > 0
      ? await query(
          `SELECT id, title, image_url, overall_score, verdict, genre, modules, ai_feedback
           FROM analyses
           WHERE id = ANY($1::uuid[])`,
          [seq.rows[0].analysis_ids]
        )
      : { rows: [] };

    // Return in the original order
    const analysisMap = Object.fromEntries(analyses.rows.map(a => [a.id, a]));
    const orderedAnalyses = seq.rows[0].analysis_ids
      .map(id => analysisMap[id])
      .filter(Boolean);

    res.json({ ...seq.rows[0], analyses: orderedAnalyses });
  } catch (err) { next(err); }
};

export const updateSequence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, analysis_ids, is_public } = req.body;

    const seq = await query('SELECT user_id FROM sequences WHERE id = $1', [id]);
    if (!seq.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (seq.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const result = await query(
      `UPDATE sequences SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         analysis_ids = COALESCE($3, analysis_ids),
         is_public = COALESCE($4, is_public),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, analysis_ids, is_public, id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const deleteSequence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seq = await query('SELECT user_id FROM sequences WHERE id = $1', [id]);
    if (!seq.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (seq.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await query('DELETE FROM sequences WHERE id = $1', [id]);
    res.json({ message: 'Sequence deleted' });
  } catch (err) { next(err); }
};
