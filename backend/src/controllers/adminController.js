import { query } from '../config/database.js';

export const getAnalytics = async (
  req,
  res,
  next
) => {
  try {
    const [
      users,
      analyses,
      challenges,
      submissions,
      votes
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM analyses'),
      query('SELECT COUNT(*) FROM challenges'),
      query('SELECT COUNT(*) FROM challenge_submissions'),
      query('SELECT COUNT(*) FROM submission_votes')
    ]);

    res.json({
      users: Number(users.rows[0].count),
      analyses: Number(analyses.rows[0].count),
      challenges: Number(challenges.rows[0].count),
      submissions: Number(submissions.rows[0].count),
      votes: Number(votes.rows[0].count)
    });

  } catch (err) {
    next(err);
  }
};