'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(plan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans/${plan.id}`, {
        method: 'PUT',
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
        alert(error.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan');
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
          <h2 className="text-xl font-bold">Edit Plan: {plan.name}</h2>
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
                />
              </div>

              <div>
                <Label htmlFor="tier">Tier (Read-only)</Label>
                <Input
                  id="tier"
                  value={formData.tier}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Tier cannot be changed after creation</p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                {Object.keys(formData.limits).map((key) => (
                  <div key={key}>
                    <Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Label>
                    <Input
                      type="number"
                      value={formData.limits[key]}
                      onChange={(e) => updateLimit(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(formData.features).map((key) => {
                  const value = formData.features[key];
                  
                  if (typeof value === 'boolean') {
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => updateFeature(key, checked)}
                        />
                        <Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Label>
                      </div>
                    );
                  } else if (typeof value === 'number') {
                    return (
                      <div key={key}>
                        <Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => updateFeature(key, parseInt(e.target.value))}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
