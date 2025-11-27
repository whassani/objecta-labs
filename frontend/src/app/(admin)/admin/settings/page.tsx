'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Database, Mail, Loader2, Save, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description: string;
  isPublic: boolean;
  isSensitive: boolean;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [changes, setChanges] = useState<Record<string, string>>({});
  
  // Extract specific settings
  const platformName = settings['platform.name']?.value || 'ObjectaLabs';
  const supportEmail = settings['contact.support_email']?.value || '';
  const maxUsersPerOrg = settings['limits.max_users_per_org']?.value || '10';
  const sessionTimeout = settings['security.session_timeout_minutes']?.value || '60';
  const maintenanceEnabled = settings['maintenance.enabled']?.value === 'true';
  const maintenanceMessage = settings['maintenance.message']?.value || '';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/admin/settings/system');
      
      // Convert array to object keyed by category.key
      const settingsMap: Record<string, SystemSetting> = {};
      response.data.forEach((setting: SystemSetting) => {
        settingsMap[`${setting.category}.${setting.key}`] = setting;
      });
      
      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      alert('Failed to load settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanges({ ...changes, [key]: value });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Save each changed setting
      for (const [key, value] of Object.entries(changes)) {
        const [category, settingKey] = key.split('.');
        await api.put(`/v1/admin/settings/system/${category}/${settingKey}`, { value });
      }
      
      alert('Settings saved successfully!');
      setChanges({});
      await loadSettings(); // Reload settings
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    try {
      await api.post('/v1/admin/settings/cache/clear');
      alert('Cache cleared successfully!');
    } catch (error: any) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Admin Settings
          </h1>
          <p className="text-gray-600 mt-2">Configure system-wide settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCache}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          {hasChanges && (
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>General platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Platform Name</Label>
                <Input 
                  value={changes['platform.name'] || platformName}
                  onChange={(e) => handleChange('platform.name', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {settings['platform.name']?.description}
                </p>
              </div>
              <div>
                <Label>Support Email</Label>
                <Input 
                  type="email" 
                  value={changes['contact.support_email'] || supportEmail}
                  onChange={(e) => handleChange('contact.support_email', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {settings['contact.support_email']?.description}
                </p>
              </div>
              <div>
                <Label>Max Users Per Organization</Label>
                <Input 
                  type="number" 
                  value={changes['limits.max_users_per_org'] || maxUsersPerOrg}
                  onChange={(e) => handleChange('limits.max_users_per_org', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {settings['limits.max_users_per_org']?.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">
                    {settings['notifications.email_enabled']?.description}
                  </p>
                </div>
                <Switch 
                  checked={settings['notifications.email_enabled']?.value === 'true'}
                  onCheckedChange={(checked) => handleChange('notifications.email_enabled', String(checked))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-600">
                    {settings['notifications.push_enabled']?.description}
                  </p>
                </div>
                <Switch 
                  checked={settings['notifications.push_enabled']?.value === 'true'}
                  onCheckedChange={(checked) => handleChange('notifications.push_enabled', String(checked))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">
                    {settings['maintenance.enabled']?.description}
                  </p>
                </div>
                <Switch 
                  checked={maintenanceEnabled}
                  onCheckedChange={(checked) => handleChange('maintenance.enabled', String(checked))}
                />
              </div>
              {maintenanceEnabled && (
                <div>
                  <Label>Maintenance Message</Label>
                  <Input 
                    value={changes['maintenance.message'] || maintenanceMessage}
                    onChange={(e) => handleChange('maintenance.message', e.target.value)}
                    placeholder="We are performing scheduled maintenance"
                  />
                </div>
              )}
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input 
                  type="number" 
                  value={changes['security.session_timeout_minutes'] || sessionTimeout}
                  onChange={(e) => handleChange('security.session_timeout_minutes', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {settings['security.session_timeout_minutes']?.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">System Maintenance</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearCache}>
                    Clear Settings Cache
                  </Button>
                  <Button variant="outline" onClick={loadSettings}>
                    Reload Settings
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Database Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Settings Count</p>
                    <p className="font-bold">{Object.keys(settings).length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Categories</p>
                    <p className="font-bold">
                      {new Set(Object.values(settings).map(s => s.category)).size}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
