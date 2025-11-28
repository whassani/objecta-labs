'use client';

import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PlansErrorProps {
  error: string;
  onRetry: () => void;
}

export default function PlansError({ error, onRetry }: PlansErrorProps) {
  return (
    <div className="text-center py-12">
      <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load plans</h3>
      <p className="text-gray-600 mb-6">{error}</p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
