import { Router } from 'express';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as analysis from '../controllers/analysisController.js';
import * as social from '../controllers/socialController.js';
import * as challenge from '../controllers/challengeController.js';
import * as sequence from '../controllers/sequenceController.js';

const router = Router();

// ── Auth ───────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.getMe);
router.patch('/auth/profile', authenticate, auth.updateProfile);
router.post(
  '/auth/avatar',
  authenticate,
  upload.single('avatar'),
  auth.uploadAvatar
);
router.delete('/auth/account', authenticate, auth.deleteAccount);

// ── Analyses ───────────────────────────────────────────
router.post('/analyses', authenticate, upload.single('image'), analysis.createAnalysis);
router.get('/analyses/me', authenticate, analysis.getMyAnalyses);
router.get('/analyses/feed', optionalAuth, analysis.getPublicFeed);
router.get('/analyses/history', authenticate, analysis.getScoreHistory);
router.post('/analyses/compare', authenticate, analysis.compareTwoShots);
router.post(
  '/analyses/:id/ai-review',
  authenticate,
  analysis.generateAIReview
);
router.get('/analyses/:id', optionalAuth, analysis.getAnalysis);
router.delete('/analyses/:id', authenticate, analysis.deleteAnalysis);
router.patch('/analyses/:id/visibility', authenticate, analysis.toggleVisibility);
router.patch('/analyses/:id/rename', authenticate, analysis.renameAnalysis);
router.post('/analyses/:id/like', authenticate, analysis.toggleLike);

// ── Comments ───────────────────────────────────────────
router.get('/analyses/:analysisId/comments', optionalAuth, social.getComments);
router.post('/analyses/:analysisId/comments', authenticate, social.addComment);
router.delete('/comments/:commentId', authenticate, social.deleteComment);

// ── Social ─────────────────────────────────────────────
router.post('/users/:userId/follow', authenticate, social.followUser);
router.get('/users/:userId/followers', optionalAuth, social.getFollowers);
router.get('/users/:userId/following', optionalAuth, social.getFollowing);
router.get('/users/:username/profile', optionalAuth, social.getUserProfile);
router.get('/users/:username/analyses', optionalAuth, social.getUserAnalyses);
router.get('/social/feed', authenticate, social.getFollowingFeed);
router.get('/social/leaderboard', optionalAuth, social.getLeaderboard);
router.get(
  '/notifications',
  authenticate,
  social.getNotifications
);

router.post(
  '/notifications/read',
  authenticate,
  social.markNotificationsRead
);

// ── Challenges ─────────────────────────────────────────
router.get('/challenges', optionalAuth, challenge.getChallenges);
router.get(
  '/admin/challenges',
  authenticate,
  requireAdmin,
  challenge.getAllChallengesAdmin
);
router.post('/challenges', authenticate, requireAdmin, challenge.createChallenge);
router.delete(
  '/challenges/:id',
  authenticate,
  requireAdmin,
  challenge.deleteChallenge
);
router.post(
  '/challenges/banner',
  authenticate,
  requireAdmin,
  upload.single('banner'),
  challenge.uploadChallengeBanner
);
router.get('/challenges/:id', optionalAuth, challenge.getChallenge);
router.post('/challenges/:id/submit', authenticate, challenge.submitToChallenge);
router.post('/challenge-submissions/:submissionId/vote', authenticate, challenge.voteSubmission);

// ── Sequences (storyboard) ─────────────────────────────
router.post('/sequences', authenticate, sequence.createSequence);
router.get('/sequences/me', authenticate, sequence.getMySequences);
router.get('/sequences/:id', optionalAuth, sequence.getSequence);
router.patch('/sequences/:id', authenticate, sequence.updateSequence);
router.delete('/sequences/:id', authenticate, sequence.deleteSequence);

export default router;
