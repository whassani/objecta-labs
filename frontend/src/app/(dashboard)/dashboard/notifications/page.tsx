'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Settings } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreference {
  id: string;
  notificationType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  emailFrequency: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notificationsResponse, preferencesResponse] = await Promise.all([
        api.get('/notifications?limit=50'),
        api.get('/notifications/preferences'),
      ]);
      setNotifications(notificationsResponse.data);
      setPreferences(preferencesResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleUpdatePreference = async (
    notificationType: string,
    updates: Partial<NotificationPreference>
  ) => {
    try {
      await api.post('/notifications/preferences', {
        notificationType,
        ...updates,
      });
      setPreferences(prev =>
        prev.map(p =>
          p.notificationType === notificationType ? { ...p, ...updates } : p
        )
      );
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-gray-600 mt-2">Manage your notifications and preferences</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>Your complete notification history</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getCategoryIcon(notification.category)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>Notifications you haven't read yet</CardDescription>
            </CardHeader>
            <CardContent>
              {unreadNotifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No unread notifications</p>
              ) : (
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getCategoryIcon(notification.category)}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { type: 'system', label: 'System Notifications', description: 'Updates and maintenance' },
                  { type: 'billing', label: 'Billing Alerts', description: 'Payment and subscription updates' },
                  { type: 'agent', label: 'Agent Updates', description: 'Agent performance and errors' },
                  { type: 'workflow', label: 'Workflow Results', description: 'Workflow execution status' },
                  { type: 'team', label: 'Team Activity', description: 'Team member actions' },
                ].map(({ type, label, description }) => {
                  const pref = preferences.find(p => p.notificationType === type);
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref?.inAppEnabled ?? true}
                            onCheckedChange={(checked) =>
                              handleUpdatePreference(type, { inAppEnabled: checked })
                            }
                          />
                          <Label className="text-sm">In-app</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref?.emailEnabled ?? true}
                            onCheckedChange={(checked) =>
                              handleUpdatePreference(type, { emailEnabled: checked })
                            }
                          />
                          <Label className="text-sm">Email</Label>
                        </div>
                        <Select
                          value={pref?.emailFrequency ?? 'immediate'}
                          onValueChange={(value) =>
                            handleUpdatePreference(type, { emailFrequency: value })
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
