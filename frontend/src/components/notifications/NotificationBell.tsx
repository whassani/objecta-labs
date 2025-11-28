'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

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

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    connectWebSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to notifications');
      // Subscribe to user notifications
      const userId = localStorage.getItem('userId');
      if (userId) {
        newSocket.emit('subscribe', { userId });
      }
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      }
    });

    newSocket.on('unreadCount', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    setSocket(newSocket);
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setOpen(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      default: return 'text-blue-600';
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex-col items-start gap-2 p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getCategoryIcon(notification.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${getCategoryColor(notification.category)}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-center text-sm text-blue-600 cursor-pointer"
          onClick={() => {
            router.push('/dashboard/notifications');
            setOpen(false);
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
