import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ name: 'system_prompt', type: 'text' })
  systemPrompt: string;

  @Column({ default: 'gpt-4' })
  model: string;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ name: 'max_tokens', default: 2000 })
  maxTokens: number;

  @Column({ type: 'jsonb', default: '{}' })
  settings: any;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // RAG (Retrieval Augmented Generation) settings
  @Column({ name: 'use_knowledge_base', default: false })
  useKnowledgeBase: boolean;

  @Column({ name: 'knowledge_base_max_results', default: 3 })
  knowledgeBaseMaxResults: number;

  @Column({ name: 'knowledge_base_threshold', type: 'float', default: 0.7 })
  knowledgeBaseThreshold: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
