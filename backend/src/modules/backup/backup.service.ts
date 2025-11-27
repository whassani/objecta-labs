import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly retentionDays: number;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.backupDir = this.configService.get('BACKUP_DIR', './backups');
    this.retentionDays = this.configService.get('BACKUP_RETENTION_DAYS', 30);
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Run daily backup at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup() {
    if (!this.configService.get('BACKUP_ENABLED', false)) {
      return;
    }

    this.logger.log('Starting scheduled backup...');
    
    try {
      await this.backupDatabase();
      await this.cleanupOldBackups();
      this.logger.log('Scheduled backup completed successfully');
    } catch (error) {
      this.logger.error('Scheduled backup failed:', error);
      
      // Send alert email to admin
      const adminEmail = this.configService.get('ADMIN_EMAIL');
      if (adminEmail) {
        try {
          await this.emailService.sendBackupAlert({
            adminEmail,
            timestamp: new Date().toISOString(),
            databaseName: this.configService.get('DATABASE_NAME', 'objecta-labs'),
            errorMessage: error.message || error.toString(),
          });
          
          this.logger.log(`Backup failure alert sent to ${adminEmail}`);
        } catch (emailError) {
          this.logger.error(`Failed to send backup alert email: ${emailError.message}`);
        }
      }
    }
  }

  /**
   * Backup PostgreSQL database
   */
  async backupDatabase(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbHost = this.configService.get('DATABASE_HOST');
    const dbPort = this.configService.get('DATABASE_PORT');
    const dbName = this.configService.get('DATABASE_NAME');
    const dbUser = this.configService.get('DATABASE_USER');
    const dbPassword = this.configService.get('DATABASE_PASSWORD');

    // Use pg_dump for backup
    const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${filepath}`;

    try {
      await execAsync(command);
      this.logger.log(`Database backup created: ${filename}`);

      // Compress backup
      await execAsync(`gzip ${filepath}`);
      
      return `${filepath}.gz`;
    } catch (error) {
      this.logger.error('Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupFile: string): Promise<void> {
    const dbHost = this.configService.get('DATABASE_HOST');
    const dbPort = this.configService.get('DATABASE_PORT');
    const dbName = this.configService.get('DATABASE_NAME');
    const dbUser = this.configService.get('DATABASE_USER');
    const dbPassword = this.configService.get('DATABASE_PASSWORD');

    // Decompress if needed
    if (backupFile.endsWith('.gz')) {
      await execAsync(`gunzip -k ${backupFile}`);
      backupFile = backupFile.replace('.gz', '');
    }

    const command = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c ${backupFile}`;

    try {
      await execAsync(command);
      this.logger.log('Database restored successfully');
    } catch (error) {
      this.logger.error('Database restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<string[]> {
    const files = fs.readdirSync(this.backupDir);
    return files
      .filter(f => f.startsWith('database-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
      .sort()
      .reverse();
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const files = fs.readdirSync(this.backupDir);
    let deletedCount = 0;

    for (const file of files) {
      const filepath = path.join(this.backupDir, file);
      const stats = fs.statSync(filepath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }

    this.logger.log(`Cleaned up ${deletedCount} old backup(s)`);
  }

  /**
   * Get backup status
   */
  async getBackupStatus() {
    const backups = await this.listBackups();
    const latestBackup = backups[0];
    
    return {
      enabled: this.configService.get('BACKUP_ENABLED', false),
      totalBackups: backups.length,
      latestBackup,
      retentionDays: this.retentionDays,
      backupDir: this.backupDir,
    };
  }
}
