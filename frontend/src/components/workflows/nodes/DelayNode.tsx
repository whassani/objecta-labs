'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Timer, Trash2 } from 'lucide-react';

const DelayNode = ({ data, selected, id }: NodeProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  const getDelayLabel = () => {
    if (data.duration) {
      const duration = data.duration;
      const unit = data.unit || 'seconds';
      return `Wait ${duration} ${unit}`;
    }
    return data.label || 'Delay';
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md relative ${
        selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-300'
      }`}
    >
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

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-600">
          <Timer size={16} />
        </div>
        <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Delay
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {getDelayLabel()}
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
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(DelayNode);
