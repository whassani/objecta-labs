import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FineTuningController } from './fine-tuning.controller';
import { FineTuningDatasetsService } from './fine-tuning-datasets.service';
import { FineTuningJobsService } from './fine-tuning-jobs.service';
import { FineTunedModelsService } from './fine-tuned-models.service';
import { OpenAIFineTuningProvider } from './providers/openai.provider';
import { FineTuningDataset } from './entities/fine-tuning-dataset.entity';
import { FineTuningJob } from './entities/fine-tuning-job.entity';
import { FineTunedModel } from './entities/fine-tuned-model.entity';
import { TrainingExample } from './entities/training-example.entity';
import { FineTuningEvent } from './entities/fine-tuning-event.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../conversations/entities/message.entity';
import { Agent } from '../agents/entities/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FineTuningDataset,
      FineTuningJob,
      FineTunedModel,
      TrainingExample,
      FineTuningEvent,
      Conversation,
      Message,
      Agent,
    ]),
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
      },
    }),
  ],
  controllers: [FineTuningController],
  providers: [
    FineTuningDatasetsService,
    FineTuningJobsService,
    FineTunedModelsService,
    OpenAIFineTuningProvider,
  ],
  exports: [
    FineTuningDatasetsService,
    FineTuningJobsService,
    FineTunedModelsService,
  ],
})
export class FineTuningModule {}
