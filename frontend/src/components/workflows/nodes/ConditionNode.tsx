'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionNode = ({ data, selected }: NodeProps) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md ${
        selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-300'
      }`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-600">
          <GitBranch size={16} />
        </div>
        <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Condition
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {data.label || 'If/Else'}
      </div>
      
      {data.condition && (
        <div className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
          {data.condition}
        </div>
      )}

      {/* Output handles - True and False */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white"
      />
      
      {/* Labels for true/false */}
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-green-600 font-medium" style={{ marginLeft: '20%' }}>
          True
        </span>
        <span className="text-red-600 font-medium" style={{ marginRight: '20%' }}>
          False
        </span>
      </div>
    </div>
  );
};

export default memo(ConditionNode);
