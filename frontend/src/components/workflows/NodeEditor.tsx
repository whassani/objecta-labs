'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface NodeEditorProps {
  node: any;
  onClose: () => void;
  onChange: (node: any) => void;
}

export default function NodeEditor({ node, onClose, onChange }: NodeEditorProps) {
  const [editedNode, setEditedNode] = useState(node);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  // Load agents from API
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoadingAgents(true);
        const response = await api.get('/agents');
        setAgents(response.data || []);
      } catch (error) {
        console.error('Failed to load agents:', error);
        setAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };

    if (editedNode.data?.actionType === 'agent') {
      loadAgents();
    }
  }, [editedNode.data?.actionType]);

  useEffect(() => {
    setEditedNode(node);
  }, [node]);

  const handleSave = () => {
    onChange(editedNode);
    onClose();
  };

  const handleFieldChange = (field: string, value: any) => {
    console.log(`Field changed: ${field} = ${value}`);
    setEditedNode({
      ...editedNode,
      data: {
        ...editedNode.data,
        [field]: value,
      },
    });
  };

  const renderFields = () => {
    const { type, data } = editedNode;

    // Common fields
    const commonFields = (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Label
          </label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </>
    );

    // Type-specific fields
    if (type === 'control-delay') {
      return (
        <>
          {commonFields}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay Duration
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={data.duration || 1}
                onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 1)}
                min="1"
                max="3600"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <select
                value={data.unit || 'seconds'}
                onChange={(e) => handleFieldChange('unit', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              💡 Use 1-5 seconds for testing, longer delays for production
            </p>
          </div>
        </>
      );
    }

    if (type === 'trigger') {
      return (
        <>
          {commonFields}
          {data.triggerType === 'schedule' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cron Schedule
              </label>
              <input
                type="text"
                value={data.schedule || ''}
                onChange={(e) => handleFieldChange('schedule', e.target.value)}
                placeholder="0 9 * * *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: 0 9 * * * (Every day at 9:00 AM)
              </p>
            </div>
          )}
          {data.triggerType === 'event' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={data.eventType || ''}
                onChange={(e) => handleFieldChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select event type</option>
                <option value="document.created">Document Created</option>
                <option value="document.updated">Document Updated</option>
                <option value="message.received">Message Received</option>
                <option value="user.registered">User Registered</option>
              </select>
            </div>
          )}
        </>
      );
    }

    if (type === 'action') {
      return (
        <>
          {commonFields}
          {data.actionType === 'agent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                value={data.agentId || ''}
                onChange={(e) => {
                  const selectedAgentId = e.target.value;
                  const selectedAgent = agents.find(a => a.id === selectedAgentId);
                  
                  // Save both agentId and agentName
                  setEditedNode({
                    ...editedNode,
                    data: {
                      ...editedNode.data,
                      agentId: selectedAgentId,
                      agentName: selectedAgent ? selectedAgent.name : '',
                    },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loadingAgents}
              >
                <option value="">
                  {loadingAgents ? 'Loading agents...' : 'Select agent'}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.model})
                  </option>
                ))}
              </select>
              {agents.length === 0 && !loadingAgents && (
                <p className="mt-2 text-sm text-gray-500">
                  No agents found. Create an agent first.
                </p>
              )}
            </div>
          )}
          {data.actionType === 'tool' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool
              </label>
              <select
                value={data.toolId || ''}
                onChange={(e) => {
                  const selectedToolId = e.target.value;
                  const toolNames: Record<string, string> = {
                    'tool-1': 'Calculator',
                    'tool-2': 'HTTP API',
                  };
                  
                  // Save both toolId and toolName
                  setEditedNode({
                    ...editedNode,
                    data: {
                      ...editedNode.data,
                      toolId: selectedToolId,
                      toolName: toolNames[selectedToolId] || '',
                    },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select tool</option>
                <option value="tool-1">Calculator</option>
                <option value="tool-2">HTTP API</option>
              </select>
            </div>
          )}
          {data.actionType === 'http' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP Method
                </label>
                <select
                  value={data.method || 'GET'}
                  onChange={(e) => handleFieldChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={data.url || ''}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          {data.actionType === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="email"
                  value={data.to || ''}
                  onChange={(e) => handleFieldChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={data.subject || ''}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </>
      );
    }

    if (type === 'condition') {
      return (
        <>
          {commonFields}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <input
              type="text"
              value={data.condition || ''}
              onChange={(e) => handleFieldChange('condition', e.target.value)}
              placeholder="e.g., confidence > 0.8"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use JavaScript-like expressions
            </p>
          </div>
        </>
      );
    }

    return commonFields;
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Node Settings</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {renderFields()}

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Node Info</h4>
        <dl className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <dt>Node ID:</dt>
            <dd className="font-mono">{node.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Type:</dt>
            <dd className="font-mono">{node.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Position:</dt>
            <dd className="font-mono">
              ({Math.round(node.position.x)}, {Math.round(node.position.y)})
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
