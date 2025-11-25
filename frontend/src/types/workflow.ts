export interface WorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum WorkflowTriggerType {
  MANUAL = 'manual',
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
  EVENT = 'event',
  DATABASE = 'database',
  EMAIL = 'email',
  FORM = 'form',
}

export interface Workflow {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, any>;
  version: number;
  tags: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggerData?: Record<string, any>;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  error?: string;
  context?: Record<string, any>;
  steps?: WorkflowExecutionStep[];
}

export interface WorkflowExecutionStep {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  retryCount: number;
}
