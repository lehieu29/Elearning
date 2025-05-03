import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

interface ReportFile {
  filename: string;
  createdAt: Date;
  size: number;
  type: 'ffmpeg' | 'gemini' | 'system';
}

class ReportService {
  private reportDir: string;

  constructor() {
    this.reportDir = process.env.REPORT_DIR || './reports';
    // Đảm bảo thư mục tồn tại
    fs.ensureDirSync(this.reportDir);
    
    // Log đường dẫn thực tế để debug
    console.log(`Report directory path: ${path.resolve(this.reportDir)}`);
    console.log(`Current working directory: ${process.cwd()}`);
  }

  /**
   * Lưu report vào thư mục thay vì xóa
   */
  async saveReport(filename: string, content: string, type: 'ffmpeg' | 'gemini' | 'system' = 'ffmpeg'): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newFilename = `${type}_${timestamp}_${filename}`;
      const filepath = path.join(this.reportDir, newFilename);
      
      console.log(`Saving report to: ${path.resolve(filepath)}`);
      
      await fs.writeFile(filepath, content, 'utf8');
      
      // Verify file was created
      if (await fs.pathExists(filepath)) {
        console.log(`Report saved successfully: ${newFilename}`);
        
        // Log file size for verification
        const stats = await fs.stat(filepath);
        console.log(`Report file size: ${stats.size} bytes`);
      } else {
        console.error(`Failed to verify report file: ${filepath}`);
      }
    } catch (error) {
      console.error(`Error saving report: ${error}`);
      throw error;
    }
  }

  /**
   * Lấy danh sách các report files
   */
  async listReports(type?: string): Promise<ReportFile[]> {
    try {
      console.log(`Listing reports from: ${path.resolve(this.reportDir)}`);
      
      // Check if directory exists
      if (!await fs.pathExists(this.reportDir)) {
        console.error(`Report directory does not exist: ${this.reportDir}`);
        return [];
      }
      
      const files = await fs.readdir(this.reportDir);
      console.log(`Found ${files.length} files in report directory`);
      
      const reports: ReportFile[] = [];

      for (const file of files) {
        if (type && !file.startsWith(type)) continue;
        
        const filepath = path.join(this.reportDir, file);
        try {
          const stats = await fs.stat(filepath);
          
          reports.push({
            filename: file,
            createdAt: stats.birthtime,
            size: stats.size,
            type: this.getReportType(file)
          });
          
          console.log(`Added report: ${file} (${stats.size} bytes)`);
        } catch (error) {
          console.error(`Error reading file stats for ${file}:`, error);
        }
      }

      console.log(`Returning ${reports.length} reports`);
      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error(`Error listing reports: ${error}`);
      return [];
    }
  }

  /**
   * Lấy nội dung một report
   */
  async getReport(filename: string): Promise<string> {
    const filepath = path.join(this.reportDir, filename);
    
    if (!await fs.pathExists(filepath)) {
      throw new Error('Report file not found');
    }

    return await fs.readFile(filepath, 'utf8');
  }

  /**
   * Xóa report cũ (optional)
   */
  async cleanOldReports(daysToKeep: number = 7): Promise<void> {
    const files = await fs.readdir(this.reportDir);
    const now = new Date();
    const cutoffTime = now.getTime() - (daysToKeep * 24 * 60 * 60 * 1000);

    for (const file of files) {
      const filepath = path.join(this.reportDir, file);
      const stats = await fs.stat(filepath);
      
      if (stats.birthtime.getTime() < cutoffTime) {
        await fs.unlink(filepath);
      }
    }
  }

  private getReportType(filename: string): 'ffmpeg' | 'gemini' | 'system' {
    if (filename.startsWith('ffmpeg')) return 'ffmpeg';
    if (filename.startsWith('gemini')) return 'gemini';
    return 'system';
  }

  /**
   * Lấy thống kê về reports
   */
  async getReportStats(): Promise<{
    totalReports: number;
    totalSize: number;
    byType: Record<string, number>;
  }> {
    const reports = await this.listReports();
    const stats = {
      totalReports: reports.length,
      totalSize: 0,
      byType: {} as Record<string, number>
    };

    reports.forEach(report => {
      stats.totalSize += report.size;
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
    });

    return stats;
  }
}

export const reportService = new ReportService();
