import { Injectable, BadRequestException } from '@nestjs/common';
import { WorkflowDefinition } from './entities/workflow.entity';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class WorkflowValidatorService {
  validateWorkflow(definition: WorkflowDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if definition exists
    if (!definition) {
      errors.push('Workflow definition is required');
      return { isValid: false, errors, warnings };
    }

    const { nodes, edges } = definition;

    // Check if workflow has nodes
    if (!nodes || nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for trigger node
    const triggerNodes = nodes.filter((node) => node.type.startsWith('trigger'));
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    if (triggerNodes.length > 1) {
      warnings.push('Multiple trigger nodes detected. Only the first one will be used.');
    }

    // Check for orphaned nodes (nodes with no connections)
    if (edges && edges.length > 0) {
      const connectedNodeIds = new Set<string>();
      edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const orphanedNodes = nodes.filter(
        (node) => !connectedNodeIds.has(node.id) && !node.type.startsWith('trigger'),
      );

      if (orphanedNodes.length > 0) {
        warnings.push(
          `Found ${orphanedNodes.length} orphaned node(s) with no connections: ${orphanedNodes.map((n) => n.id).join(', ')}`,
        );
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(nodes, edges)) {
      errors.push('Workflow contains circular dependencies');
    }

    // Validate individual nodes
    nodes.forEach((node) => {
      const nodeErrors = this.validateNode(node);
      errors.push(...nodeErrors);
    });

    // Validate edges
    if (edges) {
      edges.forEach((edge) => {
        const edgeErrors = this.validateEdge(edge, nodes);
        errors.push(...edgeErrors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateNode(node: any): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!node.id) {
      errors.push('Node must have an id');
    }
    if (!node.type) {
      errors.push(`Node ${node.id} must have a type`);
    }
    if (!node.data) {
      errors.push(`Node ${node.id} must have data`);
    }

    // Validate node-specific requirements
    switch (node.type) {
      case 'action-agent':
        if (!node.data.agentId) {
          errors.push(`Agent action node ${node.id} must have an agentId`);
        }
        break;

      case 'action-tool':
        if (!node.data.toolId) {
          errors.push(`Tool action node ${node.id} must have a toolId`);
        }
        break;

      case 'action-http':
        if (!node.data.url) {
          errors.push(`HTTP action node ${node.id} must have a URL`);
        }
        if (!node.data.method) {
          errors.push(`HTTP action node ${node.id} must have a method`);
        }
        break;

      case 'control-condition':
        if (!node.data.condition) {
          errors.push(`Condition node ${node.id} must have a condition`);
        }
        break;

      case 'trigger-schedule':
        if (!node.data.cron) {
          errors.push(`Schedule trigger node ${node.id} must have a cron expression`);
        }
        break;
    }

    return errors;
  }

  private validateEdge(edge: any, nodes: any[]): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!edge.id) {
      errors.push('Edge must have an id');
    }
    if (!edge.source) {
      errors.push(`Edge ${edge.id} must have a source`);
    }
    if (!edge.target) {
      errors.push(`Edge ${edge.id} must have a target`);
    }

    // Check if source and target nodes exist
    const sourceExists = nodes.some((node) => node.id === edge.source);
    const targetExists = nodes.some((node) => node.id === edge.target);

    if (!sourceExists) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    if (!targetExists) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }

    // Check for self-loops
    if (edge.source === edge.target) {
      errors.push(`Edge ${edge.id} creates a self-loop`);
    }

    return errors;
  }

  private hasCircularDependency(nodes: any[], edges: any[]): boolean {
    if (!edges || edges.length === 0) {
      return false;
    }

    // Build adjacency list
    const graph = new Map<string, string[]>();
    nodes.forEach((node) => graph.set(node.id, []));
    edges.forEach((edge) => {
      const neighbors = graph.get(edge.source) || [];
      neighbors.push(edge.target);
      graph.set(edge.source, neighbors);
    });

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  validateCronExpression(cron: string): boolean {
    // Basic cron validation (can be enhanced with a cron library)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(cron);
  }
}
