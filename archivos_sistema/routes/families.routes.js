const express = require('express');
const router = express.Router();
const familiesController = require('../controllers/families.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/', authMiddleware, readLimiter, (req, res) => familiesController.getAll(req, res));
router.get('/colony/:colonyId', authMiddleware, readLimiter, (req, res) => familiesController.getByColony(req, res));
router.get('/:id', authMiddleware, readLimiter, (req, res) => familiesController.getById(req, res));
router.post('/', authMiddleware, writeLimiter, (req, res) => familiesController.create(req, res));
router.put('/:id', authMiddleware, writeLimiter, (req, res) => familiesController.update(req, res));
router.delete('/:id', authMiddleware, writeLimiter, (req, res) => familiesController.delete(req, res));

module.exports = router;
