const electoralService = require('../services/electoral.service');

class ElectoralController {
    async getStats(req, res) {
        try {
            const stats = await electoralService.getGeneralStats();
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getAllStates(req, res) {
        try {
            const states = await electoralService.getAllStates();
            res.json({ success: true, data: states });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async search(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ success: false, error: 'Query parameter required' });
            }
            const results = await electoralService.search(q);
            res.json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ElectoralController();
