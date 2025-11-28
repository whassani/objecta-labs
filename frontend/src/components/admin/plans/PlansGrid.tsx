'use client';

import PlanCard from './PlanCard';

interface PlansGridProps {
  plans: any[];
  statistics: Record<string, any>;
  onEdit: (plan: any) => void;
  onToggleStatus: (planId: string, isActive: boolean) => void;
  onDelete: (planId: string) => void;
}

export default function PlansGrid({ 
  plans, 
  statistics, 
  onEdit, 
  onToggleStatus, 
  onDelete 
}: PlansGridProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No plans yet</h3>
        <p className="text-gray-500">Create your first subscription plan to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          statistics={statistics[plan.id]}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
