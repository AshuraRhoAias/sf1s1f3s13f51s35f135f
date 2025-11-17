const personService = require('../services/person.service');

class PersonsController {
    async getAll(req, res) {
        try {
            const { page = 1, perPage = 50, ...filters } = req.query;
            const persons = await personService.getAllPersons(filters, parseInt(page), parseInt(perPage));
            res.json({ success: true, ...persons });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const person = await personService.getPersonById(req.params.id);
            res.json({ success: true, data: person });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const person = await personService.createPerson(req.body, req.user.userId);
            res.status(201).json({ success: true, data: person });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const person = await personService.updatePerson(req.params.id, req.body, req.user.userId);
            res.json({ success: true, data: person });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const result = await personService.deletePerson(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async getByFamily(req, res) {
        try {
            const persons = await personService.getPersonsByFamily(req.params.familyId);
            res.json({ success: true, data: persons });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async search(req, res) {
        try {
            const { q, limit = 100 } = req.query;
            const persons = await personService.searchPersons(q, parseInt(limit));
            res.json({ success: true, data: persons });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async batchCreate(req, res) {
        try {
            const { persons } = req.body;
            const results = await personService.batchCreatePersons(persons, req.user.userId);
            res.status(201).json({ success: true, data: { inserted: results.length, ids: results } });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

module.exports = new PersonsController();
