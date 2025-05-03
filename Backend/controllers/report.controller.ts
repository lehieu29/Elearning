import { Request, Response } from 'express';
import { reportService } from '../services/report.service';

export class ReportController {
  /**
   * GET /api/reports
   * Lấy danh sách reports
   */
  static async listReports(req: Request, res: Response) {
    try {
      const { type } = req.query;
      const reports = await reportService.listReports(type as string);
      
      res.json({
        success: true,
        data: reports,
        total: reports.length
      });
    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/reports/:filename
   * Lấy nội dung một report
   */
  static async getReport(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      
      // Validate filename to prevent path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename'
        });
      }
      
      const content = await reportService.getReport(filename);
      
      res.json({
        success: true,
        data: {
          filename,
          content
        }
      });
    } catch (error: unknown) {
      console.error('Error getting report:', error);
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      if (errorMessage === 'Report file not found') {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get report',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * DELETE /api/reports/old
   * Xóa reports cũ
   */
  static async cleanOldReports(req: Request, res: Response) {
    try {
      const { days = 7 } = req.query;
      const daysToKeep = Number(days);
      
      if (isNaN(daysToKeep) || daysToKeep < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid days parameter. Must be a positive number.'
        });
      }
      
      await reportService.cleanOldReports(daysToKeep);
      
      res.json({
        success: true,
        message: `Cleaned reports older than ${daysToKeep} days`
      });
    } catch (error) {
      console.error('Error cleaning reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/reports/stats
   * Lấy thống kê về reports
   */
  static async getReportStats(req: Request, res: Response) {
    try {
      const stats = await reportService.getReportStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting report stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get report stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
