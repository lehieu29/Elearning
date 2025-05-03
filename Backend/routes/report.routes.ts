import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();

// Get report statistics
router.get('/stats', ReportController.getReportStats);

// List all reports
router.get('/', ReportController.listReports);

// Get specific report content
router.get('/:filename', ReportController.getReport);

// Clean old reports
router.delete('/old', ReportController.cleanOldReports);

export default router;
