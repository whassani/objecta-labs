import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'data_source_id', nullable: true })
  dataSourceId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'content_type', nullable: true })
  contentType: string;

  @Column({ nullable: true })
  url: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount: number;

  @Column({ name: 'processing_status', default: 'pending' })
  processingStatus: string; // pending, processing, completed, failed

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
