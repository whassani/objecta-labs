import { Processor, Process } from '@nestjs/bull';
import { Job as BullJob } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { JobsService } from '../jobs.service';

@Processor('data-conversion')
@Injectable()
export class DataConversionProcessor {
  private readonly logger = new Logger(DataConversionProcessor.name);

  constructor(private jobsService: JobsService) {}

  @Process('data-conversion')
  async handleDataConversion(job: BullJob) {
    const { jobId, organizationId, userId, ...data } = job.data;

    this.logger.log(`Processing data conversion job ${jobId}`);

    try {
      // Update job status to active
      await this.jobsService.updateJobStatus(jobId, 'active');

      // TODO: Implement actual data conversion logic here
      // This will be moved from data-conversion.service.ts
      
      // Simulate progress updates
      const totalSteps = 10;
      for (let i = 1; i <= totalSteps; i++) {
        await this.jobsService.updateJobProgress(
          jobId,
          i,
          totalSteps,
          `Processing step ${i} of ${totalSteps}`,
        );
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      }

      // Mark as completed
      await this.jobsService.updateJobStatus(jobId, 'completed', {
        result: {
          message: 'Data conversion completed successfully',
          datasetId: 'dataset-123', // Replace with actual dataset ID
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Data conversion job ${jobId} failed: ${error.message}`);
      
      await this.jobsService.updateJobStatus(jobId, 'failed', {
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }
}
