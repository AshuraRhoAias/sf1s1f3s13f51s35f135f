const express = require('express');
const router = express.Router();
const delegationsController = require('../controllers/delegations.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/', authMiddleware, readLimiter, (req, res) => delegationsController.getAll(req, res));
router.get('/state/:stateId', authMiddleware, readLimiter, (req, res) => delegationsController.getByState(req, res));
router.get('/:id', authMiddleware, readLimiter, (req, res) => delegationsController.getById(req, res));
router.post('/', authMiddleware, writeLimiter, (req, res) => delegationsController.create(req, res));
router.put('/:id', authMiddleware, writeLimiter, (req, res) => delegationsController.update(req, res));
router.delete('/:id', authMiddleware, writeLimiter, (req, res) => delegationsController.delete(req, res));

module.exports = router;
