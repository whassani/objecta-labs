import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { ToolVersion } from './entities/tool-version.entity';

@Injectable()
export class VersioningService {
  constructor(
    @InjectRepository(Tool)
    private toolsRepository: Repository<Tool>,
    @InjectRepository(ToolVersion)
    private versionsRepository: Repository<ToolVersion>,
  ) {}

  /**
   * Create a new version snapshot before updating a tool
   */
  async createSnapshot(
    tool: Tool,
    userId: string,
    changelog?: string,
    changedFields?: string[],
  ): Promise<ToolVersion> {
    const version = this.versionsRepository.create({
      toolId: tool.id,
      organizationId: tool.organizationId,
      version: tool.version,
      snapshot: {
        name: tool.name,
        description: tool.description,
        config: tool.config,
        schema: tool.schema,
        retryConfig: tool.retryConfig,
        responseTransform: tool.responseTransform,
      },
      changedBy: userId,
      changelog,
      changedFields,
    });

    return this.versionsRepository.save(version);
  }

  /**
   * Get all versions for a tool
   */
  async getVersions(
    toolId: string,
    organizationId: string,
    limit: number = 50,
  ): Promise<ToolVersion[]> {
    return this.versionsRepository.find({
      where: { toolId, organizationId },
      order: { version: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(
    toolId: string,
    version: number,
    organizationId: string,
  ): Promise<ToolVersion | null> {
    return this.versionsRepository.findOne({
      where: { toolId, version, organizationId },
    });
  }

  /**
   * Restore a tool to a previous version
   */
  async restoreVersion(
    toolId: string,
    versionNumber: number,
    organizationId: string,
    userId: string,
  ): Promise<Tool> {
    const version = await this.getVersion(toolId, versionNumber, organizationId);
    if (!version) {
      throw new Error('Version not found');
    }

    const tool = await this.toolsRepository.findOne({
      where: { id: toolId, organizationId },
    });

    if (!tool) {
      throw new Error('Tool not found');
    }

    // Create snapshot of current state before restoring
    await this.createSnapshot(
      tool,
      userId,
      `Restored from version ${versionNumber}`,
      ['restore'],
    );

    // Update tool with snapshot data
    tool.name = version.snapshot.name;
    tool.description = version.snapshot.description;
    tool.config = version.snapshot.config;
    tool.schema = version.snapshot.schema;
    tool.retryConfig = version.snapshot.retryConfig;
    tool.responseTransform = version.snapshot.responseTransform;
    tool.version += 1;

    return this.toolsRepository.save(tool);
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    toolId: string,
    version1: number,
    version2: number,
    organizationId: string,
  ): Promise<{ changes: string[]; diff: any }> {
    const v1 = await this.getVersion(toolId, version1, organizationId);
    const v2 = await this.getVersion(toolId, version2, organizationId);

    if (!v1 || !v2) {
      throw new Error('Version not found');
    }

    const changes: string[] = [];
    const diff: any = {};

    // Compare each field
    if (v1.snapshot.name !== v2.snapshot.name) {
      changes.push('name');
      diff.name = { from: v1.snapshot.name, to: v2.snapshot.name };
    }

    if (v1.snapshot.description !== v2.snapshot.description) {
      changes.push('description');
      diff.description = { from: v1.snapshot.description, to: v2.snapshot.description };
    }

    if (JSON.stringify(v1.snapshot.config) !== JSON.stringify(v2.snapshot.config)) {
      changes.push('config');
      diff.config = { from: v1.snapshot.config, to: v2.snapshot.config };
    }

    if (JSON.stringify(v1.snapshot.schema) !== JSON.stringify(v2.snapshot.schema)) {
      changes.push('schema');
      diff.schema = { from: v1.snapshot.schema, to: v2.snapshot.schema };
    }

    if (JSON.stringify(v1.snapshot.retryConfig) !== JSON.stringify(v2.snapshot.retryConfig)) {
      changes.push('retryConfig');
      diff.retryConfig = { from: v1.snapshot.retryConfig, to: v2.snapshot.retryConfig };
    }

    if (JSON.stringify(v1.snapshot.responseTransform) !== JSON.stringify(v2.snapshot.responseTransform)) {
      changes.push('responseTransform');
      diff.responseTransform = { from: v1.snapshot.responseTransform, to: v2.snapshot.responseTransform };
    }

    return { changes, diff };
  }

  /**
   * Get version history with stats
   */
  async getVersionHistory(
    toolId: string,
    organizationId: string,
  ): Promise<{
    currentVersion: number;
    totalVersions: number;
    versions: ToolVersion[];
  }> {
    const tool = await this.toolsRepository.findOne({
      where: { id: toolId, organizationId },
    });

    const versions = await this.getVersions(toolId, organizationId);

    return {
      currentVersion: tool?.version || 1,
      totalVersions: versions.length,
      versions,
    };
  }
}
