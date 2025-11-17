const authService = require('../services/auth.service');

class AuthController {
    async register(req, res) {
        try {
            const userId = await authService.register(req.body);
            res.status(201).json({ success: true, userId });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async login(req, res) {
        try {
            const result = await authService.login(req.body.email, req.body.password);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(401).json({ success: false, error: error.message });
        }
    }

    async logout(req, res) {
        try {
            await authService.logout(req.user.userId, req.headers.authorization.split(' ')[1]);
            res.json({ success: true, message: 'Sesión cerrada' });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const result = await authService.refreshToken(req.body.refreshToken);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(401).json({ success: false, error: error.message });
        }
    }
}

module.exports = new AuthController();
