'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  tier: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: any;
  features: any;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

interface EditPlanModalProps {
  plan: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPlanModal({ plan, onClose, onSuccess }: EditPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(plan);
  const [hasChanges, setHasChanges] = useState(false);
  
  console.log('Edit modal rendered', { formData, activeTab });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Filter out read-only fields and ensure proper types
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        priceMonthly: Number(formData.priceMonthly),
        priceYearly: Number(formData.priceYearly),
        limits: formData.limits,
        features: formData.features,
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        sortOrder: Number(formData.sortOrder),
      };
      
      // Only include Stripe IDs if they exist in the form
      if ('stripePriceIdMonthly' in formData) {
        updateData.stripePriceIdMonthly = (formData as any).stripePriceIdMonthly;
      }
      if ('stripePriceIdYearly' in formData) {
        updateData.stripePriceIdYearly = (formData as any).stripePriceIdYearly;
      }
      
      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update plan');
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData({ ...formData, ...updates });
    setHasChanges(true);
  };

  const updateLimit = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFormData({
      ...formData,
      limits: { ...formData.limits, [key]: numValue },
    });
    setHasChanges(true);
  };

  const updateFeature = (key: string, value: boolean | number) => {
    setFormData({
      ...formData,
      features: { ...formData.features, [key]: value },
    });
    setHasChanges(true);
  };

  const formatLimitLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const getLimitHint = (key: string): string => {
    if (key.includes('Token')) return 'Use -1 for unlimited';
    if (key.includes('max')) return '-1 = unlimited, 0 = disabled';
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Plan: {plan.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tier: <span className="font-medium">{plan.tier.replace('_', ' ').toUpperCase()}</span>
              {hasChanges && <span className="ml-2 text-orange-600">• Unsaved changes</span>}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-8 mt-6 p-5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error updating plan</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(92vh-160px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-8 py-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-8 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Plan Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange({ name: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="e.g., Professional, Enterprise"
                  />
                </div>

                <div>
                  <Label htmlFor="tier" className="text-sm font-medium text-gray-700">
                    Tier (Read-only)
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="tier"
                      value={formData.tier.replace('_', ' ').toUpperCase()}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-xs text-gray-400">Cannot be changed</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    The tier is locked after creation to maintain data integrity
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange({ description: e.target.value })}
                    rows={3}
                    className="mt-1"
                    placeholder="Brief description of what this plan offers"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    {formData.description?.length || 0} characters
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-5">Display Settings</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="sortOrder" className="text-sm font-medium text-gray-700">
                      Sort Order
                    </Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => handleFormChange({ sortOrder: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Lower numbers appear first</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleFormChange({ isActive: checked })}
                        />
                        <div>
                          <Label className="text-sm font-medium">Active</Label>
                          <p className="text-xs text-gray-500">Visible to users</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.isPopular}
                          onCheckedChange={(checked) => handleFormChange({ isPopular: checked })}
                        />
                        <div>
                          <Label className="text-sm font-medium">Popular</Label>
                          <p className="text-xs text-gray-500">Show "Popular" badge</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-8 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <p className="text-sm text-blue-800 leading-relaxed">
                  💡 <strong>Tip:</strong> Offer a discount on yearly pricing to encourage annual commitments.
                  Typical discounts range from 10-20%.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="priceMonthly" className="text-sm font-medium text-gray-700">
                    Monthly Price (USD) *
                  </Label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      $
                    </span>
                    <Input
                      id="priceMonthly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceMonthly}
                      onChange={(e) => handleFormChange({ priceMonthly: parseFloat(e.target.value) || 0 })}
                      required
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Price charged per month for this plan
                  </p>
                </div>

                <div>
                  <Label htmlFor="priceYearly" className="text-sm font-medium text-gray-700">
                    Yearly Price (USD) *
                  </Label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      $
                    </span>
                    <Input
                      id="priceYearly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceYearly}
                      onChange={(e) => handleFormChange({ priceYearly: parseFloat(e.target.value) || 0 })}
                      required
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Price charged per year (usually discounted from monthly × 12)
                  </p>
                </div>

                {/* Savings Calculation */}
                {formData.priceMonthly > 0 && formData.priceYearly > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-900">Yearly Savings</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-green-800">
                            <span className="font-semibold">
                              ${(formData.priceMonthly * 12 - formData.priceYearly).toFixed(2)}
                            </span>
                            {' '}savings compared to monthly billing
                          </p>
                          <p className="text-sm text-green-700">
                            <span className="font-semibold">
                              {(((formData.priceMonthly * 12 - formData.priceYearly) / (formData.priceMonthly * 12)) * 100).toFixed(1)}%
                            </span>
                            {' '}discount
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            Effective monthly rate: ${(formData.priceYearly / 12).toFixed(2)}/month
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Limits Tab */}
            <TabsContent value="limits" className="space-y-8 mt-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <p className="text-sm text-purple-800 leading-relaxed">
                  <strong>Limit Values:</strong> Use <code className="bg-purple-100 px-2 py-1 rounded">-1</code> for unlimited,{' '}
                  <code className="bg-purple-100 px-2 py-1 rounded">0</code> to disable, or any positive number for the limit.
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Group limits by category */}
                {[
                  { title: 'Core Resources', keys: ['maxAgents', 'maxConversations', 'maxWorkflows', 'maxTools', 'maxDataSources', 'maxDocuments', 'maxTeamMembers'] },
                  { title: 'Token Limits', keys: ['monthlyTokenLimit', 'dailyTokenLimit', 'maxTokensPerRequest'] },
                  { title: 'Storage Limits', keys: ['maxDocumentSizeMB', 'maxKnowledgeBaseSizeMB'] },
                  { title: 'API & Execution', keys: ['maxWorkflowExecutionsPerDay', 'maxApiCallsPerDay'] },
                  { title: 'Fine-tuning', keys: ['maxFineTuningJobs', 'maxFineTuningDatasets', 'maxTrainingExamplesPerDataset'] }
                ].map((category) => (
                  <div key={category.title} className="border-t pt-6 first:border-t-0 first:pt-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">{category.title}</h3>
                    <div className="grid grid-cols-2 gap-5">
                      {category.keys.filter(key => formData.limits[key] !== undefined).map((key) => (
                        <div key={key}>
                          <Label htmlFor={`limit-${key}`} className="text-sm font-medium text-gray-700">
                            {formatLimitLabel(key)}
                          </Label>
                          <Input
                            id={`limit-${key}`}
                            type="number"
                            value={formData.limits[key]}
                            onChange={(e) => updateLimit(key, e.target.value)}
                            className="mt-1"
                          />
                          {getLimitHint(key) && (
                            <p className="text-xs text-gray-500 mt-1">{getLimitHint(key)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-8 mt-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                <p className="text-sm text-indigo-800 leading-relaxed">
                  <strong>Features:</strong> Enable or disable specific platform capabilities for this plan.
                  Features control what users can access in the application.
                </p>
              </div>

              <div className="space-y-6">
                {/* Group features by category */}
                {[
                  { 
                    title: 'Agent Features', 
                    icon: '🤖',
                    keys: ['basicAgents', 'advancedAgents', 'customModels', 'fineTuning'] 
                  },
                  { 
                    title: 'Workflow Features', 
                    icon: '⚡',
                    keys: ['workflows', 'advancedWorkflows'] 
                  },
                  { 
                    title: 'Knowledge Base', 
                    icon: '📚',
                    keys: ['knowledgeBase', 'semanticSearch', 'hybridSearch'] 
                  },
                  { 
                    title: 'Collaboration', 
                    icon: '👥',
                    keys: ['teamCollaboration', 'roleBasedAccess', 'auditLogs'] 
                  },
                  { 
                    title: 'Integrations', 
                    icon: '🔌',
                    keys: ['apiAccess', 'webhooks', 'customIntegrations'] 
                  },
                  { 
                    title: 'Analytics', 
                    icon: '📊',
                    keys: ['basicAnalytics', 'advancedAnalytics', 'customReports', 'realTimeMonitoring'] 
                  },
                  { 
                    title: 'Support & SLA', 
                    icon: '💬',
                    keys: ['emailSupport', 'prioritySupport', 'dedicatedSupport', 'slaDays'] 
                  },
                  { 
                    title: 'Security', 
                    icon: '🔒',
                    keys: ['sso', 'customDomain', 'dataRetentionDays', 'backupFrequencyHours'] 
                  }
                ].map((category) => {
                  const categoryFeatures = category.keys.filter(key => formData.features[key] !== undefined);
                  if (categoryFeatures.length === 0) return null;

                  return (
                    <div key={category.title} className="border-t pt-6 first:border-t-0 first:pt-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-5">
                        {categoryFeatures.map((key) => {
                          const value = formData.features[key];
                          
                          if (typeof value === 'boolean') {
                            return (
                              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={value}
                                    onCheckedChange={(checked) => updateFeature(key, checked)}
                                  />
                                  <Label className="text-sm font-medium cursor-pointer">
                                    {formatLimitLabel(key)}
                                  </Label>
                                </div>
                              </div>
                            );
                          } else if (typeof value === 'number') {
                            return (
                              <div key={key}>
                                <Label htmlFor={`feature-${key}`} className="text-sm font-medium text-gray-700">
                                  {formatLimitLabel(key)}
                                </Label>
                                <Input
                                  id={`feature-${key}`}
                                  type="number"
                                  value={value}
                                  onChange={(e) => updateFeature(key, parseInt(e.target.value) || 0)}
                                  className="mt-1"
                                  placeholder={
                                    key.includes('Days') ? 'Days' : 
                                    key.includes('Hours') ? 'Hours' : 
                                    'Number'
                                  }
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {key.includes('sla') && 'Response time in days'}
                                  {key.includes('Retention') && 'Data retention period'}
                                  {key.includes('Backup') && 'Backup frequency'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {hasChanges ? (
                <span className="text-orange-600 font-medium">● Unsaved changes</span>
              ) : (
                <span className="text-green-600">✓ All changes saved</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !hasChanges}
                className="min-w-[120px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
