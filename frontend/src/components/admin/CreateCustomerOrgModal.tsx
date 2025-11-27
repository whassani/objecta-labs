'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, User, Eye, EyeOff } from 'lucide-react';

interface CreateCustomerOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCustomerOrgModal({ isOpen, onClose, onSuccess }: CreateCustomerOrgModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Organization details
    orgName: '',
    subdomain: '',
    plan: 'starter',
    // First admin user details
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create the organization
      const orgResponse: any = await api.post('/v1/admin/users/organizations', {
        name: formData.orgName,
        subdomain: formData.subdomain,
        plan: formData.plan,
      });

      const org = orgResponse.data;

      // Step 2: Create the first admin user for this organization
      await api.post('/v1/admin/users', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        organizationId: org.id,
        role: 'admin',
        userType: 'customer',
        isAdmin: false, // Organization admin, not platform admin
      });

      const successMessage = 
        `Customer Organization Created Successfully!\n\n` +
        `Organization: ${org.name}\n` +
        `Subdomain: ${org.subdomain}\n` +
        `Admin: ${formData.firstName} ${formData.lastName}\n` +
        `Email: ${formData.email}\n\n` +
        `The admin can now log in with their credentials.`;
      // eslint-disable-next-line no-alert
      alert(successMessage);

      onSuccess();
      // Reset form
      setFormData({
        orgName: '',
        subdomain: '',
        plan: 'starter',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
      });
    } catch (error: any) {
      console.error('Failed to create customer organization:', error);
      // eslint-disable-next-line no-alert
      alert(error.message || 'Failed to create customer organization');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateSubdomain = () => {
    if (!formData.subdomain || formData.subdomain === '') {
      const subdomain = formData.orgName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData({ ...formData, subdomain });
    }
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setFormData({ ...formData, subdomain: value });
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Create New Customer Organization
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Create a customer organization with its first administrator account
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
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
            </div>
          </div>

          {/* First Admin User Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              First Administrator
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This user will be the organization's first admin and can invite more users
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@acme.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the organization's email domain
              </p>
            </div>

            <div className="mt-4">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong>
              <br />
              1. Organization will be created with a 14-day trial
              <br />
              2. First admin user will be created and can log in immediately
              <br />
              3. Admin can invite more users to their organization
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Creating...' : 'Create Customer Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
