import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { TrackEventDto } from './dto/analytics.dto';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsEventsRepository: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Track an analytics event
   */
  async trackEvent(
    organizationId: string,
    userId: string | null,
    dto: TrackEventDto,
  ): Promise<void> {
    try {
      const event = this.analyticsEventsRepository.create({
        organizationId,
        userId,
        eventType: dto.eventType,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        properties: dto.properties || {},
        createdAt: new Date(),
      });

      await this.analyticsEventsRepository.save(event);

      // TODO: Update Redis counters for real-time metrics
      this.logger.debug(
        `Tracked event: ${dto.eventType} for org ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`, error.stack);
      // Don't throw - analytics should not break the main flow
    }
  }

  /**
   * Get events for an organization
   */
  async getEvents(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    eventType?: string,
    limit: number = 1000,
  ): Promise<AnalyticsEvent[]> {
    const query = this.analyticsEventsRepository
      .createQueryBuilder('event')
      .where('event.organization_id = :organizationId', { organizationId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .andWhere('event.created_at <= :endDate', { endDate });

    if (eventType) {
      query.andWhere('event.event_type = :eventType', { eventType });
    }

    return query
      .orderBy('event.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get event counts by type
   */
  async getEventCounts(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ eventType: string; count: number }[]> {
    const results = await this.analyticsEventsRepository
      .createQueryBuilder('event')
      .select('event.event_type', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.organization_id = :organizationId', { organizationId })
      .andWhere('event.created_at >= :startDate', { startDate })
      .andWhere('event.created_at <= :endDate', { endDate })
      .groupBy('event.event_type')
      .getRawMany();

    return results.map((r) => ({
      eventType: r.eventType,
      count: parseInt(r.count, 10),
    }));
  }
}
