'use client';

import { useState } from 'react';
import CreatePlanModal from '@/components/admin/CreatePlanModal';
import EditPlanModal from '@/components/admin/EditPlanModal';
import PlansHeader from '@/components/admin/plans/PlansHeader';
import PlansGrid from '@/components/admin/plans/PlansGrid';
import PlansLoading from '@/components/admin/plans/PlansLoading';
import PlansError from '@/components/admin/plans/PlansError';
import { usePlans } from '@/components/admin/plans/usePlans';

export default function SubscriptionPlansPage() {
  const { plans, loading, error, statistics, refetch, togglePlanStatus, deletePlan } = usePlans();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingPlan(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PlansHeader onCreatePlan={() => setShowCreateModal(true)} />
        <PlansLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PlansHeader onCreatePlan={() => setShowCreateModal(true)} />
        <PlansError error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlansHeader onCreatePlan={() => setShowCreateModal(true)} />
      
      <PlansGrid
        plans={plans}
        statistics={statistics}
        onEdit={setEditingPlan}
        onToggleStatus={togglePlanStatus}
        onDelete={deletePlan}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
