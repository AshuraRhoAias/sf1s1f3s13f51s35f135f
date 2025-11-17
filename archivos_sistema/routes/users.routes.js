const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/', authMiddleware, readLimiter, (req, res) => usersController.getAll(req, res));
router.get('/:id', authMiddleware, readLimiter, (req, res) => usersController.getById(req, res));
router.get('/:id/activity', authMiddleware, readLimiter, (req, res) => usersController.getActivity(req, res));
router.get('/:id/stats', authMiddleware, readLimiter, (req, res) => usersController.getStats(req, res));
router.post('/', authMiddleware, writeLimiter, (req, res) => usersController.create(req, res));
router.put('/:id', authMiddleware, writeLimiter, (req, res) => usersController.update(req, res));
router.put('/:id/password', authMiddleware, writeLimiter, (req, res) => usersController.changePassword(req, res));
router.delete('/:id', authMiddleware, writeLimiter, (req, res) => usersController.delete(req, res));

module.exports = router;
