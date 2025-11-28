'use client';

import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';

interface PlansHeaderProps {
  onCreatePlan: () => void;
}

export default function PlansHeader({ onCreatePlan }: PlansHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">
          Manage subscription plans, pricing, limits, and features
        </p>
      </div>
      <Button onClick={onCreatePlan} size="lg">
        <PlusIcon className="h-5 w-5 mr-2" />
        Create Plan
      </Button>
    </div>
  );
}
