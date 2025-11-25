'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Merge, Trash2 } from 'lucide-react';

const MergeNode = ({ data, selected, id }: NodeProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
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

      {/* Multiple input handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="input1"
        style={{ left: '30%' }}
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="input2"
        style={{ left: '70%' }}
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-600">
          <Merge size={16} />
        </div>
        <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Merge
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {data.label || 'Merge Branches'}
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-500 mt-1">
          {data.description}
        </div>
      )}

      {data.mode && (
        <div className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
          Mode: {data.mode}
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

export default memo(MergeNode);
