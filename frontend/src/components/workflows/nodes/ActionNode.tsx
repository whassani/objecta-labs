'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Wrench, Send, Mail, Database, Code, X } from 'lucide-react';

const ActionNode = ({ data, selected, id }: NodeProps) => {
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

  const getActionLabel = () => {
    // If there's a custom label, use it
    if (data.label && data.label !== 'Agent Action' && data.label !== 'Execute Tool' && data.label !== 'Action') {
      return data.label;
    }

    // Otherwise, generate label based on action type and data
    switch (data.actionType) {
      case 'agent':
        if (data.agentId) {
          // Map agent IDs to names (in real app, fetch from API)
          const agentNames: Record<string, string> = {
            'agent-1': 'Customer Support Agent',
            'agent-2': 'Sales Assistant',
          };
          return agentNames[data.agentId] || data.agentName || 'AI Agent';
        }
        return data.agentName || 'AI Agent';
      case 'tool':
        if (data.toolId) {
          // Map tool IDs to names (in real app, fetch from API)
          const toolNames: Record<string, string> = {
            'tool-1': 'Calculator',
            'tool-2': 'HTTP API',
          };
          return toolNames[data.toolId] || data.toolName || 'Execute Tool';
        }
        return data.toolName || 'Execute Tool';
      case 'http':
        if (data.url) {
          // Show URL domain if available
          try {
            const urlObj = new URL(data.url);
            return `${data.method || 'GET'} ${urlObj.hostname}`;
          } catch {
            return `${data.method || 'GET'} Request`;
          }
        }
        return `${data.method || 'GET'} Request`;
      case 'email':
        if (data.to) {
          return `Email to ${data.to}`;
        }
        return 'Send Email';
      case 'database':
        return 'Database Query';
      case 'code':
        return 'Run Code';
      default:
        return data.label || 'Action';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md relative ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-300'
      }`}
    >
      {/* Delete button */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg z-10"
          title="Delete node"
        >
          <X size={14} />
        </button>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-indigo-100 text-indigo-600">
          {getActionIcon()}
        </div>
        <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          Action
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {getActionLabel()}
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
