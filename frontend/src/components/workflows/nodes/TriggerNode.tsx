'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Clock, Webhook, Zap } from 'lucide-react';

const TriggerNode = ({ data, selected }: NodeProps) => {
  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'manual':
        return <Play size={16} />;
      case 'schedule':
        return <Clock size={16} />;
      case 'webhook':
        return <Webhook size={16} />;
      case 'event':
        return <Zap size={16} />;
      default:
        return <Play size={16} />;
    }
  };

  const getTriggerLabel = () => {
    switch (data.triggerType) {
      case 'manual':
        return 'Manual Trigger';
      case 'schedule':
        return data.schedule || 'Schedule Trigger';
      case 'webhook':
        return 'Webhook Trigger';
      case 'event':
        return `Event: ${data.eventType || 'Unknown'}`;
      default:
        return data.label || 'Trigger';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md ${
        selected ? 'border-green-500 ring-2 ring-green-200' : 'border-green-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-600">
          {getTriggerIcon()}
        </div>
        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">
          Trigger
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-900 mb-1">
        {getTriggerLabel()}
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
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(TriggerNode);
