import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';

@Entity('agent_metrics')
@Unique(['agentId', 'date'])
@Index(['agentId'])
@Index(['date'])
export class AgentMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id' })
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'conversation_count', default: 0 })
  conversationCount: number;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ name: 'avg_response_time', type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgResponseTime: number;

  @Column({ name: 'total_tokens', type: 'bigint', default: 0 })
  totalTokens: number;

  @Column({ name: 'error_count', default: 0 })
  errorCount: number;

  @Column({ name: 'satisfaction_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  satisfactionScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
