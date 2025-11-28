import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

/**
 * Tracks token usage and costs per conversation message
 */
@Entity('conversation_metrics')
export class ConversationMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'message_id' })
  messageId: string;

  // Token counts
  @Column({ name: 'prompt_tokens', default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', default: 0 })
  completionTokens: number;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens: number;

  // Context breakdown
  @Column({ name: 'system_tokens', default: 0 })
  systemTokens: number;

  @Column({ name: 'history_tokens', default: 0 })
  historyTokens: number;

  @Column({ name: 'rag_tokens', default: 0 })
  ragTokens: number;

  @Column({ name: 'user_message_tokens', default: 0 })
  userMessageTokens: number;

  // Metadata
  @Column({ name: 'model' })
  model: string;

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 6, default: 0 })
  cost: number;

  @Column({ name: 'history_messages_count', default: 0 })
  historyMessagesCount: number;

  @Column({ name: 'rag_documents_used', default: 0 })
  ragDocumentsUsed: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
