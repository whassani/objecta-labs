import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FineTuningDataset } from './fine-tuning-dataset.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Message } from '../../conversations/entities/message.entity';

@Entity('training_examples')
export class TrainingExample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dataset_id' })
  datasetId: string;

  @ManyToOne(() => FineTuningDataset, (dataset) => dataset.examples, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dataset_id' })
  dataset: FineTuningDataset;

  // Example Data
  @Column({ type: 'jsonb' })
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;

  // Metadata
  @Column({ name: 'source_conversation_id', nullable: true })
  sourceConversationId: string;

  @ManyToOne(() => Conversation, { nullable: true })
  @JoinColumn({ name: 'source_conversation_id' })
  sourceConversation: Conversation;

  @Column({ name: 'source_message_id', nullable: true })
  sourceMessageId: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'source_message_id' })
  sourceMessage: Message;

  // Quality Metrics
  @Column({ name: 'quality_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  qualityScore: number;

  @Column({ name: 'token_count', nullable: true })
  tokenCount: number;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
