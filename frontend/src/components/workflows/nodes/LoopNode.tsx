'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Repeat, Trash2 } from 'lucide-react';
import { getStatusBadge, getBorderColor, getBackgroundStyle, getIconColorClass, getTextColorClass, ProgressIndicator } from './NodeExecutionStatus';

const LoopNode = ({ data, selected, id }: NodeProps) => {
  // Get execution status from data (undefined means no execution, not 'idle')
  const executionStatus = data.executionStatus;
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  const getLoopLabel = () => {
    if (data.items) {
      return `Loop over ${data.items}`;
    }
    if (data.count) {
      return `Repeat ${data.count} times`;
    }
    return data.label || 'Loop';
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-md relative transition-all duration-300 ${
        getBorderColor(executionStatus, selected, 'border-amber-500')
      } ${getBackgroundStyle(executionStatus)}`}
    >
      {getStatusBadge(executionStatus)}
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
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />

      <ProgressIndicator show={executionStatus === 'running'} />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center justify-center w-6 h-6 rounded transition-all duration-300 ${
          getIconColorClass(executionStatus, 'bg-amber-100 text-amber-600')
        }`}>
          <Repeat size={16} />
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${
          getTextColorClass(executionStatus, 'text-amber-700')
        }`}>
          Loop
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {getLoopLabel()}
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mt-1">
          {data.description}
        </div>
      )}

      {/* Loop body output */}
      <Handle
        type="source"
        position={Position.Right}
        id="loop-body"
        style={{ top: '50%' }}
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />

      {/* Completion output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="complete"
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* Labels for outputs */}
      <div className="absolute right-[-45px] top-1/2 transform -translate-y-1/2 text-xs text-amber-600 font-medium">
        Each
      </div>
      <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 text-xs text-green-600 font-medium">
        Done
      </div>
    </div>
  );
};

export default memo(LoopNode);
