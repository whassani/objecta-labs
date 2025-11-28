'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreatePlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    tier: 'free',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    isActive: true,
    isPopular: false,
    sortOrder: 0,
    limits: {
      maxAgents: 2,
      maxConversations: 50,
      maxWorkflows: 2,
      maxTools: 5,
      maxDataSources: 1,
      maxDocuments: 10,
      maxTeamMembers: 1,
      monthlyTokenLimit: 100000,
      dailyTokenLimit: 5000,
      maxTokensPerRequest: 2000,
      maxDocumentSizeMB: 5,
      maxKnowledgeBaseSizeMB: 50,
      maxWorkflowExecutionsPerDay: 10,
      maxApiCallsPerDay: 100,
      maxFineTuningJobs: 0,
      maxFineTuningDatasets: 0,
      maxTrainingExamplesPerDataset: 0,
    },
    features: {
      basicAgents: true,
      advancedAgents: false,
      customModels: false,
      fineTuning: false,
      workflows: true,
      advancedWorkflows: false,
      knowledgeBase: true,
      semanticSearch: true,
      hybridSearch: false,
      teamCollaboration: false,
      roleBasedAccess: false,
      auditLogs: false,
      apiAccess: true,
      webhooks: false,
      customIntegrations: false,
      basicAnalytics: true,
      advancedAnalytics: false,
      customReports: false,
      realTimeMonitoring: false,
      emailSupport: true,
      prioritySupport: false,
      dedicatedSupport: false,
      slaDays: 7,
      sso: false,
      customDomain: false,
      dataRetentionDays: 30,
      backupFrequencyHours: 168,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Log the data being sent
      console.log('Creating plan with data:', formData);
      console.log('Name field:', formData.name);
      
      // Ensure name is not empty
      if (!formData.name || formData.name.trim() === '') {
        alert('Plan name is required');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const updateLimit = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFormData({
      ...formData,
      limits: { ...formData.limits, [key]: numValue },
    });
  };

  const updateFeature = (key: string, value: boolean | number) => {
    setFormData({
      ...formData,
      features: { ...formData.features, [key]: value },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Create Subscription Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Pro"
                />
              </div>

              <div>
                <Label htmlFor="tier">Tier *</Label>
                <select
                  id="tier"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="pro_max">Pro Max</option>
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the plan"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isPopular}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                    />
                    <Label>Mark as Popular</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="priceMonthly">Monthly Price (USD) *</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priceYearly">Yearly Price (USD) *</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceYearly}
                  onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })}
                  required
                />
                {formData.priceMonthly > 0 && formData.priceYearly > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Yearly savings: ${(formData.priceMonthly * 12 - formData.priceYearly).toFixed(2)} 
                    ({(((formData.priceMonthly * 12 - formData.priceYearly) / (formData.priceMonthly * 12)) * 100).toFixed(0)}% off)
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Limits Tab */}
            <TabsContent value="limits" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600 mb-4">
                Use -1 for unlimited. Use 0 to disable a feature.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Agents</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxAgents}
                    onChange={(e) => updateLimit('maxAgents', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Conversations</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxConversations}
                    onChange={(e) => updateLimit('maxConversations', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Workflows</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxWorkflows}
                    onChange={(e) => updateLimit('maxWorkflows', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Tools</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxTools}
                    onChange={(e) => updateLimit('maxTools', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Data Sources</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxDataSources}
                    onChange={(e) => updateLimit('maxDataSources', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Documents</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxDocuments}
                    onChange={(e) => updateLimit('maxDocuments', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Team Members</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxTeamMembers}
                    onChange={(e) => updateLimit('maxTeamMembers', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Monthly Token Limit</Label>
                  <Input
                    type="number"
                    value={formData.limits.monthlyTokenLimit}
                    onChange={(e) => updateLimit('monthlyTokenLimit', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Daily Token Limit</Label>
                  <Input
                    type="number"
                    value={formData.limits.dailyTokenLimit}
                    onChange={(e) => updateLimit('dailyTokenLimit', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Tokens Per Request</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxTokensPerRequest}
                    onChange={(e) => updateLimit('maxTokensPerRequest', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Document Size (MB)</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxDocumentSizeMB}
                    onChange={(e) => updateLimit('maxDocumentSizeMB', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Knowledge Base Size (MB)</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxKnowledgeBaseSizeMB}
                    onChange={(e) => updateLimit('maxKnowledgeBaseSizeMB', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Workflow Executions/Day</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxWorkflowExecutionsPerDay}
                    onChange={(e) => updateLimit('maxWorkflowExecutionsPerDay', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max API Calls/Day</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxApiCallsPerDay}
                    onChange={(e) => updateLimit('maxApiCallsPerDay', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Fine-tuning Jobs</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxFineTuningJobs}
                    onChange={(e) => updateLimit('maxFineTuningJobs', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Fine-tuning Datasets</Label>
                  <Input
                    type="number"
                    value={formData.limits.maxFineTuningDatasets}
                    onChange={(e) => updateLimit('maxFineTuningDatasets', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.basicAgents}
                    onCheckedChange={(checked) => updateFeature('basicAgents', checked)}
                  />
                  <Label>Basic Agents</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.advancedAgents}
                    onCheckedChange={(checked) => updateFeature('advancedAgents', checked)}
                  />
                  <Label>Advanced Agents</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.customModels}
                    onCheckedChange={(checked) => updateFeature('customModels', checked)}
                  />
                  <Label>Custom Models</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.fineTuning}
                    onCheckedChange={(checked) => updateFeature('fineTuning', checked)}
                  />
                  <Label>Fine-tuning</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.workflows}
                    onCheckedChange={(checked) => updateFeature('workflows', checked)}
                  />
                  <Label>Workflows</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.advancedWorkflows}
                    onCheckedChange={(checked) => updateFeature('advancedWorkflows', checked)}
                  />
                  <Label>Advanced Workflows</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.knowledgeBase}
                    onCheckedChange={(checked) => updateFeature('knowledgeBase', checked)}
                  />
                  <Label>Knowledge Base</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.semanticSearch}
                    onCheckedChange={(checked) => updateFeature('semanticSearch', checked)}
                  />
                  <Label>Semantic Search</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.hybridSearch}
                    onCheckedChange={(checked) => updateFeature('hybridSearch', checked)}
                  />
                  <Label>Hybrid Search</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.teamCollaboration}
                    onCheckedChange={(checked) => updateFeature('teamCollaboration', checked)}
                  />
                  <Label>Team Collaboration</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.roleBasedAccess}
                    onCheckedChange={(checked) => updateFeature('roleBasedAccess', checked)}
                  />
                  <Label>Role-Based Access</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.auditLogs}
                    onCheckedChange={(checked) => updateFeature('auditLogs', checked)}
                  />
                  <Label>Audit Logs</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.apiAccess}
                    onCheckedChange={(checked) => updateFeature('apiAccess', checked)}
                  />
                  <Label>API Access</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.webhooks}
                    onCheckedChange={(checked) => updateFeature('webhooks', checked)}
                  />
                  <Label>Webhooks</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.customIntegrations}
                    onCheckedChange={(checked) => updateFeature('customIntegrations', checked)}
                  />
                  <Label>Custom Integrations</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.basicAnalytics}
                    onCheckedChange={(checked) => updateFeature('basicAnalytics', checked)}
                  />
                  <Label>Basic Analytics</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.advancedAnalytics}
                    onCheckedChange={(checked) => updateFeature('advancedAnalytics', checked)}
                  />
                  <Label>Advanced Analytics</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.customReports}
                    onCheckedChange={(checked) => updateFeature('customReports', checked)}
                  />
                  <Label>Custom Reports</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.realTimeMonitoring}
                    onCheckedChange={(checked) => updateFeature('realTimeMonitoring', checked)}
                  />
                  <Label>Real-time Monitoring</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.emailSupport}
                    onCheckedChange={(checked) => updateFeature('emailSupport', checked)}
                  />
                  <Label>Email Support</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.prioritySupport}
                    onCheckedChange={(checked) => updateFeature('prioritySupport', checked)}
                  />
                  <Label>Priority Support</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.dedicatedSupport}
                    onCheckedChange={(checked) => updateFeature('dedicatedSupport', checked)}
                  />
                  <Label>Dedicated Support</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.sso}
                    onCheckedChange={(checked) => updateFeature('sso', checked)}
                  />
                  <Label>SSO</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.features.customDomain}
                    onCheckedChange={(checked) => updateFeature('customDomain', checked)}
                  />
                  <Label>Custom Domain</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <Label>SLA Response Time (Days)</Label>
                  <Input
                    type="number"
                    value={formData.features.slaDays}
                    onChange={(e) => updateFeature('slaDays', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Data Retention (Days)</Label>
                  <Input
                    type="number"
                    value={formData.features.dataRetentionDays}
                    onChange={(e) => updateFeature('dataRetentionDays', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Backup Frequency (Hours)</Label>
                  <Input
                    type="number"
                    value={formData.features.backupFrequencyHours}
                    onChange={(e) => updateFeature('backupFrequencyHours', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
