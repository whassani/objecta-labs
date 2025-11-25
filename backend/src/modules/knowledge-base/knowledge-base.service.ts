import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from './entities/data-source.entity';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto/data-source.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private documentChunksRepository: Repository<DocumentChunk>,
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

  // Document management methods
  async findAllDocuments(organizationId: string, dataSourceId?: string): Promise<Document[]> {
    const where: any = { organizationId };
    if (dataSourceId) {
      where.dataSourceId = dataSourceId;
    }

    return this.documentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneDocument(id: string, organizationId: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id, organizationId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async removeDocument(id: string, organizationId: string): Promise<void> {
    const result = await this.documentsRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Document not found');
    }
  }

  async getDocumentChunks(documentId: string, organizationId: string): Promise<DocumentChunk[]> {
    // Verify document belongs to organization
    await this.findOneDocument(documentId, organizationId);

    return this.documentChunksRepository.find({
      where: { documentId },
      order: { chunkIndex: 'ASC' },
    });
  }

  async updateDocument(document: Document): Promise<Document> {
    return this.documentsRepository.save(document);
  }
}
