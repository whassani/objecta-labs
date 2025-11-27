'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Flag, Loader2, Plus, Edit, Trash2, Target, Percent } from 'lucide-react';
import { api } from '@/lib/api';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  rolloutStrategy: 'all' | 'percentage' | 'whitelist' | 'plan';
  targetPlans: string[];
  targetOrgs: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    enabled: false,
    rolloutPercentage: 0,
    rolloutStrategy: 'all' as 'all' | 'percentage' | 'whitelist' | 'plan',
    targetPlans: [] as string[],
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/admin/settings/features');
      setFlags(response.data);
    } catch (error: any) {
      console.error('Failed to load feature flags:', error);
      alert('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      await api.put(`/v1/admin/settings/features/${flag.key}`, {
        enabled: !flag.enabled,
      });
      await loadFlags();
    } catch (error: any) {
      console.error('Failed to toggle flag:', error);
      alert('Failed to toggle feature flag');
    }
  };

  const updateRolloutPercentage = async (flag: FeatureFlag, percentage: number) => {
    try {
      await api.put(`/v1/admin/settings/features/${flag.key}`, {
        rolloutPercentage: percentage,
      });
      await loadFlags();
    } catch (error: any) {
      console.error('Failed to update rollout:', error);
      alert('Failed to update rollout percentage');
    }
  };

  const deleteFlag = async (key: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;

    try {
      await api.delete(`/v1/admin/settings/features/${key}`);
      await loadFlags();
    } catch (error: any) {
      console.error('Failed to delete flag:', error);
      alert('Failed to delete feature flag');
    }
  };

  const openCreateDialog = () => {
    setEditingFlag(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      enabled: false,
      rolloutPercentage: 0,
      rolloutStrategy: 'all',
      targetPlans: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      name: flag.name,
      key: flag.key,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      rolloutStrategy: flag.rolloutStrategy,
      targetPlans: flag.targetPlans,
    });
    setIsDialogOpen(true);
  };

  const saveFlag = async () => {
    try {
      if (editingFlag) {
        // Update existing
        await api.put(`/v1/admin/settings/features/${editingFlag.key}`, formData);
      } else {
        // Create new
        await api.post('/v1/admin/settings/features', formData);
      }
      setIsDialogOpen(false);
      await loadFlags();
    } catch (error: any) {
      console.error('Failed to save flag:', error);
      alert('Failed to save feature flag: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStrategyBadge = (strategy: string) => {
    const colors = {
      all: 'bg-green-100 text-green-800',
      percentage: 'bg-blue-100 text-blue-800',
      whitelist: 'bg-purple-100 text-purple-800',
      plan: 'bg-orange-100 text-orange-800',
    };
    return colors[strategy as keyof typeof colors] || colors.all;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8 text-blue-600" />
            Feature Flags
          </h1>
          <p className="text-gray-600 mt-2">Manage feature rollouts and A/B testing</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Feature Flag
        </Button>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{flag.name}</h3>
                    <Badge className={getStrategyBadge(flag.rolloutStrategy)}>
                      {flag.rolloutStrategy}
                    </Badge>
                    {flag.enabled ? (
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{flag.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono">{flag.key}</span>
                    {flag.rolloutStrategy === 'percentage' && (
                      <span className="flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        {flag.rolloutPercentage}% rollout
                      </span>
                    )}
                    {flag.rolloutStrategy === 'plan' && flag.targetPlans.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Plans: {flag.targetPlans.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(flag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFlag(flag.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {flag.rolloutStrategy === 'percentage' && flag.enabled && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm">Rollout Percentage</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flag.rolloutPercentage}
                      onChange={(e) => updateRolloutPercentage(flag, parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-semibold w-12 text-right">{flag.rolloutPercentage}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {flags.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No feature flags yet</h3>
              <p className="text-gray-500 mb-4">Create your first feature flag to get started</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Feature Flag
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFlag ? 'Edit Feature Flag' : 'Create Feature Flag'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Advanced Analytics"
              />
            </div>
            <div>
              <Label>Key</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="advanced_analytics"
                disabled={!!editingFlag}
              />
              <p className="text-sm text-gray-500 mt-1">
                Unique identifier (cannot be changed after creation)
              </p>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enable advanced analytics dashboard"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
            <div>
              <Label>Rollout Strategy</Label>
              <select
                value={formData.rolloutStrategy}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  rolloutStrategy: e.target.value as any 
                })}
                className="w-full border rounded-md p-2"
              >
                <option value="all">All users</option>
                <option value="percentage">Percentage rollout</option>
                <option value="plan">Plan-based</option>
                <option value="whitelist">Whitelist only</option>
              </select>
            </div>
            {formData.rolloutStrategy === 'percentage' && (
              <div>
                <Label>Rollout Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.rolloutPercentage}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    rolloutPercentage: parseInt(e.target.value) 
                  })}
                />
              </div>
            )}
            {formData.rolloutStrategy === 'plan' && (
              <div>
                <Label>Target Plans (comma-separated)</Label>
                <Input
                  value={formData.targetPlans.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    targetPlans: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="professional, enterprise"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveFlag}>
                {editingFlag ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
