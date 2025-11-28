'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Eye, EyeOff, Plus, Loader2, Save, Key, Lock, Unlock, RotateCw, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface Secret {
  id: string;
  key: string;
  maskedValue: string;
  category: string;
  environment: string;
  description: string;
  lastRotatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SecretCategory {
  category: string;
  count: number;
}

export default function SecretsVaultPage() {
  const [loading, setLoading] = useState(true);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [categories, setCategories] = useState<SecretCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadSecrets();
    loadCategories();
  }, []);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/admin/secrets');
      setSecrets(response.data);
    } catch (error: any) {
      console.error('Failed to load secrets:', error);
      alert('Failed to load secrets: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/v1/admin/secrets/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const filteredSecrets = selectedCategory === 'all' 
    ? secrets 
    : secrets.filter(s => s.category === selectedCategory);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading secrets vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Secrets Vault
          </h1>
          <p className="text-gray-600 mt-2">Encrypted storage for API keys and sensitive credentials</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Secret
        </Button>
      </div>

      {/* Security Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Security Notice</p>
              <p className="text-sm text-yellow-800">
                All secrets are encrypted with AES-256-GCM. Access is logged and audited. Only super admins can view decrypted values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
        >
          All ({secrets.length})
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.category}
            variant={selectedCategory === cat.category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.category)}
          >
            {cat.category} ({cat.count})
          </Button>
        ))}
      </div>

      {/* Secrets by Category */}
      <div className="space-y-6">
        {/* Stripe Secrets */}
        {(selectedCategory === 'all' || selectedCategory === 'stripe') && (
          <SecretSection
            title="Stripe Configuration"
            icon={<Key className="h-5 w-5" />}
            secrets={filteredSecrets.filter(s => s.category === 'stripe')}
            onReload={loadSecrets}
          />
        )}

        {/* SMTP Secrets */}
        {(selectedCategory === 'all' || selectedCategory === 'smtp') && (
          <SecretSection
            title="SMTP Configuration"
            icon={<Key className="h-5 w-5" />}
            secrets={filteredSecrets.filter(s => s.category === 'smtp')}
            onReload={loadSecrets}
          />
        )}

        {/* LLM Provider Secrets */}
        {(selectedCategory === 'all' || selectedCategory === 'llm') && (
          <SecretSection
            title="LLM Provider Keys"
            icon={<Key className="h-5 w-5" />}
            secrets={filteredSecrets.filter(s => s.category === 'llm')}
            onReload={loadSecrets}
          />
        )}

        {/* OAuth Secrets */}
        {(selectedCategory === 'all' || selectedCategory === 'oauth') && (
          <SecretSection
            title="OAuth Credentials"
            icon={<Lock className="h-5 w-5" />}
            secrets={filteredSecrets.filter(s => s.category === 'oauth')}
            onReload={loadSecrets}
          />
        )}

        {/* Other Categories */}
        {categories
          .filter(c => !['stripe', 'smtp', 'llm', 'oauth'].includes(c.category))
          .filter(c => selectedCategory === 'all' || selectedCategory === c.category)
          .map(cat => (
            <SecretSection
              key={cat.category}
              title={`${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} Secrets`}
              icon={<Key className="h-5 w-5" />}
              secrets={filteredSecrets.filter(s => s.category === cat.category)}
              onReload={loadSecrets}
            />
          ))}
      </div>

      {/* Empty State */}
      {filteredSecrets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No secrets found</h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory === 'all' 
                ? 'Add your first secret to get started'
                : `No secrets in the ${selectedCategory} category`}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Secret
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Secret Dialog */}
      <CreateSecretDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          loadSecrets();
          loadCategories();
        }}
      />
    </div>
  );
}

// Secret Section Component
function SecretSection({ 
  title, 
  icon, 
  secrets, 
  onReload 
}: { 
  title: string; 
  icon: React.ReactNode; 
  secrets: Secret[];
  onReload: () => void;
}) {
  if (secrets.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {secrets.map((secret) => (
          <SecretItem key={secret.id} secret={secret} onReload={onReload} />
        ))}
      </CardContent>
    </Card>
  );
}

// Secret Item Component
function SecretItem({ secret, onReload }: { secret: Secret; onReload: () => void }) {
  const [showValue, setShowValue] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState('');
  const [loading, setLoading] = useState(false);

  const viewSecret = async () => {
    if (showValue) {
      setShowValue(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/v1/admin/secrets/${secret.key}`);
      setDecryptedValue(response.data.value);
      setShowValue(true);
    } catch (error: any) {
      alert('Failed to decrypt secret: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteSecret = async () => {
    if (!confirm(`Are you sure you want to delete secret "${secret.key}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/v1/admin/secrets/${secret.key}`);
      alert('Secret deleted successfully');
      onReload();
    } catch (error: any) {
      alert('Failed to delete secret: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{secret.key}</code>
            <Badge variant="outline">{secret.environment}</Badge>
            {secret.lastRotatedAt && (
              <Badge variant="outline" className="text-xs">
                Rotated {new Date(secret.lastRotatedAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
          {secret.description && (
            <p className="text-sm text-gray-600">{secret.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={viewSecret}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : showValue ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteSecret}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showValue && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <Label className="text-xs text-gray-600 mb-1 block">Decrypted Value (Sensitive)</Label>
          <code className="text-sm font-mono break-all">{decryptedValue}</code>
          <p className="text-xs text-red-600 mt-2">⚠️ Do not share or log this value</p>
        </div>
      )}

      {!showValue && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <code className="text-sm font-mono text-gray-500">{secret.maskedValue}</code>
        </div>
      )}
    </div>
  );
}

// Create Secret Dialog
function CreateSecretDialog({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: 'stripe',
    description: '',
    environment: 'production',
  });
  const [saving, setSaving] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const handleSubmit = async () => {
    if (!formData.key || !formData.value) {
      alert('Key and value are required');
      return;
    }

    try {
      setSaving(true);
      await api.post('/v1/admin/secrets', formData);
      alert('Secret created successfully!');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        key: '',
        value: '',
        category: 'stripe',
        description: '',
        environment: 'production',
      });
    } catch (error: any) {
      alert('Failed to create secret: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Secret</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Secret Key</Label>
            <Input
              placeholder="e.g., stripe.secret_key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Use dot notation: category.name</p>
          </div>

          <div>
            <Label>Secret Value</Label>
            <div className="flex gap-2">
              <Input
                type={showValue ? 'text' : 'password'}
                placeholder="Enter the secret value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowValue(!showValue)}
              >
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded-md p-2"
            >
              <option value="stripe">Stripe</option>
              <option value="smtp">SMTP</option>
              <option value="llm">LLM Providers</option>
              <option value="oauth">OAuth</option>
              <option value="database">Database</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label>Environment</Label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full border rounded-md p-2"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Input
              placeholder="What is this secret used for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Secret
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
