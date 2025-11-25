import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from './entities/data-source.entity';
import { Document } from './entities/document.entity';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto/data-source.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async findAllDataSources(organizationId: string): Promise<DataSource[]> {
    return this.dataSourcesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneDataSource(id: string, organizationId: string): Promise<DataSource> {
    const dataSource = await this.dataSourcesRepository.findOne({
      where: { id, organizationId },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    return dataSource;
  }

  async createDataSource(createDto: CreateDataSourceDto, organizationId: string): Promise<DataSource> {
    const dataSource = this.dataSourcesRepository.create({
      ...createDto,
      organizationId,
    });

    return this.dataSourcesRepository.save(dataSource);
  }

  async updateDataSource(id: string, updateDto: UpdateDataSourceDto, organizationId: string): Promise<DataSource> {
    await this.dataSourcesRepository.update({ id, organizationId }, updateDto);
    return this.findOneDataSource(id, organizationId);
  }

  async removeDataSource(id: string, organizationId: string): Promise<void> {
    const result = await this.dataSourcesRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Data source not found');
    }
  }

  async syncDataSource(id: string, organizationId: string): Promise<{ message: string }> {
    const dataSource = await this.findOneDataSource(id, organizationId);
    
    // TODO: Implement actual sync logic
    // This will be implemented later with LangChain integrations
    
    return { message: 'Sync started' };
  }
}
