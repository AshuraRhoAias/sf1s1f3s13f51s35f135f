const express = require('express');
const router = express.Router();
const personsController = require('../controllers/persons.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/', authMiddleware, readLimiter, (req, res) => personsController.getAll(req, res));
router.get('/search', authMiddleware, readLimiter, (req, res) => personsController.search(req, res));
router.get('/family/:familyId', authMiddleware, readLimiter, (req, res) => personsController.getByFamily(req, res));
router.get('/:id', authMiddleware, readLimiter, (req, res) => personsController.getById(req, res));
router.post('/', authMiddleware, writeLimiter, (req, res) => personsController.create(req, res));
router.post('/batch', authMiddleware, writeLimiter, (req, res) => personsController.batchCreate(req, res));
router.put('/:id', authMiddleware, writeLimiter, (req, res) => personsController.update(req, res));
router.delete('/:id', authMiddleware, writeLimiter, (req, res) => personsController.delete(req, res));

module.exports = router;
