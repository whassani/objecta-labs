'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Wrench, Send, Mail, Database, Code } from 'lucide-react';

const ActionNode = ({ data, selected }: NodeProps) => {
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
    switch (data.actionType) {
      case 'agent':
        return data.agentName || 'AI Agent';
      case 'tool':
        return data.toolName || 'Execute Tool';
      case 'http':
        return `${data.method || 'GET'} Request`;
      case 'email':
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
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-300'
      }`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
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
        className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(ActionNode);
