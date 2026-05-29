const router = require('express').Router();
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');

const auth = require('../controllers/authController');
const threads = require('../controllers/threadController');
const comments = require('../controllers/commentController');
const votes = require('../controllers/voteController');
const cats = require('../controllers/categoryController');
const mod = require('../controllers/moderationController');
const profile = require('../controllers/profileController');
const friends = require('../controllers/friendController');

// --- AUTH ---
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.getMe);
router.get('/profile/me', authenticate, profile.getMyProfile);
router.put('/profile/me', authenticate, profile.updateMyProfile);

// --- FRIENDS ---
router.get('/users/:id/profile', optionalAuthenticate, friends.getPublicProfile);
router.get('/users/search', authenticate, friends.searchUsers);
router.get('/friends', authenticate, friends.getFriends);
router.get('/friends/requests', authenticate, friends.getRequests);
router.post('/friends/requests', authenticate, friends.sendRequest);
router.patch('/friends/requests/:id', authenticate, friends.respondToRequest);
router.delete('/friends/requests/:id', authenticate, friends.cancelRequest);
router.delete('/friends/:userId', authenticate, friends.removeFriend);

// --- THREADS ---
router.get('/threads', optionalAuthenticate, threads.getThreads);
router.get('/threads/:slug', optionalAuthenticate, threads.getThread);
router.post('/threads', authenticate, threads.createThread);
router.put('/threads/:id', authenticate, threads.updateThread);
router.delete('/threads/:id', authenticate, threads.deleteThread);

// --- COMMENTS ---
router.get('/threads/:threadId/comments', optionalAuthenticate, comments.getComments);
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
router.post('/tags', authenticate, cats.createTag);

// --- MODERATION ---
router.get('/admin/users', authenticate, authorize('admin'), mod.getUsers);
router.get('/admin/threads', authenticate, authorize('admin'), mod.getThreads);
router.get('/admin/comments', authenticate, authorize('admin'), mod.getComments);
router.patch('/admin/users/:id/ban', authenticate, authorize('admin'), mod.banUser);
router.patch('/admin/users/:id/role', authenticate, authorize('admin'), mod.changeRole);
router.patch('/admin/threads/:id/pin', authenticate, authorize('admin', 'moderator'), mod.pinThread);
router.patch('/admin/threads/:id/lock', authenticate, authorize('admin', 'moderator'), mod.lockThread);

module.exports = router;
