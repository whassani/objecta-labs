'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface Organization {
  id: string;
  name: string;
}

export function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    organizationId: user.organization?.id || '',
    role: user.role || 'member',
    isActive: user.isActive !== false,
    isAdmin: user.isAdmin || false,
    adminRole: user.adminRole || '',
  });

  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  const loadOrganizations = async () => {
    try {
      // Use the same admin customers endpoint as everywhere else
      console.log('Loading organizations from /v1/admin/customers...');
      const response: any = await api.get('/v1/admin/customers');
      console.log('Organizations API response:', response.data);
      // Extract customers array from response
      const customersList = response.data?.customers || [];
      console.log('Extracted customers list:', customersList);
      setOrganizations(customersList.map((org: any) => ({
        id: org.id,
        name: org.name
      })));
      console.log('Organizations loaded successfully:', customersList.length);
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationId: formData.organizationId,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (formData.isAdmin) {
        payload.isAdmin = true;
        payload.adminRole = formData.adminRole || 'admin';
      } else {
        payload.isAdmin = false;
        payload.adminRole = null;
      }

      await api.patch(`/v1/admin/users/${user.id}`, payload);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="organizationId">Organization *</Label>
            <select
              id="organizationId"
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="role">User Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              User is Active
            </Label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">
                Grant Platform Admin Access
              </Label>
            </div>

            {formData.isAdmin && (
              <div>
                <Label htmlFor="adminRole">Admin Role</Label>
                <select
                  id="adminRole"
                  value={formData.adminRole}
                  onChange={(e) => setFormData({ ...formData, adminRole: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="support">Support</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Super Admin: Full access | Admin: Most features | Support: Tickets only
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
