'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Wrench, Send, Mail, Database, Code, Trash2, Play, CheckCircle, XCircle, Clock } from 'lucide-react';

const ActionNode = ({ data, selected, id }: NodeProps) => {
  // Get execution status from data (undefined means no execution, not 'idle')
  const executionStatus = data.executionStatus;
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };
  const getActionIcon = () => {
    switch (data.actionType) {
      case 'agent':
        return <Bot size={16} />;
      case 'tool':
        return <Wrench size={16} />;
      case 'http':
        return <Send size={16} />;
      case 'email':
        return <Mail size={16} />;
      case 'database':
        return <Database size={16} />;
      case 'code':
        return <Code size={16} />;
      default:
        return <Wrench size={16} />;
    }
  };

  const getActionTypeLabel = () => {
    switch (data.actionType) {
      case 'agent':
        return 'AI Agent';
      case 'tool':
        return 'Tool';
      case 'http':
        return 'HTTP Request';
      case 'email':
        return 'Email';
      case 'database':
        return 'Database';
      case 'code':
        return 'Code';
      default:
        return 'Action';
    }
  };

  const getActionDetails = () => {
    // If there's a custom label, use it
    if (data.label && data.label !== 'Agent Action' && data.label !== 'Execute Tool' && data.label !== 'Action') {
      return data.label;
    }

    // Otherwise, generate details based on action type and data
    switch (data.actionType) {
      case 'agent':
        if (data.agentId) {
          // Map agent IDs to names (in real app, fetch from API)
          const agentNames: Record<string, string> = {
            'agent-1': 'Customer Support Agent',
            'agent-2': 'Sales Assistant',
          };
          return agentNames[data.agentId] || data.agentName || 'Select an agent';
        }
        return data.agentName || 'Select an agent';
      case 'tool':
        if (data.toolId) {
          // Map tool IDs to names (in real app, fetch from API)
          const toolNames: Record<string, string> = {
            'tool-1': 'Calculator',
            'tool-2': 'HTTP API',
          };
          return toolNames[data.toolId] || data.toolName || 'Select a tool';
        }
        return data.toolName || 'Select a tool';
      case 'http':
        if (data.url) {
          // Show URL domain if available
          try {
            const urlObj = new URL(data.url);
            return `${data.method || 'GET'} ${urlObj.hostname}`;
          } catch {
            return data.url.substring(0, 30) + (data.url.length > 30 ? '...' : '');
          }
        }
        return data.method ? `${data.method} Request` : 'Configure URL';
      case 'email':
        if (data.to) {
          return `To: ${data.to}`;
        }
        if (data.subject) {
          return data.subject;
        }
        return 'Configure recipient';
      case 'database':
        if (data.query) {
          return data.query.substring(0, 40) + (data.query.length > 40 ? '...' : '');
        }
        return data.operation || 'Configure query';
      case 'code':
        if (data.language) {
          return `${data.language} script`;
        }
        return 'Configure script';
      default:
        return 'Configure action';
    }
  };

  const getStatusBadge = () => {
    switch (executionStatus) {
      case 'running':
        return (
          <div className="absolute -top-2 -left-2 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg z-10 animate-pulse">
            <Play size={12} className="animate-spin" />
            Running
          </div>
        );
      case 'completed':
        return (
          <div className="absolute -top-2 -left-2 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg z-10">
            <CheckCircle size={12} />
            Done
          </div>
        );
      case 'failed':
      case 'error':
        return (
          <div className="absolute -top-2 -left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg z-10 animate-pulse">
            <XCircle size={12} />
            Failed
          </div>
        );
      case 'pending':
        return (
          <div className="absolute -top-2 -left-2 flex items-center gap-1 bg-gray-400 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg z-10">
            <Clock size={12} />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-indigo-500 ring-2 ring-indigo-200';
    
    switch (executionStatus) {
      case 'running':
        return 'border-blue-400 ring-2 ring-blue-200 shadow-lg shadow-blue-200';
      case 'completed':
        return 'border-green-400 ring-2 ring-green-200';
      case 'failed':
      case 'error':
        return 'border-red-400 ring-2 ring-red-200 shadow-lg shadow-red-200';
      case 'pending':
        return 'border-gray-300';
      default:
        return 'border-indigo-300';
    }
  };

  const getBackgroundStyle = () => {
    switch (executionStatus) {
      case 'running':
        return 'bg-gradient-to-br from-blue-50 to-blue-100';
      case 'completed':
        return 'bg-gradient-to-br from-green-50 to-green-100';
      case 'failed':
      case 'error':
        return 'bg-gradient-to-br from-red-50 to-red-100';
      case 'pending':
        return 'bg-white opacity-60';
      default:
        return 'bg-white';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-md relative transition-all duration-300 ${
        getBorderColor()
      } ${getBackgroundStyle()}`}
    >
      {/* Execution status badge */}
      {getStatusBadge()}
      {/* Delete button */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg z-10"
          title="Delete node"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white"
      />

      {/* Progress indicator for running state */}
      {executionStatus === 'running' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress"></div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center justify-center w-6 h-6 rounded transition-all duration-300 ${
          executionStatus === 'running' ? 'bg-blue-200 text-blue-700 animate-pulse' :
          executionStatus === 'completed' ? 'bg-green-200 text-green-700' :
          executionStatus === 'failed' || executionStatus === 'error' ? 'bg-red-200 text-red-700' :
          'bg-indigo-100 text-indigo-600'
        }`}>
          {getActionIcon()}
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${
          executionStatus === 'running' ? 'text-blue-700' :
          executionStatus === 'completed' ? 'text-green-700' :
          executionStatus === 'failed' || executionStatus === 'error' ? 'text-red-700' :
          'text-indigo-700'
        }`}>
          {getActionTypeLabel()}
        </div>
      </div>
      
      <div className="text-sm font-semibold text-gray-900 mb-1">
        {getActionDetails()}
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mt-1">
          {data.description}
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(ActionNode);
