'use client';

import { DragEvent } from 'react';
import {
  Play,
  Clock,
  Webhook,
  Zap,
  Bot,
  Wrench,
  Send,
  Mail,
  GitBranch,
  Timer,
  Repeat,
  Merge,
} from 'lucide-react';

interface NodeTypeConfig {
  type: string;
  category: 'trigger' | 'action' | 'control';
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const nodeTypes: NodeTypeConfig[] = [
  // Triggers
  {
    type: 'trigger-manual',
    category: 'trigger',
    label: 'Manual Trigger',
    icon: <Play size={18} />,
    description: 'Start workflow manually',
    color: 'green',
  },
  {
    type: 'trigger-schedule',
    category: 'trigger',
    label: 'Schedule',
    icon: <Clock size={18} />,
    description: 'Run on a schedule (cron)',
    color: 'green',
  },
  {
    type: 'trigger-webhook',
    category: 'trigger',
    label: 'Webhook',
    icon: <Webhook size={18} />,
    description: 'Trigger via HTTP webhook',
    color: 'green',
  },
  {
    type: 'trigger-event',
    category: 'trigger',
    label: 'Event',
    icon: <Zap size={18} />,
    description: 'Listen to system events',
    color: 'green',
  },
  // Actions
  {
    type: 'action-agent',
    category: 'action',
    label: 'AI Agent',
    icon: <Bot size={18} />,
    description: 'Call an AI agent',
    color: 'indigo',
  },
  {
    type: 'action-tool',
    category: 'action',
    label: 'Execute Tool',
    icon: <Wrench size={18} />,
    description: 'Run a custom tool',
    color: 'indigo',
  },
  {
    type: 'action-http',
    category: 'action',
    label: 'HTTP Request',
    icon: <Send size={18} />,
    description: 'Make an API call',
    color: 'indigo',
  },
  {
    type: 'action-email',
    category: 'action',
    label: 'Send Email',
    icon: <Mail size={18} />,
    description: 'Send an email notification',
    color: 'indigo',
  },
  // Control Flow
  {
    type: 'control-condition',
    category: 'control',
    label: 'Condition',
    icon: <GitBranch size={18} />,
    description: 'If/else branching logic',
    color: 'amber',
  },
  {
    type: 'control-delay',
    category: 'control',
    label: 'Delay',
    icon: <Timer size={18} />,
    description: 'Wait for a duration',
    color: 'amber',
  },
  {
    type: 'control-loop',
    category: 'control',
    label: 'Loop',
    icon: <Repeat size={18} />,
    description: 'Iterate over items',
    color: 'amber',
  },
  {
    type: 'control-merge',
    category: 'control',
    label: 'Merge',
    icon: <Merge size={18} />,
    description: 'Combine branches',
    color: 'amber',
  },
];

export default function NodePalette() {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300',
      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300',
      amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      green: 'text-green-600',
      indigo: 'text-indigo-600',
      amber: 'text-amber-600',
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  const categories = [
    { id: 'trigger', label: 'Triggers', description: 'Start your workflow' },
    { id: 'action', label: 'Actions', description: 'Perform tasks' },
    { id: 'control', label: 'Control Flow', description: 'Logic and flow' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Library</h3>

      {categories.map((category) => (
        <div key={category.id} className="mb-6">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {category.label}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{category.description}</p>
          </div>

          <div className="space-y-2">
            {nodeTypes
              .filter((node) => node.category === category.id)
              .map((node) => (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  className={`p-3 rounded-lg border-2 cursor-move transition-all ${getColorClasses(
                    node.color
                  )}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`${getIconColorClasses(node.color)} mt-0.5`}>
                      {node.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {node.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {node.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Drag and drop nodes onto the canvas to build your
          workflow.
        </p>
      </div>
    </div>
  );
}
