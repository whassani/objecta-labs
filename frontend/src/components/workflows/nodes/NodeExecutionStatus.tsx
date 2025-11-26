import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';

export type ExecutionStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'error' | undefined;

export const getStatusBadge = (executionStatus: ExecutionStatus) => {
  if (!executionStatus) return null;
  
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

export const getBorderColor = (executionStatus: ExecutionStatus, selected: boolean, defaultColor: string) => {
  if (selected) return defaultColor.replace('border-', 'border-') + ' ring-2 ' + defaultColor.replace('border-', 'ring-').replace(/\d+/, '200');
  
  if (!executionStatus) return defaultColor;
  
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
      return defaultColor;
  }
};

export const getBackgroundStyle = (executionStatus: ExecutionStatus) => {
  if (!executionStatus) return 'bg-white';
  
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

export const getIconColorClass = (executionStatus: ExecutionStatus, defaultColor: string) => {
  if (!executionStatus) return defaultColor;
  
  switch (executionStatus) {
    case 'running':
      return 'bg-blue-200 text-blue-700 animate-pulse';
    case 'completed':
      return 'bg-green-200 text-green-700';
    case 'failed':
    case 'error':
      return 'bg-red-200 text-red-700';
    default:
      return defaultColor;
  }
};

export const getTextColorClass = (executionStatus: ExecutionStatus, defaultColor: string) => {
  if (!executionStatus) return defaultColor;
  
  switch (executionStatus) {
    case 'running':
      return 'text-blue-700';
    case 'completed':
      return 'text-green-700';
    case 'failed':
    case 'error':
      return 'text-red-700';
    default:
      return defaultColor;
  }
};

export const ProgressIndicator = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
      <div className="h-full bg-blue-500 animate-progress"></div>
    </div>
  );
};
