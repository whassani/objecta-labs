'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Clock, Webhook, Zap, Trash2, CheckCircle, XCircle, Clock as ClockPending } from 'lucide-react';

const TriggerNode = ({ data, selected, id }: NodeProps) => {
  // Get execution status from data (undefined means no execution, not 'idle')
  const executionStatus = data.executionStatus;
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };
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

  const getTriggerTypeLabel = () => {
    switch (data.triggerType) {
      case 'manual':
        return 'Manual';
      case 'schedule':
        return 'Schedule';
      case 'webhook':
        return 'Webhook';
      case 'event':
        return 'Event';
      default:
        return 'Trigger';
    }
  };

  const getTriggerDetails = () => {
    if (data.label && data.label !== 'Manual Trigger' && data.label !== 'Schedule Trigger' && data.label !== 'Webhook Trigger') {
      return data.label;
    }

    switch (data.triggerType) {
      case 'manual':
        return 'Click to start';
      case 'schedule':
        if (data.schedule) {
          return data.schedule;
        }
        if (data.cron) {
          return `Cron: ${data.cron}`;
        }
        if (data.interval) {
          return `Every ${data.interval}`;
        }
        return 'Configure schedule';
      case 'webhook':
        if (data.path) {
          return `/${data.path}`;
        }
        if (data.webhookUrl) {
          return data.webhookUrl.substring(data.webhookUrl.lastIndexOf('/'));
        }
        return 'Configure endpoint';
      case 'event':
        if (data.eventType) {
          return data.eventType;
        }
        if (data.eventName) {
          return data.eventName;
        }
        return 'Configure event';
      default:
        return data.label || 'Configure trigger';
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
            <ClockPending size={12} />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-green-500 ring-2 ring-green-200';
    
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
        return 'border-green-300';
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
          'bg-green-100 text-green-600'
        }`}>
          {getTriggerIcon()}
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${
          executionStatus === 'running' ? 'text-blue-700' :
          executionStatus === 'completed' ? 'text-green-700' :
          executionStatus === 'failed' || executionStatus === 'error' ? 'text-red-700' :
          'text-green-700'
        }`}>
          {getTriggerTypeLabel()}
        </div>
      </div>
      
      <div className="text-sm font-semibold text-gray-900 mb-1">
        {getTriggerDetails()}
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
