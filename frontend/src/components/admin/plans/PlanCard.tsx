'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

interface PlanCardProps {
  plan: any;
  statistics?: any;
  onEdit: (plan: any) => void;
  onToggleStatus: (planId: string, isActive: boolean) => void;
  onDelete: (planId: string) => void;
}

export default function PlanCard({ 
  plan, 
  statistics, 
  onEdit, 
  onToggleStatus, 
  onDelete 
}: PlanCardProps) {
  const formatLimit = (value: number): string => {
    if (value === -1) return '∞ Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'pro_max': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKeyFeatures = () => {
    const features = [];
    if (plan.features.fineTuning) features.push({ label: 'Fine-tuning', color: 'bg-green-100 text-green-800' });
    if (plan.features.advancedWorkflows) features.push({ label: 'Advanced Workflows', color: 'bg-blue-100 text-blue-800' });
    if (plan.features.hybridSearch) features.push({ label: 'Hybrid Search', color: 'bg-purple-100 text-purple-800' });
    if (plan.features.prioritySupport) features.push({ label: 'Priority Support', color: 'bg-orange-100 text-orange-800' });
    return features;
  };

  return (
    <Card className="p-7 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
      {/* Plan Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            {plan.isPopular && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                ⭐ Popular
              </span>
            )}
          </div>
          <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 font-medium ${getTierBadgeColor(plan.tier)}`}>
            {plan.tier.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          {plan.isActive ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" title="Active" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-red-500" title="Inactive" />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">{plan.description}</p>

      {/* Pricing */}
      <div className="mb-5">
        <div className="text-3xl font-bold text-gray-900">
          ${plan.priceMonthly}
          <span className="text-base font-normal text-gray-600">/month</span>
        </div>
        {plan.priceYearly > 0 && (
          <div className="text-sm text-gray-600">
            ${plan.priceYearly}/year 
            <span className="text-green-600 font-medium ml-1">
              (save ${(plan.priceMonthly * 12 - plan.priceYearly).toFixed(0)})
            </span>
          </div>
        )}
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Usage Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Active:</span>
              <span className="font-bold ml-1 text-blue-600">{statistics.subscriptions.active}</span>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="font-bold ml-1">{statistics.subscriptions.total}</span>
            </div>
            <div className="col-span-2 pt-1 border-t">
              <span className="text-gray-600">Monthly Revenue:</span>
              <span className="font-bold ml-1 text-green-600">
                ${statistics.estimatedRevenue.monthly.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Key Limits */}
      <div className="space-y-3 mb-5">
        <div className="text-sm font-medium text-gray-700 mb-3">Key Limits:</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-gray-600">Agents:</span>
            <span className="font-semibold">{formatLimit(plan.limits.maxAgents)}</span>
          </div>
          <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-gray-600">Workflows:</span>
            <span className="font-semibold">{formatLimit(plan.limits.maxWorkflows)}</span>
          </div>
          <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-gray-600">Team:</span>
            <span className="font-semibold">{formatLimit(plan.limits.maxTeamMembers)}</span>
          </div>
          <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-gray-600">Tokens/mo:</span>
            <span className="font-semibold">{formatLimit(plan.limits.monthlyTokenLimit)}</span>
          </div>
        </div>
      </div>

      {/* Key Features */}
      {getKeyFeatures().length > 0 && (
        <div className="space-y-3 mb-5">
          <div className="text-sm font-medium text-gray-700 mb-3">Key Features:</div>
          <div className="flex flex-wrap gap-2">
            {getKeyFeatures().map((feature, idx) => (
              <span key={idx} className={`text-xs px-2 py-1 rounded font-medium ${feature.color}`}>
                {feature.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-5 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(plan)}
          className="flex-1"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(plan.id, plan.isActive)}
          className={`flex-1 ${!plan.isActive ? 'text-green-600 hover:text-green-700' : ''}`}
        >
          {plan.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(plan.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
