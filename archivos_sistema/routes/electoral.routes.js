const express = require('express');
const router = express.Router();
const electoralController = require('../controllers/electoral.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/stats', authMiddleware, readLimiter, (req, res) => electoralController.getStats(req, res));
router.get('/states', authMiddleware, readLimiter, (req, res) => electoralController.getAllStates(req, res));
router.get('/search', authMiddleware, readLimiter, (req, res) => electoralController.search(req, res));

module.exports = router;
