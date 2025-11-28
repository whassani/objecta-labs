import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { CreateTicketDto, UpdateTicketDto, TicketStatus } from './dto/admin.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketsRepository: Repository<SupportTicket>,
  ) {}

  /**
   * Create support ticket
   */
  async createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketsRepository.create({
      ...dto,
      status: 'open',
    });

    return this.ticketsRepository.save(ticket);
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['organization', 'user', 'assignedAdmin'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Get ticket queue
   */
  async getTicketQueue(filters: {
    status?: TicketStatus;
    priority?: string;
    assignedTo?: string;
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number }> {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.organization', 'organization')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedAdmin', 'admin')
      .orderBy('ticket.created_at', 'DESC');

    if (filters.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere('ticket.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.assignedTo) {
      query.andWhere('ticket.assigned_to = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    if (filters.organizationId) {
      query.andWhere('ticket.organization_id = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    const [tickets, total] = await query
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getManyAndCount();

    return { tickets, total };
  }

  /**
   * Update ticket
   */
  async updateTicket(
    ticketId: string,
    dto: UpdateTicketDto,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicket(ticketId);

    Object.assign(ticket, dto);

    if (dto.status === 'resolved' || dto.status === 'closed') {
      ticket.resolvedAt = new Date();
    }

    return this.ticketsRepository.save(ticket);
  }

  /**
   * Assign ticket
   */
  async assignTicket(
    ticketId: string,
    adminUserId: string,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicket(ticketId);

    ticket.assignedTo = adminUserId;
    ticket.status = 'in_progress';

    return this.ticketsRepository.save(ticket);
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(
    ticketId: string,
    resolution: string,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicket(ticketId);

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();

    // In a real implementation, you would store the resolution
    // and send notification to the customer

    return this.ticketsRepository.save(ticket);
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<any> {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
    ] = await Promise.all([
      this.ticketsRepository.count(),
      this.ticketsRepository.count({ where: { status: 'open' } }),
      this.ticketsRepository.count({ where: { status: 'in_progress' } }),
      this.ticketsRepository.count({ where: { status: 'resolved' } }),
      this.ticketsRepository.count({ where: { priority: 'critical' } }),
    ]);

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
    };
  }
}
