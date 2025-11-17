const express = require('express');
const router = express.Router();
const coloniesController = require('../controllers/colonies.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/', authMiddleware, readLimiter, (req, res) => coloniesController.getAll(req, res));
router.get('/delegation/:delegationId', authMiddleware, readLimiter, (req, res) => coloniesController.getByDelegation(req, res));
router.get('/:id', authMiddleware, readLimiter, (req, res) => coloniesController.getById(req, res));
router.post('/', authMiddleware, writeLimiter, (req, res) => coloniesController.create(req, res));
router.put('/:id', authMiddleware, writeLimiter, (req, res) => coloniesController.update(req, res));
router.delete('/:id', authMiddleware, writeLimiter, (req, res) => coloniesController.delete(req, res));

module.exports = router;
