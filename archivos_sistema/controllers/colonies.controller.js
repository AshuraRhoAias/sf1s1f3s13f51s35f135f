const colonyService = require('../services/colony.service');

class ColoniesController {
    async getAll(req, res) {
        try {
            const colonies = await colonyService.getAllColonies(req.query);
            res.json({ success: true, data: colonies });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const colony = await colonyService.getColonyById(req.params.id);
            res.json({ success: true, data: colony });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const colony = await colonyService.createColony(req.body);
            res.status(201).json({ success: true, data: colony });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const colony = await colonyService.updateColony(req.params.id, req.body);
            res.json({ success: true, data: colony });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const result = await colonyService.deleteColony(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async getByDelegation(req, res) {
        try {
            const colonies = await colonyService.getColoniesByDelegation(req.params.delegationId);
            res.json({ success: true, data: colonies });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ColoniesController();
