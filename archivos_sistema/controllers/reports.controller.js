const reportService = require('../services/report.service');

class ReportsController {
    async getStateReport(req, res) {
        try {
            const report = await reportService.generateStateReport(req.params.stateId);
            res.json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getDelegationReport(req, res) {
        try {
            const report = await reportService.generateDelegationReport(req.params.delegationId);
            res.json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getGeneralStatistics(req, res) {
        try {
            const stats = await reportService.getGeneralStatistics();
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getCoverageAnalytics(req, res) {
        try {
            const analytics = await reportService.getCoverageAnalytics();
            res.json({ success: true, data: analytics });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getUsersReport(req, res) {
        try {
            const report = await reportService.getUsersReport();
            res.json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getVoterAnalytics(req, res) {
        try {
            const analytics = await reportService.getVoterAnalytics();
            res.json({ success: true, data: analytics });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async exportData(req, res) {
        try {
            const data = await reportService.exportData(req.query);
            res.json({ success: true, data, total: data.length });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ReportsController();
