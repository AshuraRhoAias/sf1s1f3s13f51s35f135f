const familyService = require('../services/family.service');

class FamiliesController {
    async getAll(req, res) {
        try {
            const { page = 1, perPage = 50, ...filters } = req.query;
            const families = await familyService.getAllFamilies(filters, parseInt(page), parseInt(perPage));
            res.json({ success: true, ...families });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const family = await familyService.getFamilyById(req.params.id);
            res.json({ success: true, data: family });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const family = await familyService.createFamily(req.body, req.user.userId);
            res.status(201).json({ success: true, data: family });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const family = await familyService.updateFamily(req.params.id, req.body, req.user.userId);
            res.json({ success: true, data: family });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const result = await familyService.deleteFamily(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async getByColony(req, res) {
        try {
            const families = await familyService.getFamiliesByColony(req.params.colonyId);
            res.json({ success: true, data: families });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new FamiliesController();
