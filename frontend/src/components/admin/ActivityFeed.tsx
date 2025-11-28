import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  CreditCard, 
  Ticket, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'user' | 'subscription' | 'ticket' | 'system';
  message: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'error';
}

interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
}

export function ActivityFeed({ activities, limit = 10 }: ActivityFeedProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'subscription':
        return <CreditCard className="h-4 w-4" />;
      case 'ticket':
        return <Ticket className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status?: Activity['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayedActivities = activities.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activity</span>
          <Badge variant="outline">{activities.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          ) : (
            displayedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="mt-0.5 p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {activity.status && (
                      <Badge className={getStatusColor(activity.status)} variant="outline">
                        {getStatusIcon(activity.status)}
                        <span className="ml-1">{activity.status}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
