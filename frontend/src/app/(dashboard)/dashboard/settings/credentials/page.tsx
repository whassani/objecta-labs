'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Eye, EyeOff, Plus, Loader2, Save, Key, Lock, AlertTriangle, Info } from 'lucide-react';
import { api } from '@/lib/api';

interface Secret {
  id: string;
  key: string;
  maskedValue: string;
  category: string;
  description: string;
  organizationId: string;
  isPlatformSecret: boolean;
  createdAt: string;
}

export default function CredentialsPage() {
  const [loading, setLoading] = useState(true);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadOrganizationAndSecrets();
  }, []);

  const loadOrganizationAndSecrets = async () => {
    try {
      setLoading(true);
      
      // Get current user's organization
      const userResponse = await api.get('/auth/me');
      const orgId = userResponse.data.organizationId;
      
      if (!orgId) {
        console.error('User has no organization ID');
        alert('Your account is not associated with an organization. Please contact support.');
        return;
      }
      
      setOrganizationId(orgId);

      // Load organization secrets using the new endpoint
      const response = await api.get('/v1/credentials');
      setSecrets(response.data);
    } catch (error: any) {
      console.error('Failed to load credentials:', error);
      alert('Failed to load credentials: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your credentials...</p>
        </div>
      </div>
    );
  }

  const groupedSecrets = secrets.reduce((acc, secret) => {
    if (!acc[secret.category]) {
      acc[secret.category] = [];
    }
    acc[secret.category].push(secret);
    return acc;
  }, {} as Record<string, Secret[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8 text-blue-600" />
            API Credentials
          </h1>
          <p className="text-gray-600 mt-2">Securely store your API keys and credentials</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Your Private Credentials</p>
              <p className="text-sm text-blue-800">
                All credentials are encrypted and only accessible by your organization. Use your own API keys for LLM providers, SMTP, and other services.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {secrets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No credentials yet</h3>
            <p className="text-gray-500 mb-4">
              Add your API keys to use your own LLM providers, SMTP servers, and other services
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Credential
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Credentials by Category */}
      {Object.entries(groupedSecrets).map(([category, categorySecrets]) => (
        <CredentialSection
          key={category}
          category={category}
          secrets={categorySecrets}
          organizationId={organizationId}
          onReload={loadOrganizationAndSecrets}
        />
      ))}

      {/* Create Credential Dialog */}
      <CreateCredentialDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        organizationId={organizationId}
        onSuccess={loadOrganizationAndSecrets}
      />
    </div>
  );
}

// Credential Section Component
function CredentialSection({ 
  category, 
  secrets, 
  organizationId,
  onReload 
}: { 
  category: string; 
  secrets: Secret[];
  organizationId: string | null;
  onReload: () => void;
}) {
  const categoryIcons = {
    llm: <Key className="h-5 w-5" />,
    smtp: <Key className="h-5 w-5" />,
    oauth: <Lock className="h-5 w-5" />,
    other: <Key className="h-5 w-5" />,
  };

  const categoryTitles = {
    llm: 'LLM Providers (OpenAI, Anthropic, etc.)',
    smtp: 'Email / SMTP',
    oauth: 'OAuth Providers',
    other: 'Other Credentials',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {categoryIcons[category as keyof typeof categoryIcons] || <Key className="h-5 w-5" />}
          {categoryTitles[category as keyof typeof categoryTitles] || category}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {secrets.map((secret) => (
          <CredentialItem 
            key={secret.id} 
            secret={secret} 
            organizationId={organizationId}
            onReload={onReload} 
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Credential Item Component
function CredentialItem({ 
  secret, 
  organizationId,
  onReload 
}: { 
  secret: Secret; 
  organizationId: string | null;
  onReload: () => void;
}) {
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
      const response = await api.get(`/v1/credentials/${secret.key}`);
      setDecryptedValue(response.data.value);
      setShowValue(true);
    } catch (error: any) {
      alert('Failed to decrypt credential: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteSecret = async () => {
    if (!confirm(`Are you sure you want to delete "${secret.key}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/v1/credentials/${secret.key}`);
      alert('Credential deleted successfully');
      onReload();
    } catch (error: any) {
      alert('Failed to delete credential: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{secret.key}</code>
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
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </div>

      {showValue && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <Label className="text-xs text-gray-600 mb-1 block">Decrypted Value</Label>
          <code className="text-sm font-mono break-all">{decryptedValue}</code>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Keep this value secure. Do not share it.
          </p>
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

// Create Credential Dialog
function CreateCredentialDialog({ 
  isOpen, 
  onClose,
  organizationId, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  organizationId: string | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: 'llm',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const presets = {
    'openai.api_key': { category: 'llm', description: 'OpenAI API Key', placeholder: 'sk-...' },
    'anthropic.api_key': { category: 'llm', description: 'Anthropic API Key', placeholder: 'sk-ant-...' },
    'smtp.password': { category: 'smtp', description: 'SMTP Password', placeholder: 'Your SMTP password' },
    'custom': { category: 'other', description: '', placeholder: '' },
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setFormData({ ...formData, key: '', description: '' });
    } else {
      const presetData = presets[preset as keyof typeof presets];
      setFormData({ 
        ...formData, 
        key: preset,
        category: presetData.category,
        description: presetData.description,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.key || !formData.value) {
      alert('Name and value are required. Please fill in both fields.');
      return;
    }

    if (!organizationId) {
      alert('Organization ID not found. Please refresh the page or contact support.');
      return;
    }

    try {
      setSaving(true);
      
      console.log('Saving credential:', {
        key: formData.key,
        category: formData.category,
        organizationId,
        isPlatformSecret: false,
      });
      
      await api.post('/v1/credentials', {
        key: formData.key,
        value: formData.value,
        category: formData.category,
        description: formData.description,
        organizationId,
        isPlatformSecret: false,
        environment: 'production',
      });
      
      alert('✅ Credential saved successfully!');
      onSuccess();
      onClose();
      setFormData({ key: '', value: '', category: 'llm', description: '' });
    } catch (error: any) {
      console.error('Failed to save credential:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('❌ Failed to save credential: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Your API Credential</DialogTitle>
          <p className="text-gray-600 text-sm mt-2">
            Store your API keys, passwords, and tokens securely. Choose a preset or add a custom credential.
          </p>
        </DialogHeader>
        <div className="space-y-6">
          {/* Quick Preset Selector */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Label className="text-base font-semibold mb-2 block">Choose What to Add</Label>
            <select
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 bg-white"
            >
              <option value="">-- Select a service --</option>
              <option value="openai.api_key">🤖 OpenAI (ChatGPT, GPT-4)</option>
              <option value="anthropic.api_key">🧠 Anthropic (Claude)</option>
              <option value="smtp.password">📧 Email / SMTP Server</option>
              <option value="custom">🔧 Other / Custom</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Select a service to auto-fill the form, or choose "Other" for custom credentials
            </p>
          </div>

          {/* Name Field */}
          <div>
            <Label className="text-base font-semibold">Name / Identifier</Label>
            <Input
              placeholder="e.g., openai.api_key or my_service.token"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1.5">
              Internal name for this credential. Use format: <code className="bg-gray-100 px-1 py-0.5 rounded">service.credential_name</code>
            </p>
          </div>

          {/* API Key / Password Field */}
          <div>
            <Label className="text-base font-semibold">API Key / Password / Token</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type={showValue ? 'text' : 'password'}
                placeholder="Paste your API key, password, or token here"
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
            <p className="text-sm text-gray-600 mt-1.5">
              The actual secret value (e.g., <code className="bg-gray-100 px-1 py-0.5 rounded">sk-...</code> for OpenAI)
            </p>
          </div>

          {/* Category Field */}
          <div>
            <Label className="text-base font-semibold">Category</Label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 mt-2 bg-white"
            >
              <option value="llm">🤖 LLM Providers (OpenAI, Anthropic, etc.)</option>
              <option value="smtp">📧 Email / SMTP</option>
              <option value="oauth">🔐 OAuth / SSO</option>
              <option value="other">🔧 Other</option>
            </select>
            <p className="text-sm text-gray-600 mt-1.5">
              Group this credential with similar services
            </p>
          </div>

          {/* Description Field */}
          <div>
            <Label className="text-base font-semibold">Description (Optional)</Label>
            <Input
              placeholder="e.g., Production OpenAI key for agents"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1.5">
              Add notes to help you remember what this is for
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">🔒 Your Data is Secure</p>
                <p className="text-sm text-blue-800">
                  All credentials are encrypted with AES-256 encryption and stored securely. Only members of your organization can access them. We never see or store your credentials in plain text.
                </p>
              </div>
            </div>
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
                  Save Credential
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
