import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  green: 'bg-green-50 text-green-600 hover:bg-green-100',
  purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <div className={`p-4 border rounded-lg transition-colors cursor-pointer ${colorClasses[action.color]}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm">{action.title}</div>
                      <div className="text-xs opacity-80 mt-1">{action.description}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
