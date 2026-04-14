const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');

const auth = require('../controllers/authController');
const threads = require('../controllers/threadController');
const comments = require('../controllers/commentController');
const votes = require('../controllers/voteController');
const cats = require('../controllers/categoryController');
const mod = require('../controllers/moderationController');

// --- AUTH ---
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.getMe);

// --- THREADS ---
router.get('/threads', threads.getThreads);
router.get('/threads/:slug', threads.getThread);
router.post('/threads', authenticate, threads.createThread);
router.put('/threads/:id', authenticate, threads.updateThread);
router.delete('/threads/:id', authenticate, threads.deleteThread);

// --- COMMENTS ---
router.get('/threads/:threadId/comments', comments.getComments);
router.post('/threads/:threadId/comments', authenticate, comments.createComment);
router.put('/comments/:id', authenticate, comments.updateComment);
router.delete('/comments/:id', authenticate, comments.deleteComment);

// --- VOTES ---
router.post('/vote', authenticate, votes.vote);

// --- CATEGORIES ---
router.get('/categories', cats.getCategories);
router.post('/categories', authenticate, authorize('admin'), cats.createCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), cats.deleteCategory);

// --- TAGS ---
router.get('/tags', cats.getTags);
router.post('/tags', authenticate, authorize('admin', 'moderator'), cats.createTag);

// --- MODERATION ---
router.get('/admin/users', authenticate, authorize('admin'), mod.getUsers);
router.patch('/admin/users/:id/ban', authenticate, authorize('admin'), mod.banUser);
router.patch('/admin/users/:id/role', authenticate, authorize('admin'), mod.changeRole);
router.patch('/admin/threads/:id/pin', authenticate, authorize('admin', 'moderator'), mod.pinThread);
router.patch('/admin/threads/:id/lock', authenticate, authorize('admin', 'moderator'), mod.lockThread);

module.exports = router;
