import { useState, useEffect } from 'react';

interface SubscriptionPlan {
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
  createdAt: string;
  updatedAt: string;
}

interface PlanStatistics {
  plan: {
    id: string;
    name: string;
    tier: string;
  };
  subscriptions: {
    total: number;
    active: number;
    inactive: number;
  };
  estimatedRevenue: {
    monthly: number;
    yearly: number;
  };
}

export function usePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Record<string, PlanStatistics>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      const data = await response.json();
      setPlans(data);
      
      // Fetch statistics for each plan
      for (const plan of data) {
        fetchPlanStatistics(plan.id);
      }
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanStatistics = async (planId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans/${planId}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(prev => ({ ...prev, [planId]: data }));
      }
    } catch (error) {
      console.error('Error fetching plan statistics:', error);
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const action = isActive ? 'deactivate' : 'activate';
      
      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans/${planId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchPlans();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling plan status:', error);
      return false;
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return false;
    }

    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchPlans();
        return true;
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete plan');
        return false;
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlans();
    }
  }, [token]);

  return {
    plans,
    loading,
    error,
    statistics,
    refetch: fetchPlans,
    togglePlanStatus,
    deletePlan,
  };
}
