const stateService = require('../services/state.service');

class StatesController {
    async getAll(req, res) {
        try {
            const states = await stateService.getAllStates();
            res.json({ success: true, data: states });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const state = await stateService.getStateById(req.params.id);
            res.json({ success: true, data: state });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const state = await stateService.createState(req.body);
            res.status(201).json({ success: true, data: state });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const state = await stateService.updateState(req.params.id, req.body);
            res.json({ success: true, data: state });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const result = await stateService.deleteState(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async search(req, res) {
        try {
            const { q } = req.query;
            const states = await stateService.searchStates(q);
            res.json({ success: true, data: states });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await stateService.getStateStats(req.params.id);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new StatesController();
