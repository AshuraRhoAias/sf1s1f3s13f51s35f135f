const express = require('express');
const router = express.Router();
const statesController = require('../controllers/states.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/', authMiddleware, readLimiter, (req, res) => statesController.getAll(req, res));
router.get('/search', authMiddleware, readLimiter, (req, res) => statesController.search(req, res));
router.get('/:id', authMiddleware, readLimiter, (req, res) => statesController.getById(req, res));
router.get('/:id/stats', authMiddleware, readLimiter, (req, res) => statesController.getStats(req, res));
router.post('/', authMiddleware, writeLimiter, (req, res) => statesController.create(req, res));
router.put('/:id', authMiddleware, writeLimiter, (req, res) => statesController.update(req, res));
router.delete('/:id', authMiddleware, writeLimiter, (req, res) => statesController.delete(req, res));

module.exports = router;
