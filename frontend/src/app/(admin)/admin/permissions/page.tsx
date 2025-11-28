'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, User, Key, Plus, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface UserWithPermissions {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  organization: {
    id: string;
    name: string;
  } | null;
  roles: (string | { name: string; displayName?: string; [key: string]: any })[];
  permissions: string[];
  roleCount: number;
  permissionCount: number;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  level: number;
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [showAssignRole, setShowAssignRole] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      // Fetch platform users (admins/staff only)
      const usersResponse = await fetch('http://localhost:3001/api/v1/admin/platform-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Transform to match expected format
        const transformedUsers = usersData.map((user: any) => ({
          id: user.id,
          email: user.email,
          firstName: user.fullName?.split(' ')[0] || '',
          lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
          fullName: user.fullName,
          isActive: user.isActive,
          organization: null, // Platform users don't have organizations
          roles: user.roles || [user.adminRole],
          permissions: [],
          roleCount: user.roles?.length || 1,
          permissionCount: 0,
        }));
        setUsers(transformedUsers);
      }

      // Fetch available roles
      const rolesResponse = await fetch('http://localhost:3001/api/v1/admin/permissions/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (email: string, adminRole: string) => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      
      // Find the user by email to get their ID
      const user = users.find(u => u.email === email);
      if (!user) {
        alert('User not found');
        return;
      }

      // Update platform user's admin role
      const response = await fetch(`http://localhost:3001/api/v1/admin/platform-users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminRole }),
      });

      if (response.ok) {
        await fetchData();
        alert(`Admin role changed to ${adminRole.replace('_', ' ')} successfully!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change admin role');
    }
  };


  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Platform Team Management</h1>
        </div>
        <p className="text-gray-600">
          Manage platform team members and their admin roles (super_admin, admin, support)
        </p>
        <p className="text-sm text-amber-600 mt-1">
          Note: This is for internal platform staff only. Customer users are managed in the "Customers" section.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Platform Team</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.roles.some(r => 
                  typeof r === 'string' ? r === 'super_admin' : r.name === 'super_admin'
                )).length}
              </p>
            </div>
            <Key className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.isActive).length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search platform team members by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Platform Team Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role, idx) => {
                          const roleName = typeof role === 'string' ? role : role.name || role.displayName || 'Unknown';
                          const roleColor = roleName === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                          roleName === 'admin' ? 'bg-blue-100 text-blue-800' :
                                          'bg-green-100 text-green-800';
                          return (
                            <span key={idx} className={`px-2 py-1 rounded text-xs font-medium ${roleColor}`}>
                              {roleName.replace('_', ' ')}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-gray-400">No role</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {/* This would need to be added to the API response */}
                      -
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignRole(true);
                        }}
                      >
                        Change Role
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin Roles Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Super Admin */}
          <Card className="p-6 border-purple-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Super Admin</h3>
                <p className="text-sm text-gray-500">super_admin</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Highest</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Full system access with ability to manage all platform users, settings, and resources.
            </p>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Create/delete platform users</li>
                <li>• Manage all admin settings</li>
                <li>• Access all customer data</li>
                <li>• Configure system settings</li>
              </ul>
            </div>
          </Card>

          {/* Admin */}
          <Card className="p-6 border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Admin</h3>
                <p className="text-sm text-gray-500">admin</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">High</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Manage customers, view analytics, and handle platform operations.
            </p>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• View/manage customers</li>
                <li>• Access analytics</li>
                <li>• Handle support tickets</li>
                <li>• View system logs</li>
              </ul>
            </div>
          </Card>

          {/* Support */}
          <Card className="p-6 border-green-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Support</h3>
                <p className="text-sm text-gray-500">support</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Limited</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Handle customer support tickets and basic user inquiries.
            </p>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Capabilities</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Manage support tickets</li>
                <li>• View customer profiles</li>
                <li>• Access support tools</li>
                <li>• Limited system access</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Role Modal */}
      {showAssignRole && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Change Admin Role for {selectedUser.fullName}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Select the admin role for this platform team member:
            </p>
            
            <div className="space-y-3">
              {/* Super Admin */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 border-purple-200">
                <div>
                  <p className="font-medium text-gray-900">Super Admin</p>
                  <p className="text-sm text-gray-500">Full system access</p>
                </div>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    assignRole(selectedUser.email, 'super_admin');
                    setShowAssignRole(false);
                    setSelectedUser(null);
                  }}
                  disabled={selectedUser.roles.some(r => 
                    typeof r === 'string' ? r === 'super_admin' : r.name === 'super_admin'
                  )}
                >
                  {selectedUser.roles.some(r => 
                    typeof r === 'string' ? r === 'super_admin' : r.name === 'super_admin'
                  ) ? 'Current' : 'Assign'}
                </Button>
              </div>

              {/* Admin */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 border-blue-200">
                <div>
                  <p className="font-medium text-gray-900">Admin</p>
                  <p className="text-sm text-gray-500">Manage customers & operations</p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    assignRole(selectedUser.email, 'admin');
                    setShowAssignRole(false);
                    setSelectedUser(null);
                  }}
                  disabled={selectedUser.roles.some(r => 
                    typeof r === 'string' ? r === 'admin' : r.name === 'admin'
                  )}
                >
                  {selectedUser.roles.some(r => 
                    typeof r === 'string' ? r === 'admin' : r.name === 'admin'
                  ) ? 'Current' : 'Assign'}
                </Button>
              </div>

              {/* Support */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 border-green-200">
                <div>
                  <p className="font-medium text-gray-900">Support</p>
                  <p className="text-sm text-gray-500">Handle support tickets</p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    assignRole(selectedUser.email, 'support');
                    setShowAssignRole(false);
                    setSelectedUser(null);
                  }}
                  disabled={selectedUser.roles.some(r => 
                    typeof r === 'string' ? r === 'support' : r.name === 'support'
                  )}
                >
                  {selectedUser.roles.some(r => 
                    typeof r === 'string' ? r === 'support' : r.name === 'support'
                  ) ? 'Current' : 'Assign'}
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignRole(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
