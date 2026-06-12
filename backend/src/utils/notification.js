import { query } from '../config/database.js';

export const createNotification = async ({
  userId,
  actorId,
  analysisId = null,
  type,
  message
}) => {
  await query(
    `INSERT INTO notifications
     (user_id, actor_id, analysis_id, type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, actorId, analysisId, type, message]
  );
};