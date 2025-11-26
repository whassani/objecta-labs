import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FineTuningDatasetsService } from './fine-tuning-datasets.service';
import { FineTuningJobsService } from './fine-tuning-jobs.service';
import { FineTunedModelsService } from './fine-tuned-models.service';
import {
  CreateDatasetDto,
  UpdateDatasetDto,
  ImportFromConversationsDto,
  DatasetResponseDto,
  DatasetStatsDto,
} from './dto/dataset.dto';
import {
  CreateFineTuningJobDto,
  UpdateFineTuningJobDto,
  EstimateCostDto,
  FineTuningJobResponseDto,
  CostEstimateResponseDto,
} from './dto/job.dto';
import {
  UpdateFineTunedModelDto,
  DeployModelDto,
  FineTunedModelResponseDto,
  ModelStatsDto,
} from './dto/model.dto';

@ApiTags('Fine-Tuning')
@ApiBearerAuth()
@Controller('fine-tuning')
@UseGuards(JwtAuthGuard)
export class FineTuningController {
  constructor(
    private readonly datasetsService: FineTuningDatasetsService,
    private readonly jobsService: FineTuningJobsService,
    private readonly modelsService: FineTunedModelsService,
  ) {}

  // ==================== DATASETS ====================

  @Post('datasets')
  @ApiOperation({ summary: 'Upload a new training dataset' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Dataset created', type: DatasetResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDataset(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDatasetDto: CreateDatasetDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    return this.datasetsService.create(createDatasetDto, file, organizationId, userId);
  }

  @Get('datasets')
  @ApiOperation({ summary: 'List all datasets' })
  @ApiResponse({ status: 200, description: 'List of datasets', type: [DatasetResponseDto] })
  async listDatasets(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const organizationId = req.user.organizationId;
    return this.datasetsService.findAll(organizationId, workspaceId);
  }

  @Get('datasets/stats')
  @ApiOperation({ summary: 'Get dataset statistics' })
  @ApiResponse({ status: 200, description: 'Dataset stats', type: DatasetStatsDto })
  async getDatasetStats(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const organizationId = req.user.organizationId;
    return this.datasetsService.getStats(organizationId, workspaceId);
  }

  @Get('datasets/:id')
  @ApiOperation({ summary: 'Get dataset by ID' })
  @ApiResponse({ status: 200, description: 'Dataset details', type: DatasetResponseDto })
  async getDataset(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.datasetsService.findOne(id, organizationId);
  }

  @Put('datasets/:id')
  @ApiOperation({ summary: 'Update dataset' })
  @ApiResponse({ status: 200, description: 'Dataset updated', type: DatasetResponseDto })
  async updateDataset(
    @Param('id') id: string,
    @Body() updateDatasetDto: UpdateDatasetDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.datasetsService.update(id, updateDatasetDto, organizationId);
  }

  @Delete('datasets/:id')
  @ApiOperation({ summary: 'Delete dataset' })
  @ApiResponse({ status: 200, description: 'Dataset deleted' })
  async deleteDataset(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    await this.datasetsService.remove(id, organizationId);
    return { message: 'Dataset deleted successfully' };
  }

  @Post('datasets/:id/validate')
  @ApiOperation({ summary: 'Validate dataset format' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateDataset(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.datasetsService.validate(id, organizationId);
  }

  @Post('datasets/import-from-conversations')
  @ApiOperation({ summary: 'Import training data from conversations' })
  @ApiResponse({ status: 201, description: 'Dataset created from conversations', type: DatasetResponseDto })
  async importFromConversations(
    @Body() importDto: ImportFromConversationsDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    return this.datasetsService.importFromConversations(importDto, organizationId, userId);
  }

  // ==================== JOBS ====================

  @Post('jobs')
  @ApiOperation({ summary: 'Create a new fine-tuning job' })
  @ApiResponse({ status: 201, description: 'Job created', type: FineTuningJobResponseDto })
  async createJob(@Body() createJobDto: CreateFineTuningJobDto, @Request() req) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    return this.jobsService.create(createJobDto, organizationId, userId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List all fine-tuning jobs' })
  @ApiResponse({ status: 200, description: 'List of jobs', type: [FineTuningJobResponseDto] })
  async listJobs(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const organizationId = req.user.organizationId;
    return this.jobsService.findAll(organizationId, workspaceId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job details', type: FineTuningJobResponseDto })
  async getJob(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.jobsService.findOne(id, organizationId);
  }

  @Put('jobs/:id')
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated', type: FineTuningJobResponseDto })
  async updateJob(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateFineTuningJobDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.jobsService.update(id, updateJobDto, organizationId);
  }

  @Post('jobs/:id/cancel')
  @ApiOperation({ summary: 'Cancel a running job' })
  @ApiResponse({ status: 200, description: 'Job cancelled', type: FineTuningJobResponseDto })
  async cancelJob(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.jobsService.cancel(id, organizationId);
  }

  @Get('jobs/:id/events')
  @ApiOperation({ summary: 'Get job events/logs' })
  @ApiResponse({ status: 200, description: 'Job events' })
  async getJobEvents(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.jobsService.getEvents(id, organizationId);
  }

  @Post('jobs/:id/sync')
  @ApiOperation({ summary: 'Sync job status with provider' })
  @ApiResponse({ status: 200, description: 'Job status synced', type: FineTuningJobResponseDto })
  async syncJobStatus(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.jobsService.syncJobStatus(id, organizationId);
  }

  @Post('jobs/estimate-cost')
  @ApiOperation({ summary: 'Estimate cost of fine-tuning job' })
  @ApiResponse({ status: 200, description: 'Cost estimate', type: CostEstimateResponseDto })
  async estimateCost(@Body() estimateDto: EstimateCostDto, @Request() req) {
    return this.jobsService.estimateCost(estimateDto);
  }

  // ==================== MODELS ====================

  @Get('models')
  @ApiOperation({ summary: 'List all fine-tuned models' })
  @ApiResponse({ status: 200, description: 'List of models', type: [FineTunedModelResponseDto] })
  async listModels(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const organizationId = req.user.organizationId;
    return this.modelsService.findAll(organizationId, workspaceId);
  }

  @Get('models/stats')
  @ApiOperation({ summary: 'Get model statistics' })
  @ApiResponse({ status: 200, description: 'Model stats', type: ModelStatsDto })
  async getModelStats(@Request() req, @Query('workspaceId') workspaceId?: string) {
    const organizationId = req.user.organizationId;
    return this.modelsService.getStats(organizationId, workspaceId);
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get model by ID' })
  @ApiResponse({ status: 200, description: 'Model details', type: FineTunedModelResponseDto })
  async getModel(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.modelsService.findOne(id, organizationId);
  }

  @Put('models/:id')
  @ApiOperation({ summary: 'Update model' })
  @ApiResponse({ status: 200, description: 'Model updated', type: FineTunedModelResponseDto })
  async updateModel(
    @Param('id') id: string,
    @Body() updateModelDto: UpdateFineTunedModelDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.modelsService.update(id, updateModelDto, organizationId);
  }

  @Post('models/:id/deploy')
  @ApiOperation({ summary: 'Deploy model to agent' })
  @ApiResponse({ status: 200, description: 'Model deployed', type: FineTunedModelResponseDto })
  async deployModel(
    @Param('id') id: string,
    @Body() deployDto: DeployModelDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.modelsService.deploy(id, organizationId, deployDto.agentId);
  }

  @Post('models/:id/archive')
  @ApiOperation({ summary: 'Archive model' })
  @ApiResponse({ status: 200, description: 'Model archived', type: FineTunedModelResponseDto })
  async archiveModel(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.modelsService.archive(id, organizationId);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Delete model' })
  @ApiResponse({ status: 200, description: 'Model deleted' })
  async deleteModel(@Param('id') id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    await this.modelsService.remove(id, organizationId);
    return { message: 'Model deleted successfully' };
  }
}
