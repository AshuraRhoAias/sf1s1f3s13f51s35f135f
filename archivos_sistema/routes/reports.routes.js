const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { readLimiter } = require('../middleware/rateLimiter.middleware');

router.get('/general', authMiddleware, readLimiter, (req, res) => reportsController.getGeneralStatistics(req, res));
router.get('/coverage', authMiddleware, readLimiter, (req, res) => reportsController.getCoverageAnalytics(req, res));
router.get('/voters', authMiddleware, readLimiter, (req, res) => reportsController.getVoterAnalytics(req, res));
router.get('/users', authMiddleware, readLimiter, (req, res) => reportsController.getUsersReport(req, res));
router.get('/state/:stateId', authMiddleware, readLimiter, (req, res) => reportsController.getStateReport(req, res));
router.get('/delegation/:delegationId', authMiddleware, readLimiter, (req, res) => reportsController.getDelegationReport(req, res));
router.get('/export', authMiddleware, readLimiter, (req, res) => reportsController.exportData(req, res));

module.exports = router;
