'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Flag,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];
    const addLog = (msg: string) => {
      try {
        console.log(msg);
        logs.push(msg);
        setDebugInfo([...logs]);
      } catch (e) {
        console.error('Error in addLog:', e);
      }
    };

    try {
      // Check if user is admin - check both admin_token and regular token
      addLog('=== Admin Layout: Checking authentication ===');
    
    const adminToken = localStorage.getItem('admin_token');
    const adminUserStr = localStorage.getItem('admin_user');
    const regularToken = localStorage.getItem('token');
    const regularUserStr = localStorage.getItem('user');
    
    addLog(`Tokens: admin=${!!adminToken}, adminUser=${!!adminUserStr}, token=${!!regularToken}, user=${!!regularUserStr}`);
    
    // Priority 1: Check admin_token (from admin login)
    if (adminToken && adminUserStr) {
      try {
        const userData = JSON.parse(adminUserStr);
        addLog(`Admin user email: ${userData.email}`);
        addLog(`Admin user isAdmin: ${userData.isAdmin}`);
        if (userData.isAdmin === true || userData.isAdmin === 'true') {
          addLog('✅ Admin access GRANTED via admin_token');
          setAdminUser(userData);
          setIsChecking(false);
          return;
        } else {
          addLog(`❌ Admin user does NOT have isAdmin flag (value: ${userData.isAdmin})`);
        }
      } catch (e) {
        addLog(`❌ Failed to parse admin user: ${e}`);
      }
    } else if (adminToken || adminUserStr) {
      addLog(`⚠️ Missing pair: token=${!!adminToken}, user=${!!adminUserStr}`);
    }
    
    // Priority 2: Check regular user with admin flag (only if no admin_token)
    if (!adminToken && regularToken && regularUserStr) {
      try {
        const userData = JSON.parse(regularUserStr);
        addLog(`Regular user email: ${userData.email}`);
        addLog(`Regular user isAdmin: ${userData.isAdmin}`);
        if (userData.isAdmin === true || userData.isAdmin === 'true') {
          addLog('✅ Admin access GRANTED via regular token');
          setAdminUser(userData);
          setIsChecking(false);
          return;
        } else {
          addLog(`❌ Regular user does NOT have isAdmin flag (value: ${userData.isAdmin})`);
        }
      } catch (e) {
        addLog(`❌ Failed to parse user: ${e}`);
      }
    } else if (!adminToken && (regularToken || regularUserStr)) {
      addLog(`⚠️ Missing pair: token=${!!regularToken}, user=${!!regularUserStr}`);
    }
    
    // No admin access - show debug info (NO AUTO REDIRECT)
    addLog('❌ NO ADMIN ACCESS DETECTED');
    addLog('Click the link below to login');
    setIsChecking(false);
    
    // DON'T redirect automatically - let user see the debug info
    // setTimeout(() => {
    //   router.push('/admin/login');
    // }, 3000);
    
    } catch (error) {
      console.error('Error in admin layout useEffect:', error);
      addLog(`❌ ERROR: ${error}`);
      setIsChecking(false);
      // DON'T redirect on error - let user see what went wrong
    }
  }, [router]);

  if (isChecking || !adminUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-8">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">Checking admin access...</p>
          </div>
          
          {/* Debug Info Display */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <div className="font-bold mb-2 text-green-300">🔍 Authentication Debug Log:</div>
            {debugInfo.map((log, i) => (
              <div key={i} className="py-1 border-b border-gray-800">
                {log}
              </div>
            ))}
            {debugInfo.length === 0 && (
              <div className="text-gray-500">Initializing...</div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-4">If you see "NO ADMIN ACCESS", you need to login or grant admin access.</p>
            <a 
              href="/admin/login" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Go to Admin Login
            </a>
            <p className="text-xs text-gray-500 mt-4">
              Or run in console: localStorage.clear() then login again
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    // Clear both admin and regular tokens
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Subscription Plans', href: '/admin/plans', icon: CreditCard },
    { name: 'Support Tickets', href: '/admin/tickets', icon: Ticket },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
    { name: 'Secrets Vault', href: '/admin/secrets', icon: Shield },
    { name: 'Feature Flags', href: '/admin/features', icon: Flag },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  // This duplicate check was causing issues - already handled above
  // if (!adminUser) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  //     </div>
  //   );
  // }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AF</span>
                </div>
                <div>
                  <div className="font-bold text-sm">ObjectaLabs</div>
                  <div className="text-xs text-gray-400">Admin Panel</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white mx-auto"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } ${!sidebarOpen && 'justify-center'}`}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-800 p-4">
          {sidebarOpen ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 text-left hover:bg-gray-800 p-2 rounded-lg transition-colors">
                  <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {adminUser.fullName?.[0] || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {adminUser.fullName || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {adminUser.email}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  User Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search customers, tickets..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                  {notifications}
                </Badge>
              )}
            </button>

            {/* Admin Badge */}
            <Badge className="bg-purple-100 text-purple-800 border border-purple-300">
              Super Admin
            </Badge>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
