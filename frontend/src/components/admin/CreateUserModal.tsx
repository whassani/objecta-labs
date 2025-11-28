'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Organization {
  id: string;
  name: string;
}


export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    organizationId: '',
    role: 'member',
    isAdmin: false,
    adminRole: '',
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
        password: formData.password,
        role: formData.role,
        userType: 'platform_team', // Always platform team
        organizationId: null, // Platform users don't have organization
      };

      if (formData.isAdmin) {
        payload.isAdmin = true;
        payload.adminRole = formData.adminRole || 'admin';
      }

      await api.post('/v1/admin/users', payload);
      onSuccess();
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        organizationId: '',
        role: 'member',
        isAdmin: true,
        adminRole: 'admin',
      });
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Create New Platform User
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Create an internal team member (support, admin, developer)
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info about Platform Users */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Platform Users:</strong> Internal team members who manage the platform. 
              They don't belong to any customer organization and have admin access.
            </p>
          </div>

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
            <Label htmlFor="password">Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <Button type="button" variant="outline" onClick={generatePassword}>
                Generate
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
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
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
