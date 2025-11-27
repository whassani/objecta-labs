'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';

// Types
interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isDefault: boolean;
  level: number;
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  name: string;
  actions: string[];
  enabled: boolean;
}

interface ResourcePermission {
  resource: string;
  actions: string[];
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResource, setFilterResource] = useState<string>('all');
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/v1/permissions/roles');
      return response.data;
    },
  });

  // Fetch resources and actions
  const { data: resourcesData } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await api.get('/v1/permissions/resources');
      return response.data;
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/v1/permissions/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRole(null);
    },
  });

  const resources = resourcesData?.resources || [];
  const actions = resourcesData?.actions || [];

  const filteredRoles = roles?.filter((role: Role) => {
    const matchesSearch = role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleResourceExpand = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  const getPermissionsByResource = (permissions: string[]) => {
    const grouped: Record<string, string[]> = {};
    
    permissions.forEach(permission => {
      const [resource, action] = permission.split(':');
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(action);
    });

    return grouped;
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsCreating(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsCreating(false);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      await deleteRoleMutation.mutateAsync(roleId);
    }
  };

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-gray-600 mt-2">Manage roles and permissions for your organization</p>
        </div>
        <Button onClick={handleCreateRole} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Key className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resources</p>
              <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">System Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles?.filter((r: Role) => r.isSystem).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Custom Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles?.filter((r: Role) => !r.isSystem).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredRoles?.map((role: Role) => (
                <div
                  key={role.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole?.id === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleEditRole(role)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{role.displayName}</h3>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                        {role.isDefault && (
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} permissions
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Level {role.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Role Details / Edit */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <RoleEditor
              role={selectedRole}
              resources={resources}
              actions={actions}
              onClose={() => setSelectedRole(null)}
              onDelete={handleDeleteRole}
            />
          ) : isCreating ? (
            <RoleCreator
              resources={resources}
              actions={actions}
              onClose={() => setIsCreating(false)}
            />
          ) : (
            <Card className="p-12 text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Role Selected</h3>
              <p className="text-gray-600 mb-6">
                Select a role from the list to view and edit permissions, or create a new role.
              </p>
              <Button onClick={handleCreateRole}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Role
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Role Editor Component
function RoleEditor({ 
  role, 
  resources, 
  actions, 
  onClose, 
  onDelete 
}: { 
  role: Role; 
  resources: string[]; 
  actions: string[]; 
  onClose: () => void;
  onDelete: (roleId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { permissions: string[] }) => {
      await api.put(`/v1/permissions/roles/${role.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const permissionsByResource = permissions.reduce((acc, permission) => {
    const [resource, action] = permission.split(':');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(action);
    return acc;
  }, {} as Record<string, string[]>);

  const togglePermission = (resource: string, action: string) => {
    const permission = `${resource}:${action}`;
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleResourceExpand = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  const toggleAllResourceActions = (resource: string) => {
    const resourcePermissions = actions.map(action => `${resource}:${action}`);
    const allEnabled = resourcePermissions.every(p => permissions.includes(p));

    if (allEnabled) {
      // Remove all
      setPermissions(prev => prev.filter(p => !p.startsWith(`${resource}:`)));
    } else {
      // Add all
      setPermissions(prev => {
        const filtered = prev.filter(p => !p.startsWith(`${resource}:`));
        return [...filtered, ...resourcePermissions];
      });
    }
  };

  const handleSave = async () => {
    await updateRoleMutation.mutateAsync({ permissions });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{role.displayName}</h2>
          <p className="text-gray-600">{role.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {!role.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(role.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {role.isSystem && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">System Role</p>
              <p className="text-sm text-yellow-700">
                This is a system role and cannot be modified or deleted.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Permissions ({permissions.length})</h3>
          {!role.isSystem && (
            <Button
              onClick={handleSave}
              disabled={updateRoleMutation.isPending}
              size="sm"
            >
              {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {resources.map((resource: string) => {
            const resourcePerms = permissionsByResource[resource] || [];
            const allEnabled = actions.every(action => resourcePerms.includes(action));
            const someEnabled = actions.some(action => resourcePerms.includes(action));
            const isExpanded = expandedResources.has(resource);

            return (
              <div key={resource} className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleResourceExpand(resource)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {resource.replace('-', ' ')}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {resourcePerms.length}/{actions.length}
                    </Badge>
                  </div>
                  {!role.isSystem && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allEnabled}
                        onChange={() => toggleAllResourceActions(resource)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-600">All</span>
                    </label>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {actions.map((action: string) => {
                      const permission = `${resource}:${action}`;
                      const isEnabled = permissions.includes(permission);

                      return (
                        <label
                          key={action}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isEnabled
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${role.isSystem ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => !role.isSystem && togglePermission(resource, action)}
                            disabled={role.isSystem}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {action}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// Role Creator Component
function RoleCreator({ 
  resources, 
  actions, 
  onClose 
}: { 
  resources: string[]; 
  actions: string[]; 
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [level, setLevel] = useState(0);

  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/v1/permissions/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoleMutation.mutateAsync({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      displayName,
      description,
      permissions,
      level,
    });
  };

  const togglePermission = (resource: string, action: string) => {
    const permission = `${resource}:${action}`;
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Role</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Content Editor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe this role and its purpose..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Level (0-100)
          </label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            min={0}
            max={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Higher levels have more authority in role hierarchy
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Select Permissions ({permissions.length} selected)
          </label>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {resources.map((resource: string) => (
              <div key={resource} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 capitalize mb-3">
                  {resource.replace('-', ' ')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {actions.map((action: string) => {
                    const permission = `${resource}:${action}`;
                    const isEnabled = permissions.includes(permission);

                    return (
                      <label
                        key={action}
                        className={`flex items-center gap-2 p-2 rounded border-2 cursor-pointer transition-all ${
                          isEnabled
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => togglePermission(resource, action)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm capitalize">{action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!displayName || permissions.length === 0 || createRoleMutation.isPending}
          >
            {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
