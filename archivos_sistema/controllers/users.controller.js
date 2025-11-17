const userService = require('../services/user.service');

class UsersController {
    async getAll(req, res) {
        try {
            const users = await userService.getAllUsers();
            res.json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const user = await userService.getUserById(req.params.id);
            res.json({ success: true, data: user });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json({ success: true, data: user });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            res.json({ success: true, data: user });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const result = await userService.deleteUser(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const result = await userService.changePassword(req.params.id, oldPassword, newPassword);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async getActivity(req, res) {
        try {
            const activity = await userService.getUserActivity(req.params.id);
            res.json({ success: true, data: activity });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await userService.getUserStats(req.params.id);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new UsersController();
