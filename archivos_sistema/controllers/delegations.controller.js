const delegationService = require('../services/delegation.service');

class DelegationsController {
    async getAll(req, res) {
        try {
            const delegations = await delegationService.getAllDelegations(req.query);
            res.json({ success: true, data: delegations });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const delegation = await delegationService.getDelegationById(req.params.id);
            res.json({ success: true, data: delegation });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const delegation = await delegationService.createDelegation(req.body);
            res.status(201).json({ success: true, data: delegation });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const delegation = await delegationService.updateDelegation(req.params.id, req.body);
            res.json({ success: true, data: delegation });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const result = await delegationService.deleteDelegation(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async getByState(req, res) {
        try {
            const delegations = await delegationService.getDelegationsByState(req.params.stateId);
            res.json({ success: true, data: delegations });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new DelegationsController();
