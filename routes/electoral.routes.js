// ============================================
// 📁 electoral.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const electoralController = require('../controllers/electoral.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimiter = require('../middleware/rateLimiter.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ==================== DASHBOARD ====================
router.get('/stats', rateLimiter(100, 1), electoralController.getGeneralStats);
router.get('/monthly-summary', rateLimiter(100, 1), electoralController.getMonthlySummary);
router.get('/recent-activity', rateLimiter(100, 1), electoralController.getRecentActivity);

// ==================== ESTADOS ====================
router.get('/states', rateLimiter(100, 1), electoralController.getAllStates);
router.get('/states/:id', rateLimiter(100, 1), electoralController.getStateById);
router.post('/states', rateLimiter(20, 1), electoralController.createState);
router.put('/states/:id', rateLimiter(20, 1), electoralController.updateState);
router.delete('/states/:id', rateLimiter(10, 1), electoralController.deleteState);

// ==================== DELEGACIONES ====================
router.get('/states/:stateId/delegations', rateLimiter(100, 1), electoralController.getDelegationsByState);
router.get('/delegations/:id', rateLimiter(100, 1), electoralController.getDelegationById);
router.post('/delegations', rateLimiter(20, 1), electoralController.createDelegation);
router.put('/delegations/:id', rateLimiter(20, 1), electoralController.updateDelegation);
router.delete('/delegations/:id', rateLimiter(10, 1), electoralController.deleteDelegation);

// ==================== COLONIAS ====================
router.get('/delegations/:delegationId/colonies', rateLimiter(100, 1), electoralController.getColoniesByDelegation);
router.post('/colonies', rateLimiter(20, 1), electoralController.createColony);
router.put('/colonies/:id', rateLimiter(20, 1), electoralController.updateColony);
router.delete('/colonies/:id', rateLimiter(10, 1), electoralController.deleteColony);

// ==================== FAMILIAS ====================
router.get('/families', rateLimiter(100, 1), electoralController.getAllFamilies);
router.get('/families/:id', rateLimiter(100, 1), electoralController.getFamilyById);
router.post('/families', rateLimiter(20, 1), electoralController.createFamily);
router.put('/families/:id', rateLimiter(20, 1), electoralController.updateFamily);
router.delete('/families/:id', rateLimiter(10, 1), electoralController.deleteFamily);

// ==================== PERSONAS ====================
router.get('/persons', rateLimiter(100, 1), electoralController.getAllPersons);
router.get('/persons/:id', rateLimiter(100, 1), electoralController.getPersonById);
router.post('/persons', rateLimiter(20, 1), electoralController.createPerson);
router.put('/persons/:id', rateLimiter(20, 1), electoralController.updatePerson);
router.delete('/persons/:id', rateLimiter(10, 1), electoralController.deletePerson);

// ==================== BÚSQUEDA ====================
router.get('/search', rateLimiter(50, 1), electoralController.search);
router.get('/search/curp/:curp', rateLimiter(50, 1), electoralController.searchByCurp);

// ==================== REPORTES ====================
router.get('/reports/state/:stateId', rateLimiter(20, 1), electoralController.generateStateReport);
router.get('/reports/delegation/:delegationId', rateLimiter(20, 1), electoralController.generateDelegationReport);
router.get('/export/csv', rateLimiter(10, 1), electoralController.exportToCSV);

// ==================== ANALYTICS ====================
router.get('/analytics/coverage', rateLimiter(50, 1), electoralController.getCoverageAnalytics);
router.get('/analytics/trends', rateLimiter(50, 1), electoralController.getGrowthTrends);

module.exports = router;