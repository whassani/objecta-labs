'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2 } from 'lucide-react';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan: 'starter',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response: any = await api.post('/v1/admin/users/organizations', formData);
      const org = response.data;
      const message = `Organization created successfully!\nFull subdomain: ${org.subdomain}`;
      // eslint-disable-next-line no-alert
      alert(message);
      onSuccess();
      setFormData({ name: '', subdomain: '', plan: 'starter' });
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      // eslint-disable-next-line no-alert
      alert(error.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-generate subdomain from name if subdomain is empty
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setFormData({ ...formData, subdomain: value });
  };

  const autoGenerateSubdomain = () => {
    const subdomain = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setFormData({ ...formData, subdomain });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={autoGenerateSubdomain}
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div>
            <Label htmlFor="subdomain">Subdomain Base *</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={handleSubdomainChange}
                placeholder="acme"
                required
                pattern="[a-z0-9\-]+"
                title="Only lowercase letters, numbers, and hyphens allowed"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">-{'{timestamp}'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              A timestamp will be added automatically to ensure uniqueness (e.g., acme-1234567890)
            </p>
          </div>

          <div>
            <Label htmlFor="plan">Plan</Label>
            <select
              id="plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              New organizations start with a 14-day trial period
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
